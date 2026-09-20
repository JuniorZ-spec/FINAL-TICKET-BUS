resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/ticketbus-backend"
  retention_in_days = 7 # court : c'est une demo, pas besoin d'historique long
}
