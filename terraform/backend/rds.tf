# Subnet public + Security Group verrouille (voir terraform/network) : pas
# de NAT Gateway dans le budget, donc pas de subnet prive possible. RDS
# reste injoignable depuis internet grace au SG (seuls ecs-sg et
# lambda-sg peuvent atteindre le port 5432) + publicly_accessible=false
# ci-dessous, en defense en profondeur. Compromis documente dans
# docs/decisions.md, pas un oubli.

resource "aws_db_subnet_group" "main" {
  name       = "ticketbus-db-subnet-group"
  subnet_ids = local.public_subnet_ids
}

resource "aws_db_instance" "main" {
  identifier     = "ticketbus-db"
  engine         = "postgres"
  engine_version = "16.9" # version reellement disponible en eu-west-3 au moment de l'ecriture
  instance_class = "db.t4g.micro"

  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "ticketbus"
  username = var.db_master_username
  password = var.db_master_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [local.rds_sg_id]
  publicly_accessible    = false

  multi_az = false # single-AZ : cout divise par 2, acceptable pour une demo

  # Demo ephemere : pas de snapshot final necessaire, pas de duree de
  # retention de sauvegarde a payer.
  skip_final_snapshot     = true
  backup_retention_period = 0

  deletion_protection = false # doit pouvoir etre detruit sans confirmation manuelle a chaque fin de demo
}

locals {
  database_url = "postgresql://${var.db_master_username}:${var.db_master_password}@${aws_db_instance.main.endpoint}/ticketbus?sslmode=require"
}
