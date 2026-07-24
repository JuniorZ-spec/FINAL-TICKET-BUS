# Lit les outputs du module network (Phase 1), applique dans la meme
# session de demo juste avant celui-ci. Pas de dependance Terraform directe
# entre modules (chaque module a son propre state), donc on lit son state
# via ce data source plutot que de passer les valeurs a la main.

data "terraform_remote_state" "network" {
  backend = "s3"

  config = {
    bucket = "ticketbus-terraform-state-915993062361"
    key    = "demo/network.tfstate"
    region = "eu-west-3"
  }
}

locals {
  vpc_id            = data.terraform_remote_state.network.outputs.vpc_id
  public_subnet_ids = data.terraform_remote_state.network.outputs.public_subnet_ids
  alb_sg_id         = data.terraform_remote_state.network.outputs.alb_sg_id
  ecs_sg_id         = data.terraform_remote_state.network.outputs.ecs_sg_id
  rds_sg_id         = data.terraform_remote_state.network.outputs.rds_sg_id
}
