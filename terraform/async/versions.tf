terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "ticketbus-terraform-state-915993062361"
    key            = "demo/async.tfstate" # ephemere
    region         = "eu-west-3"
    dynamodb_table = "ticketbus-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      project    = "ticketbus"
      managed_by = "terraform"
      module     = "async"
    }
  }
}

data "aws_caller_identity" "current" {}

variable "aws_region" {
  type    = string
  default = "eu-west-3"
}

variable "lambda_image_tag" {
  description = "Tag exact de l'image ECR ticketbus-lambda-booking a deployer"
  type        = string
}

variable "alert_email" {
  description = "Email notifie quand la DLQ recoit un message (echec technique de traitement)"
  type        = string
}
