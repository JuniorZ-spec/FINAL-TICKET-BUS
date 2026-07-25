output "queue_url" {
  value = aws_sqs_queue.bookings.url
}

output "dlq_url" {
  value = aws_sqs_queue.dlq.url
}

output "lambda_function_name" {
  value = aws_lambda_function.booking_processor.function_name
}
