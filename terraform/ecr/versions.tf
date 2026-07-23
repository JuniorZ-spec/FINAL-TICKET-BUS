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
    key            = "shared/ecr.tfstate" # module permanent, pas "demo/*"
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
      module     = "ecr"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "eu-west-3"
}
