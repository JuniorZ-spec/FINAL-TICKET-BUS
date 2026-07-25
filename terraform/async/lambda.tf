locals {
  ecr_lambda_repository_url = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/ticketbus-lambda-booking"
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "booking_processor" {
  name               = "ticketbus-booking-processor"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

# AWSLambdaVPCAccessExecutionRole : la Lambda est attachee au VPC pour
# atteindre RDS (pas de subnet prive - voir terraform/network) - gere les
# ENI + logs de base.
resource "aws_iam_role_policy_attachment" "vpc_access" {
  role       = aws_iam_role.booking_processor.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# AWSLambdaSQSQueueExecutionRole : permissions standard pour consommer un
# trigger SQS (ReceiveMessage/DeleteMessage/GetQueueAttributes).
resource "aws_iam_role_policy_attachment" "sqs_trigger" {
  role       = aws_iam_role.booking_processor.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

resource "aws_lambda_function" "booking_processor" {
  function_name = "ticketbus-booking-processor"
  role          = aws_iam_role.booking_processor.arn

  package_type = "Image"
  image_uri    = "${local.ecr_lambda_repository_url}:${var.lambda_image_tag}"

  timeout     = 30
  memory_size = 256

  vpc_config {
    subnet_ids         = local.public_subnet_ids
    security_group_ids = [local.lambda_sg_id]
  }

  environment {
    variables = {
      # Valeur lue depuis SSM au moment de l'apply (voir network.tf) et
      # injectee directement comme variable d'environnement Lambda -
      # contrairement aux "secrets" ECS, elle reste visible en clair via
      # GetFunctionConfiguration pour qui a le droit IAM de la lire.
      # Acceptable pour une demo, a noter comme compromis dans
      # docs/decisions.md.
      DATABASE_URL = data.aws_ssm_parameter.database_url.value
    }
  }
}

resource "aws_lambda_event_source_mapping" "bookings" {
  event_source_arn = aws_sqs_queue.bookings.arn
  function_name    = aws_lambda_function.booking_processor.arn
  batch_size        = 10

  # Le handler traite chaque message individuellement et remonte les
  # echecs un par un (voir lambda/booking-processor/index.ts) - seuls les
  # messages en echec sont remis en jeu, pas tout le batch.
  function_response_types = ["ReportBatchItemFailures"]
}

resource "aws_cloudwatch_log_group" "booking_processor" {
  name              = "/aws/lambda/ticketbus-booking-processor"
  retention_in_days = 7
}
