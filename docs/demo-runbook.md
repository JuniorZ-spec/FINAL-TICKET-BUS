# Runbook de démo — TICKET-BUS sur AWS

Séquence complète pour lancer une session de démo, la vérifier, puis tout
détruire. Rempli au fil des phases (voir `docs/decisions.md` pour le detail
des choix).

## 1. Builder et pousser les images à jour

Le tag d'image ECR est explicite (repo immutable, pas de `latest`) — build
avant de toucher à l'infra :

```bash
aws ecr get-login-password --region eu-west-3 | docker login --username AWS --password-stdin <account>.dkr.ecr.eu-west-3.amazonaws.com

SHA=$(git rev-parse --short=12 HEAD)
docker build --provenance=false --sbom=false -t <account>.dkr.ecr.eu-west-3.amazonaws.com/ticketbus-backend:sha-$SHA ./backend
docker push <account>.dkr.ecr.eu-west-3.amazonaws.com/ticketbus-backend:sha-$SHA

docker build --provenance=false --sbom=false -f lambda/booking-processor/Dockerfile -t <account>.dkr.ecr.eu-west-3.amazonaws.com/ticketbus-lambda-booking:sha-$SHA .
docker push <account>.dkr.ecr.eu-west-3.amazonaws.com/ticketbus-lambda-booking:sha-$SHA
```

`--provenance=false --sbom=false` est nécessaire pour l'image Lambda : le
manifeste OCI avec attestations (généré par défaut par Buildx) est rejeté
par `lambda:CreateFunction` (voir `docs/decisions.md` Phase 6).

## 2. Lancer l'infra éphémère

```bash
# Ordre obligatoire : network -> backend -> async (chacun depend du precedent)
cd terraform/network && terraform apply -auto-approve

cd ../backend
cp terraform.tfvars.example terraform.tfvars   # secrets + backend_image_tag = sha-<SHA>
terraform apply -auto-approve
terraform output alb_dns_name

cd ../async
cp terraform.tfvars.example terraform.tfvars   # alert_email + lambda_image_tag = sha-<SHA>
terraform apply -auto-approve
```

## 3. Migration + seed de la base

Pas de SG ouvert vers ton IP : tout tourne comme une tâche ECS one-off,
dans le même réseau que le service (accès à RDS via `ecs-sg`). Les
scripts compilés vivent sous `dist/scripts/` dans l'image, pas `scripts/`
directement.

```bash
cd terraform/backend
CLUSTER=$(terraform output -raw ecs_cluster_name)
TASKDEF=$(terraform output -raw task_definition_arn)
SUBNETS=$(terraform output -json public_subnet_ids | tr -d '[]"\n')
SG=$(terraform output -raw ecs_sg_id)

aws ecs run-task \
  --cluster "$CLUSTER" \
  --task-definition "$TASKDEF" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "backend",
      "command": ["sh", "-c", "npx prisma migrate deploy && node dist/scripts/seedAdmin.js && node dist/scripts/seedDemoData.js"],
      "environment": [
        {"name": "ADMIN_EMAIL", "value": "admin@example.com"},
        {"name": "ADMIN_PASSWORD", "value": "<mot-de-passe-a-choisir>"}
      ]
    }]
  }'
```

Suivre les logs dans CloudWatch (`/ecs/ticketbus-backend`) pour confirmer
`All migrations have been successfully applied`, `Admin créé avec succès`,
puis le trajet + voyageur de démo créés par `seedDemoData.js`.

## 4. Vérification santé

```bash
curl http://$(cd terraform/backend && terraform output -raw alb_dns_name)/health
# {"status":"ok"}
```

## 5. Test de charge k6

Si le trajet de démo a déjà des réservations d'un test précédent, générer
un trajet vierge d'abord (sinon le compte de confirmations/refus ne
tombera pas juste sur 40/10) :

```bash
# meme run-task que ci-dessus, command: ["sh", "-c", "node dist/scripts/seedFreshTrip.js"]
```

```bash
k6 run --env BASE_URL=http://<alb-dns> loadtest/booking-race.js
```

Résultat attendu (voir `docs/decisions.md` Phase 7 pour le run réel) :
`booking_confirmed: 40`, `booking_rejected: 10`, `booking_enqueue_errors: 0`,
`booking_timed_out: 0`. Vérification indépendante en base :

```sql
SELECT "tripId", seat, COUNT(*) FROM "BookingSeat" GROUP BY "tripId", seat HAVING COUNT(*) > 1;
-- doit etre vide
```

## 6. Tout détruire

Ordre inverse de la création — `async` puis `backend` puis `network`.
`bootstrap`, `ecr` et `frontend` restent en place en permanence.

```bash
cd terraform/async && terraform destroy -auto-approve      # Phase 6
cd ../backend && terraform destroy -auto-approve
cd ../network && terraform destroy -auto-approve
```

Vérification que plus rien ne tourne : `aws ecs list-clusters`,
`aws rds describe-db-instances`, `aws ec2 describe-vpcs --filters
"Name=tag:project,Values=ticketbus"` ne doivent rien retourner
(ou seulement des ressources déjà supprimées / en état `deleting`).

## Suivi des coûts par session

| Date | Durée | Ressources | Coût observé |
| --- | --- | --- | --- |
| _(à remplir après la première session complète)_ | | | |
