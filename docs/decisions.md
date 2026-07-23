# Journal de décisions techniques — Migration cloud AWS

Un choix technique + sa raison, et les résultats chiffrés observés, ajoutés
au fil des phases. Voir le plan complet dans la conversation pour le détail
de chaque phase.

---

## Phase 0 — Fondations

**Contexte de départ (audit du repo) :**

- `terraform/main.tf` n'était qu'un stub (provider + référence à un backend
  S3 jamais créé) — aucune ressource réelle n'existait en Terraform malgré
  un déploiement EC2 antérieur fait à la main / en SSH.
- `deploy.yml` utilisait des clés AWS statiques (`AWS_ACCESS_KEY_ID` /
  `AWS_SECRET_ACCESS_KEY`) et un compte AWS en dur dans le script SSH.
- **Bug de fond trouvé dans `bookingController.ts`** : la confirmation de
  réservation (`bookSeat`) relit les bookings actifs et vérifie l'absence de
  conflit en JS, sans contrainte DB ni transaction sérialisée → race
  condition TOCTOU classique. C'est la raison technique, pas seulement
  organisationnelle, de migrer vers SQS+Lambda (Phase 6) : la garantie doit
  venir d'une contrainte DB (`@@unique`), pas d'un simple ordre de queue.

**Décisions :**

| Choix | Raison |
| --- | --- |
| Terraform en modules séparés (`bootstrap`, `network`, `ecr`, `frontend`, `backend`, `async`), un state par module | Un `terraform destroy` de session de démo (network/backend/async) ne doit jamais pouvoir toucher le state du frontend permanent ou du bootstrap — isoler le blast radius. |
| `bootstrap` en state **local**, appliqué à la main, jamais détruit | Poule-et-œuf : il crée le backend S3 que les autres modules utilisent, donc il ne peut pas l'utiliser lui-même. |
| OIDC GitHub Actions plutôt que clés IAM statiques | Élimine un secret longue durée à faire fuiter ; jetons de session, scope limité aux branches `main`/`develop` du repo exact. |
| IAM policy du role de déploiement construite incrémentalement (1 statement ajouté par phase) | Moindre privilège visible dans l'historique git, plutôt qu'un accès large donné d'un coup par confort. |
| Budget AWS sans filtre par tag (suivi du compte entier) | Le compte AWS ne sert qu'à ce projet ; éviter le délai d'activation des cost allocation tags. |
| RDS en subnet public + Security Group verrouillé (pas de NAT Gateway) | Contrainte des 60$ de crédits — un NAT Gateway coûte ~0,045$/h même éphémère. Compromis assumé et documenté, pas un oubli. |

**Point de vigilance découvert pendant l'audit** : le compte AWS connecté en
CLI (`915993062361`, utilisateur IAM `IAM-HOME-ENERGY`) correspond bien au
compte déjà référencé en dur dans l'ancien `deploy.yml` — mais le nom de
l'utilisateur IAM suggère que ce compte a peut-être servi à d'autres projets
avant celui-ci. À confirmer avant tout `terraform apply` réel.

**Résultat de l'apply réel (2026-07-22) :**

```
state_bucket        = ticketbus-terraform-state-915993062361
lock_table          = ticketbus-terraform-locks
gha_deploy_role_arn = arn:aws:iam::915993062361:role/gha-ticketbus-deploy
aws_account_id      = 915993062361
```

