provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      project    = "ticketbus"
      managed_by = "terraform"
      module     = "network"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}
