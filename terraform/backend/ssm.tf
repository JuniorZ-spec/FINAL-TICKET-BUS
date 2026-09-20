locals {
  ssm_prefix = "/ticketbus"
}

resource "aws_ssm_parameter" "database_url" {
  name  = "${local.ssm_prefix}/database_url"
  type  = "SecureString"
  value = local.database_url # construit depuis l'endpoint RDS reel, voir rds.tf
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "${local.ssm_prefix}/jwt_secret"
  type  = "SecureString"
  value = var.jwt_secret
}

resource "aws_ssm_parameter" "email" {
  name  = "${local.ssm_prefix}/email"
  type  = "SecureString"
  value = var.email
}

resource "aws_ssm_parameter" "email_pass" {
  name  = "${local.ssm_prefix}/email_pass"
  type  = "SecureString"
  value = var.email_pass
}