9 ressources créées, 0 erreur au final. Coût observé : ~0$ (S3, DynamoDB
PAY_PER_REQUEST, IAM et Budgets sont gratuits ou quasi gratuits à ce niveau
d'usage).

**Incident rencontré** : le premier `apply` a échoué à mi-parcours
(`AccessDenied` sur `s3:CreateBucket`, `dynamodb:CreateTable`,
`budgets:ModifyBudget`) — l'utilisateur IAM connecté (`IAM-HOME-ENERGY`,
compte partagé avec d'autres projets) n'avait pas de droits d'admin. Seuls
le provider OIDC et le role `gha-ticketbus-deploy` avaient été créés lors de
cette première tentative. Correction : attachement de la policy managée
`AdministratorAccess` à cet utilisateur (nécessaire car les applies locaux
de ce projet, faits avec ce user, doivent pouvoir créer tout type de
ressource au fil des phases — VPC, ECS, RDS, IAM roles applicatifs, etc.).
Le role `gha-ticketbus-deploy` assumé par la CI, lui, reste volontairement
scopé finement (voir `iam-policy.tf`) — c'est lui qui illustre le moindre
privilège pour la démo, pas le user humain.

**Action manuelle restante** : activer le cost allocation tag `project`
dans la console AWS (Billing > Cost allocation tags), sinon le filtre du
budget (`tag=project:ticketbus`) ne remonte aucune dépense pendant ~24h
après la première ressource taguée créée.

---

## Phase 1 — Réseau

**Bug rencontré et corrigé** : la description d'un `aws_security_group`
(champ `GroupDescription`) doit être ASCII pur — les caractères accentués
et le tiret cadratin (—) sont rejetés par l'API EC2. Pire, le champ
`description` d'une règle `ingress`/`ingress` individuelle est encore plus
restrictif : regex `^[0-9A-Za-z_ .:/()#,@\[\]+=&;{}!$*-]*$`, qui exclut
même l'apostrophe. Toutes les descriptions de `terraform/network/security-groups.tf`
ont été réécrites en ASCII simple sans apostrophe. Les `description` de
`variable` Terraform (metadata, jamais envoyées à l'API AWS) peuvent rester
accentuées sans problème.

**Résultat de l'apply réel** : les 11 ressources (VPC `vpc-06945838d0a7b3749`,
IGW, 2 subnets publics, route table + 2 associations, 4 security groups)
ont été créées avec succès sur AWS, vérifiées, puis un `terraform destroy`
a été lancé immédiatement (module éphémère, rien à garder à ce stade).

**⚠️ État à la pause de cette session** : le `terraform destroy` a échoué
de façon répétée (`Error: Failed to load plugin schemas... timeout while
waiting for plugin to start`) — pas un bug de code, mais un problème de
ressources système sur la machine locale : ~653 Mo de RAM libre sur ~20 Go
(>96% utilisée) et 13 Go de disque libre sur 379 Go (97% plein) au moment
du diagnostic. Chaque commande (terraform, aws cli, systeminfo) devenait
anormalement lente ou timeout, y compris des appels en lecture seule.

**Le VPC et ses ressources associées existent donc toujours sur AWS au
moment de la pause.** Aucun risque financier : VPC, subnets, IGW, route
table et security groups sont 100% gratuits, indéfiniment. Mais ils doivent
être détruits proprement dès que la machine a retrouvé des ressources
disponibles — reprendre avec :

```bash
cd terraform/network
terraform destroy -auto-approve
```

Vérification que c'est bien fait : `terraform state list` doit être vide,
ou `aws ec2 describe-vpcs --filters "Name=tag:project,Values=ticketbus"`
ne doit rien retourner.

**Mise à jour** : machine libérée (5,3 Go RAM / 28 Go disque), destroy
relancé avec succès — `Destroy complete! Resources: 11 destroyed.` Le VPC
n'existe plus. Phase 1 clôturée.

---

## Phase 2 — CI/CD : OIDC, Trivy, ECR

**Découverte pendant l'audit AWS** : en vérifiant l'état réel du compte
avant de toucher à ECR, `aws ec2 describe-instances` a révélé 5 instances
EC2 sur le compte, dont l'ancienne `ticket-bus` (celle du déploiement SSH
historique) — **stoppée**, donc pas de coût compute actif. Une seule
instance tourne (`home-energy-tracker-prod`), sans rapport avec ce projet —
confirme que le compte est bien partagé, comme suspecté en Phase 0. Aucune
action prise dessus.

