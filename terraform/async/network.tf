data "terraform_remote_state" "network" {
  backend = "s3"

  config = {
    bucket = "ticketbus-terraform-state-915993062361"
    key    = "demo/network.tfstate"
    region = "eu-west-3"
  }
}

# Lit le secret database_url ecrit par le module backend (Phase 4/5) -
# deja applique a ce stade (ordre : network -> backend -> async).
data "aws_ssm_parameter" "database_url" {
  name            = "/ticketbus/database_url"
  with_decryption = true
}

locals {
  public_subnet_ids = data.terraform_remote_state.network.outputs.public_subnet_ids
  lambda_sg_id      = data.terraform_remote_state.network.outputs.lambda_sg_id
}
