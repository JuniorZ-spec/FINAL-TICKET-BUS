# async

Module **éphémère**, dernier de la chaîne (`network` → `backend` →
`async`). SQS FIFO + DLQ + Lambda (container image) qui traite les
demandes de réservation.

```bash
cd terraform/async
cp terraform.tfvars.example terraform.tfvars   # alert_email + tag d'image Lambda
terraform init
terraform apply
```

La garantie "zéro double réservation" du projet repose sur la contrainte
`@@unique([tripId, seat])` de `BookingSeat` (voir
`backend/prisma/schema.prisma`), appliquée dans une transaction par
`lambda/booking-processor/index.ts` — pas sur l'ordre FIFO de la queue,
qui n'est qu'une première ligne de défense.
