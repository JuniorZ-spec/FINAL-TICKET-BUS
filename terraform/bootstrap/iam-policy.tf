# Permissions du role gha-ticketbus-deploy, etendues phase par phase (un
# statement ajoute par service AWS introduit : Terraform state en Phase 0,
# ECR en Phase 2, S3/CloudFront en Phase 3, ECS/SSM en Phase 4, RDS en
# Phase 5, SQS/Lambda en Phase 6) — plutot qu'un acces large donne d'un
# coup. C'est la pratique du moindre privilege appliquee de facon
# incrementale, visible dans l'historique git.

data "aws_iam_policy_document" "gha_deploy_permissions" {
  statement {
    sid    = "TerraformStateBucket"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.terraform_state.arn,
      "${aws_s3_bucket.terraform_state.arn}/*",
    ]
  }

  statement {
    sid    = "TerraformStateLock"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
    resources = [aws_dynamodb_table.terraform_locks.arn]
  }

  # Phase 2 : la CI construit et pousse les images Docker (backend +
  # Lambda de reservation) vers ECR. GetAuthorizationToken s'authentifie
  # aupres du registre ; AWS exige "*" pour cette action precise, elle ne
  # peut pas etre scopee a un repo (limitation documentee de l'API ECR).
  # Le reste est scope par convention de nommage aux repos de ce projet.
  statement {
    sid       = "EcrAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "EcrPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = [
      "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/ticketbus-*",
    ]
  }

  # Phase 3 : la CD synchronise client/dist vers le bucket frontend et
  # invalide le cache CloudFront a chaque deploiement. Le nom du bucket est
  # previsible (choisi par nous, terraform/frontend/main.tf) donc scopable
  # precisement ; l'ID de distribution CloudFront est genere par AWS et
  # inconnu a l'avance, donc CreateInvalidation reste au niveau du service -
  # CloudFront ne supporte pas de scoping plus fin sans connaitre l'ID.
  statement {
    sid    = "FrontendSync"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::ticketbus-frontend-${data.aws_caller_identity.current.account_id}",
      "arn:aws:s3:::ticketbus-frontend-${data.aws_caller_identity.current.account_id}/*",
    ]
  }

  statement {
    sid       = "FrontendCacheInvalidation"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "gha_deploy" {
  name   = "gha-ticketbus-deploy-permissions"
  role   = aws_iam_role.gha_deploy.id
  policy = data.aws_iam_policy_document.gha_deploy_permissions.json
}
