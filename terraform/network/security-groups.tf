# Chaîne de confiance : internet → alb-sg → ecs-sg → rds-sg. Chaque SG
# n'autorise que le SG en amont, jamais 0.0.0.0/0 au-delà de l'ALB.

resource "aws_security_group" "alb" {
  name        = "ticketbus-alb-sg"
  description = "ALB public - HTTP/HTTPS depuis internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "ticketbus-alb-sg" }
}

resource "aws_security_group" "ecs" {
  name        = "ticketbus-ecs-sg"
  description = "Taches ECS Fargate - accessibles uniquement depuis ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Backend depuis ALB uniquement"
    from_port       = var.backend_container_port
    to_port         = var.backend_container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Egress ouvert : nécessaire pour joindre ECR, SSM, SQS, RDS, CloudWatch
  # Logs — pas de NAT/VPC endpoints ici, donc les tâches sortent par l'IP
  # publique du subnet directement.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "ticketbus-ecs-sg" }
}

# La Lambda de réservation (Phase 6) doit aussi atteindre RDS ; comme il
# n'y a pas de subnet privé, elle est attachée aux mêmes subnets publics
# que les tâches ECS, via ce SG dédié.
resource "aws_security_group" "lambda" {
  name        = "ticketbus-lambda-sg"
  description = "Lambda de reservation - attachee au VPC pour atteindre RDS"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "ticketbus-lambda-sg" }
}

resource "aws_security_group" "rds" {
  name        = "ticketbus-rds-sg"
  description = "PostgreSQL - accessible uniquement depuis ECS et la Lambda de reservation"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL depuis ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  ingress {
    description     = "PostgreSQL depuis la Lambda de reservation"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "ticketbus-rds-sg" }
}
