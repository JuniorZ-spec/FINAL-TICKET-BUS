# Infrastructure Terraform — TICKET-BUS

Un module par domaine, chacun avec son propre state (backend S3 créé par
`bootstrap`). Pas de multi-environnement : un seul environnement `demo`.

| Module      | Contenu                                              | Persistant ou éphémère ?         |
| ----------- | ----------------------------------------------------- | --------------------------------- |
| `bootstrap` | State S3+lock, OIDC GitHub, role de déploiement, budget | **Permanent** (appliqué une fois) |
| `network`   | VPC, subnets publics, security groups                 | Éphémère (par session de démo)    |
| `ecr`       | Repos ECR (backend, lambda-booking)                    | Permanent (stockage ~cents/mois)  |
| `frontend`  | S3 + CloudFront                                        | **Permanent**                     |
| `backend`   | ECS Fargate, ALB, RDS                                  | Éphémère (par session de démo)    |
| `async`     | SQS FIFO, DLQ, Lambda                                  | Éphémère (par session de démo)    |

## Ordre d'application

1. `bootstrap` (une fois, à la main)
2. `ecr` et `frontend` (une fois, restent en place)
3. `network` → `backend` → `async` (à chaque session de démo, puis `destroy`
   dans l'ordre inverse)

Le détail de chaque module arrive phase par phase — voir
`docs/decisions.md` pour le journal des choix et `docs/demo-runbook.md`
(Phase 8) pour la séquence exacte de démo.
