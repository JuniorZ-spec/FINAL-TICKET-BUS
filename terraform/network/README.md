# network

VPC minimal : 2 subnets publics (2 AZ), pas de subnet privé, pas de NAT
Gateway. Security groups en chaîne `internet → alb-sg → ecs-sg/lambda-sg →
rds-sg`.

Module éphémère : appliqué au début d'une session de démo, détruit à la fin
(avec `backend` et `async`). Ordre : `network` en premier (rien n'en
dépend), détruit en dernier (tout en dépend).

```bash
cd terraform/network
terraform init
terraform plan
terraform apply
# ... session de démo ...
terraform destroy
```
