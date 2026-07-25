resource "aws_lb" "backend" {
  name               = "ticketbus-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [local.alb_sg_id]
  subnets            = local.public_subnet_ids
}

resource "aws_lb_target_group" "backend" {
  name        = "ticketbus-backend-tg"
  port        = var.backend_container_port
  protocol    = "HTTP"
  vpc_id      = local.vpc_id
  target_type = "ip" # obligatoire en mode reseau awsvpc (Fargate)

  health_check {
    path                = "/health" # backend/server.ts:27
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.backend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}
