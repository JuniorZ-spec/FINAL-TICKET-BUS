provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      project    = "ticketbus"
      managed_by = "terraform"
      module     = "bootstrap"
    }
  }
}

data "aws_caller_identity" "current" {}
