# Backend Terraform partagé par tous les autres modules (network, ecr,
# frontend, backend, async). Nom suffixé par l'account ID car les noms de
# bucket S3 sont uniques au niveau mondial, pas seulement par compte.

resource "aws_s3_bucket" "terraform_state" {
  bucket = "ticketbus-terraform-state-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "ticketbus-terraform-locks"
  billing_mode = "PAY_PER_REQUEST" # pas de coût fixe : facturé à l'usage, négligeable ici
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
