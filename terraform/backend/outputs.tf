output "alb_dns_name" {
  value = aws_lb.backend.dns_name
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.backend.name
}

output "ecs_task_execution_role_arn" {
  value = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  value = aws_iam_role.ecs_task.arn
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "cluster_arn" {
  value = aws_ecs_cluster.main.arn
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.backend.arn
}

output "public_subnet_ids" {
  value = local.public_subnet_ids
}

output "ecs_sg_id" {
  value = local.ecs_sg_id
}
