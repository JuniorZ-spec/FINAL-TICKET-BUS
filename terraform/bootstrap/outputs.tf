output "state_bucket" {
  description = "Bucket S3 à utiliser comme backend Terraform par les autres modules"
  value       = aws_s3_bucket.terraform_state.id
}

output "lock_table" {
  description = "Table DynamoDB à utiliser comme lock Terraform par les autres modules"
  value       = aws_dynamodb_table.terraform_locks.id
}

output "gha_deploy_role_arn" {
  description = "ARN à mettre dans le secret AWS_DEPLOY_ROLE_ARN de GitHub Actions"
  value       = aws_iam_role.gha_deploy.arn
}

output "aws_account_id" {
  value = data.aws_caller_identity.current.account_id
}
