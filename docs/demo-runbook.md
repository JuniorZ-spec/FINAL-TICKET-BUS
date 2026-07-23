# Runbook de démo — TICKET-BUS sur AWS

Séquence complète pour lancer une session de démo, la vérifier, puis tout
détruire. Rempli au fil des phases (voir `docs/decisions.md` pour le detail
des choix).

## 1. Lancer l'infra éphémère

```bash
# Ordre obligatoire : network -> backend -> async (chacun depend du precedent)
cd terraform/network && terraform apply -auto-approve

cd ../backend
cp terraform.tvars.example terraform.tfvars   # secrets + tag d'image a jour
terraform apply -auto-approve
terraform output alb_dns_name
```

## 2. Migration + seed de la base

Pas de SG ouvert vers ton IP : la migration tourne comme une tâche ECS
one-off, dans le même réseau que le service (accès à RDS via `ecs-sg`).

```bash
cd terraform/backend
CLUSTER=$(terraform output -raw ecs_cluster_name)
TASKDEF=$(terraform output -raw task_definition_arn)
SUBNETS=$(terraform output -json public_subnet_ids | tr -d '[]"\n' )
SG=$(terraform output -raw ecs_sg_id)

aws ecs run-task \
  --cluster "$CLUSTER" \
  --task-definition "$TASKDEF" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "backend",
      "command": ["sh", "-c", "npx prisma migrate deploy && node scripts/seedAdmin.js"],
      "environment": [
        {"name": "ADMIN_EMAIL", "value": "admin@example.com"},
        {"name": "ADMIN_PASSWORD", "value": "<mot-de-passe-a-choisir>"}
      ]
    }]
  }'
```

Suivre les logs dans CloudWatch (`/ecs/ticketbus-backend`) pour confirmer
`Your database is now in sync with your schema` puis `Admin créé avec
succès`.

## 3. Vérification

```bash
curl http://$(cd terraform/backend && terraform output -raw alb_dns_name)/health
# {"status":"ok"}
```

## 4. Test de charge k6

_(Phase 7 — à compléter)_

## 5. Tout détruire

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
