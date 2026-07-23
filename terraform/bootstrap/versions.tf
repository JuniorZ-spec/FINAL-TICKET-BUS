terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Pas de backend S3 ici volontairement : ce module CRÉE le bucket que les
  # autres modules utiliseront comme backend. Son propre state reste local
  # (terraform.tfstate, ignoré par git) — il ne change presque jamais une
  # fois appliqué, donc le risque de perte/désync est faible pour ce projet.
}
