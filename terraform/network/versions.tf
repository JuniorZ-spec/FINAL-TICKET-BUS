terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend créé par le module bootstrap (Phase 0). Le nom du bucket
  # embarque l'account ID pour garantir l'unicité globale S3 — ce n'est pas
  # un secret (contrairement à une clé d'accès), donc pas de souci à le
  # committer tel quel. Un `key` différent par module isole les states.
  backend "s3" {
    bucket         = "ticketbus-terraform-state-915993062361"
    key            = "demo/network.tfstate"
    region         = "eu-west-3"
    dynamodb_table = "ticketbus-terraform-locks"
    encrypt        = true
  }
}
