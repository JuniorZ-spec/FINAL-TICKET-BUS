# Le module async (Phase 6, applique apres celui-ci) cree la vraie queue
# sous ce nom fixe. Les URLs SQS suivent un format previsible
# (https://sqs.<region>.amazonaws.com/<account>/<nom>), donc pas besoin de
# lire le state du module async pour connaitre l'URL a l'avance - evite une
# dependance circulaire (async depend deja de backend via le secret SSM).

locals {
  booking_queue_name = "ticketbus-bookings.fifo"
  booking_queue_url  = "https://sqs.${var.aws_region}.amazonaws.com/${data.aws_caller_identity.current.account_id}/${local.booking_queue_name}"
  booking_queue_arn  = "arn:aws:sqs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${local.booking_queue_name}"
}

data "aws_iam_policy_document" "ecs_task_sqs_send" {
  statement {
    sid       = "SendBookingRequests"
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = [local.booking_queue_arn]
  }
}

resource "aws_iam_role_policy" "ecs_task_sqs_send" {
  name   = "send-booking-requests-to-sqs"
  role   = aws_iam_role.ecs_task.id
  policy = data.aws_iam_policy_document.ecs_task_sqs_send.json
}