**Repo ECR `ticketbus-backend` déjà existant** (créé le 2026-05-05 par
l'ancien pipeline, 25 images dont plusieurs taguées par sha de commit,
`MUTABLE`, scan désactivé) — importé dans Terraform (`terraform import`)
plutôt que recréé, pour ne perdre aucun historique. L'apply qui a suivi n'a
fait que changer `MUTABLE → IMMUTABLE` et activer `scan_on_push` — aucune
image supprimée par ce changement (seule la lifecycle policy, appliquée à
part, purge maintenant les images non taguées après 7 jours et garde les 10
dernières taguées).

**Décisions :**

| Choix | Raison |
| --- | --- |
| Pas de tag `latest` en sortie de CD, uniquement `sha-<commit>` | Repos ECR `IMMUTABLE` : un tag ne peut être poussé qu'une fois. Un tag `latest` mutable serait de toute façon rejeté au 2e push. Traçabilité exacte de ce qui tourne. |
| `deploy.yml` ne fait que build+push vers ECR à chaque push main/develop, plus de `terraform apply`/`ecs update-service` automatique | Écart assumé par rapport au plan initial : l'infra est éphémère par design (rien ne tourne en dehors d'une session de démo), donc un déploiement automatique à chaque push n'aurait rien à déployer avant la Phase 4. Le déploiement réel restera déclenché à la main (`workflow_dispatch` ou runbook local, Phase 8). |
| Suppression totale du step SSH vers EC2 dans `deploy.yml` | Obsolète : la cible n'est plus une EC2 mais ECS Fargate (Phase 4). |
| IAM policy du role CI étendue avec 2 statements ECR (`GetAuthorizationToken` en `Resource: *` — obligatoire côté AWS, non scopable — puis push scopé à `repository/ticketbus-*`) | Continuité du moindre privilège incrémental commencé en Phase 0. |

**Bug AWS rencontré** : les descriptions de `aws_security_group` (Phase 1)
doivent être ASCII, et les descriptions de règles `ingress` interdisent en
plus l'apostrophe (regex stricte côté API EC2) — corrigé dans
`terraform/network/security-groups.tf`.

**Action manuelle restante (GitHub)** : dans les settings du repo GitHub
(Settings → Secrets and variables → Actions) :
- Ajouter le secret `AWS_DEPLOY_ROLE_ARN` = `arn:aws:iam::915993062361:role/gha-ticketbus-deploy`
- Supprimer les secrets obsolètes : `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ECR_REGISTRY`, `EC2_HOST`, `EC2_SSH_KEY`

**Résultat de l'apply réel** : module `ecr` (2 repos, dont 1 importé) et
mise à jour de `bootstrap` (policy IAM) appliqués avec succès. Coût
observé : ~0$ (stockage ECR facturé au Go, négligeable pour 26 images
légères, purge automatique désormais active).

---

## Phase 3 — Frontend S3 + CloudFront

**⚠️ Bloqué sur un problème de compte AWS, pas de code.** Le
`terraform apply` du module `frontend` échoue à la création de la
distribution CloudFront :

```
AccessDenied: Your account must be verified before you can add new
CloudFront resources. To verify your account, please contact AWS Support.
```

Ce compte AWS n'a pas encore été "vérifié" par AWS pour utiliser
CloudFront (restriction indépendante des permissions IAM — l'utilisateur a
`AdministratorAccess`). Il faut ouvrir un ticket AWS Support (console →
Support → Create case) pour débloquer.

**État réel créé avant le blocage** (gratuit) : bucket S3 privé
`ticketbus-frontend-915993062361`, Origin Access Control, blocage d'accès
public, versioning. La distribution CloudFront et la bucket policy (qui en
dépend) n'existent pas encore.

**Reprendre une fois le compte vérifié :**

```bash
cd terraform/frontend
terraform apply
```

