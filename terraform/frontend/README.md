# frontend

Module **permanent** : S3 (privé, OAC) + CloudFront (domaine
`*.cloudfront.net` par défaut, pas d'ACM/domaine perso). Reste en place
entre les sessions de démo — c'est la seule partie de l'app toujours
accessible.

```bash
cd terraform/frontend
terraform init
terraform apply
```

Le déploiement du contenu (`aws s3 sync` + invalidation CloudFront) se fait
via `.github/workflows/deploy.yml`, automatiquement à chaque push sur
`main`/`develop` — contrairement à l'infra backend (éphémère), le frontend
est toujours en ligne donc autant le tenir à jour en continu.

Tant que la Phase 4 (ECS/ALB) n'existe pas, l'app chargera mais les appels
`/api/*` échoueront — normal, il n'y a pas encore d'API à joindre.
