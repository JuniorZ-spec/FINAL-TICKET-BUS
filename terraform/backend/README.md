# backend

Module **éphémère** : ECS Fargate (Spot) + ALB + secrets SSM. Dépend du
module `network` (déjà appliqué) via `terraform_remote_state`. RDS
rejoindra ce module en Phase 5.

```bash
# 1. network doit deja etre applique (meme session de demo)
cd terraform/network && terraform apply

# 2. backend
cd ../backend
cp terraform.tfvars.example terraform.tfvars   # remplir les secrets + le tag d'image
terraform init
terraform apply

terraform output alb_dns_name   # curl http://<alb-dns>/health
```

**Important** : sans RDS (Phase 5), le conteneur ne démarrera jamais
correctement — `backend/server.ts` fait `await prisma.$connect()` avant
d'ouvrir le port, et `process.exit(1)` si ça échoue. Le service ECS va
donc boucler en recréant des tâches qui crashent tant que `database_url`
ne pointe pas vers une vraie base joignable. C'est attendu tant que la
Phase 5 n'est pas faite — vérifiable via les logs CloudWatch
(`/ecs/ticketbus-backend`).
