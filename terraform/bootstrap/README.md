# bootstrap

Module appliqué **une seule fois, à la main**, avant tout le reste. Il crée
les ressources dont tous les autres modules dépendent :

- le bucket S3 + table DynamoDB qui serviront de backend Terraform (state +
  lock) pour `network`, `ecr`, `frontend`, `backend`, `async`
- le provider OIDC GitHub + le role IAM `gha-ticketbus-deploy` que la CI/CD
  assume pour déployer (Phase 2)
- l'alarme de budget AWS (40$/55$ sur les 60$ de crédits)

C'est un module poule-et-œuf : il ne peut pas lui-même utiliser le backend
S3 qu'il crée, donc son state reste **local** (`terraform.tfstate`, ignoré
par git). Une fois appliqué, il ne devrait presque plus changer.

## Usage

```bash
cd terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars   # renseigner ton email
terraform init
terraform plan
terraform apply
```

Note les valeurs de `terraform output` (en particulier `gha_deploy_role_arn`)
— elles serviront à configurer les secrets GitHub Actions en Phase 2 et le
backend S3 des modules suivants.

## Destroy ?

Non. Ce module n'est **jamais détruit** entre deux sessions de démo — il
contient le state Terraform des autres modules et le role de déploiement.
Seuls `network`, `backend`, `async` (et éventuellement `ecr`) sont détruits
après chaque démo.
