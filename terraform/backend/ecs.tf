resource "aws_ecs_cluster" "main" {
  name = "ticketbus-cluster"
}

# Fargate Spot uniquement (pas de capacite Fargate standard) : jusqu'a 70%
# moins cher, acceptable pour une demo qui tourne quelques heures - le
# risque d'interruption Spot est negligeable sur une si courte duree.
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 100
  }
}

locals {
  ecr_backend_repository_url = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/ticketbus-backend"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "ticketbus-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256" # 0.25 vCPU - suffisant pour une demo, pas un usage de prod
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${local.ecr_backend_repository_url}:${var.backend_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.backend_container_port
          protocol      = "tcp"
        }
      ]

      # Pas de REDIS_URL : Redis reste local/docker-compose uniquement (voir
      # docs/decisions.md Phase 0). Le client ioredis va logger des erreurs
      # de connexion en boucle vers localhost:6379 - attendu et sans
      # consequence, le code traite deja Redis comme un verrou optionnel
      # (voir backend/redisClient.ts, backend/controllers/bookingController.ts).
      environment = [
        { name = "PORT", value = tostring(var.backend_container_port) },
        { name = "FRONTEND_URL", value = var.frontend_url },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "BOOKING_QUEUE_URL", value = local.booking_queue_url },
      ]

      secrets = [
        { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
        { name = "jwt_secret", valueFrom = aws_ssm_parameter.jwt_secret.arn },
        { name = "EMAIL", valueFrom = aws_ssm_parameter.email.arn },
        { name = "EMAIL_PASS", valueFrom = aws_ssm_parameter.email_pass.arn },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "ticketbus-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 100
  }

  network_configuration {
    subnets          = local.public_subnet_ids
    security_groups  = [local.ecs_sg_id]
    assign_public_ip = true # pas de NAT : sortie internet directe (pull ECR, SSM, RDS, SQS)
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = var.backend_container_port
  }

  depends_on = [aws_lb_listener.backend]
}
