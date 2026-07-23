# Nom fixe (pas genere par Terraform) : le module backend (Phase 4/5)
# construit la meme URL par convention pour injecter BOOKING_QUEUE_URL
# dans la tache ECS, sans dependre du state de ce module - voir
# terraform/backend/sqs-url.tf.

resource "aws_sqs_queue" "dlq" {
  name                      = "ticketbus-bookings-dlq.fifo"
  fifo_queue                = true # une DLQ pour une queue FIFO doit aussi etre FIFO
  message_retention_seconds = 1209600 # 14 jours - le temps d'aller regarder ce qui a echoue
}

resource "aws_sqs_queue" "bookings" {
  name                        = "ticketbus-bookings.fifo"
  fifo_queue                  = true
  content_based_deduplication = false # on fournit explicitement MessageDeduplicationId = transactionId

  # >= 6x le timeout Lambda (30s), recommandation AWS standard pour eviter
  # qu'un message redevienne visible pendant qu'il est encore en cours de
  # traitement.
  visibility_timeout_seconds = 180

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount      = 3
  })
}