Puis configurer les variables du repo GitHub (Settings → Secrets and
variables → Actions → Variables, pas Secrets — ce ne sont pas des valeurs
sensibles) à partir des outputs Terraform : `FRONTEND_BUCKET` =
`bucket_name`, `CLOUDFRONT_DISTRIBUTION_ID` = `cloudfront_distribution_id`.

**Décision prise en écrivant le code** (avant de découvrir ce blocage) :
pas de domaine personnalisé — le domaine `*.cloudfront.net` généré par AWS
suffit pour une démo, évite d'avoir besoin d'un certificat ACM. `deploy.yml`
synchronise `client/dist` vers S3 et invalide le cache CloudFront
automatiquement à chaque push (contrairement au backend éphémère, le
frontend reste en ligne en permanence, donc ça a du sens de le tenir à
jour en continu).

---

## Phase 4 + 5 — ECS Fargate + ALB + SSM + RDS (traitées ensemble)

**Pourquoi combinées** : `backend/server.ts` fait `await prisma.$connect()`
avant d'ouvrir le port — sans RDS déjà vivante, aucun moyen de vérifier
que le service ECS devient réellement healthy. Le module Terraform
`terraform/backend` contient donc ECS+ALB+RDS+SSM ensemble (comme prévu
dans le tableau de modules du plan initial), testés en un seul cycle
apply → vérification → (destroy à venir).

**Bug rencontré** : `engine_version = "16.4"` pour RDS Postgres
n'existe pas dans `eu-west-3` (`InvalidParameterCombination`). Corrigé en
listant les versions réellement disponibles
(`aws rds describe-db-engine-versions`) → `16.9`.

**Résultat de l'apply réel** : 18+4 ressources créées (cluster ECS Fargate
Spot, ALB, target group, task definition, service, 2 rôles IAM, log group
CloudWatch, 4 paramètres SSM SecureString, RDS `db.t4g.micro`). RDS a pris
6m40s à provisionner — le plus long de toute l'infra.

**Vérification bout-en-bout réussie :**
- `curl http://<alb-dns>/health` → `{"status":"ok"}` en HTTP 200 — la
  chaîne complète ALB → ECS Fargate → RDS fonctionne réellement.
- Migration + seed exécutés via une tâche ECS one-off (pas de SG ouvert
  vers une IP perso, voir `docs/demo-runbook.md`) : `prisma migrate deploy`
  puis `seedAdmin.js`, logs CloudWatch confirmés.
- **Point important pour la suite** : l'image Docker déployée
  (`sha-795b4a6...`, celle de la branche `develop` au moment du build) ne
  contient qu'**une seule migration** (`20260427191526_init`) — les tables
  `BookingRequest`/`BookingSeat` ajoutées dans cette session ne sont pas
  encore dans l'image. Il faudra rebuild+push une image à jour (via la CD
  une fois le secret GitHub configuré, ou manuellement) avant de pouvoir
  tester la Phase 6.

**Bug d'environnement local rencontré (sans rapport avec Terraform)** :
`aws logs get-log-events` échouait avec deux erreurs différentes sous
Git Bash/Windows :
1. `InvalidParameterException` sur `logGroupName` — Git Bash convertit
   automatiquement les arguments commençant par `/` en chemins Windows
   avant de les passer à l'exe AWS CLI. Fix : préfixer la commande avec
   `MSYS_NO_PATHCONV=1`.
2. `'charmap' codec can't encode characters` — la console Windows locale
   (cp1252) ne sait pas afficher les caractères accentués/emoji présents
   dans les logs applicatifs (ex: "Connecté à Redis ✅"). Fix : rediriger
   la sortie vers un fichier plutôt que la laisser s'imprimer dans le
   terminal.

**Coût réel engagé** : RDS `db.t4g.micro` + ALB tournent activement depuis
cet apply (pas gratuits, contrairement à tout ce qui précède) — à détruire
dès la fin des vérifications, ou à garder brièvement si on enchaîne
directement sur la Phase 6 pour éviter de re-provisionner RDS (6-7 min)
deux fois de suite.
