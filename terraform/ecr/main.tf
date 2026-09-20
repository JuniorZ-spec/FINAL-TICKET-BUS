# 2 repos : l'image backend (Fargate) et l'image de la Lambda de reservation
# (Phase 6, container image Lambda). scan_on_push declenche un scan Trivy-like
# gere par AWS (Amazon Inspector) a chaque push, en plus du Trivy explicite
# lance dans ci.yml avant meme d'atteindre ECR.

locals {
  repositories = ["ticketbus-backend", "ticketbus-lambda-booking"]
}

resource "aws_ecr_repository" "this" {
  for_each = toset(local.repositories)

  name                 = each.value
  image_tag_mutability = "IMMUTABLE" # un tag = une image, jamais ecrase silencieusement.
  # Consequence assumee : pas de tag "latest" flottant (il serait rejete par
  # IMMUTABLE des le 2e push). Le CD tague chaque image "sha-<commit>" et
  # le deploiement reference explicitement ce sha - tracabilite exacte de
  # ce qui tourne, plutot qu'un pointeur mutable.

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Cout de stockage ECR non nul (facture au Go) : on purge les images non
# taguees (issues de builds intermediaires) apres 7 jours, et on garde au
# plus les 10 dernieres images taguees par repo.
resource "aws_ecr_lifecycle_policy" "this" {
  for_each = aws_ecr_repository.this

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Purge les images non taguees apres 7 jours"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Garde au plus 10 images taguees"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["sha-"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = { type = "expire" }
      }
    ]
  })
}
