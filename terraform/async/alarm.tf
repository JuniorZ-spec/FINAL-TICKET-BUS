resource "aws_sns_topic" "dlq_alert" {
  name = "ticketbus-dlq-alert"
}

resource "aws_sns_topic_subscription" "dlq_alert_email" {
  topic_arn = aws_sns_topic.dlq_alert.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "dlq_not_empty" {
  alarm_name          = "ticketbus-booking-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Un message a echoue 3 fois (maxReceiveCount) et est tombe en DLQ - reservation jamais confirmee ni refusee proprement."

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  alarm_actions = [aws_sns_topic.dlq_alert.arn]
}
