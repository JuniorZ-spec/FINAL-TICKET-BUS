# ecr

Module **permanent** (comme `bootstrap`), appliqué une fois à la main.
Crée les repos `ticketbus-backend` et `ticketbus-lambda-booking`, tag
immutable, scan-on-push, lifecycle policy (purge images non taguées après
7 jours, garde les 10 dernières taguées).

```bash
cd terraform/ecr
terraform init
terraform apply
```

Pas de `latest` : chaque image est taguée `sha-<commit>`, poussée par la CI
(`.github/workflows/deploy.yml`), et le déploiement référence explicitement
ce tag — pas de pointeur mutable.
