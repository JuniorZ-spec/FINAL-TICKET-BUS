# Le compte AWS est partagé avec d'autres projets, donc on filtre sur le tag
# project=ticketbus plutôt que de suivre la dépense totale du compte.
#
# ATTENTION — étape manuelle requise après le premier apply : AWS n'active
# les "cost allocation tags" qu'après confirmation dans la console Billing
# (Billing > Cost allocation tags > activer "project"), et le filtre ne
# reflète les coûts réels qu'après ~24h. Avant activation, ce budget existe
# mais peut afficher 0$ de dépense même si des ressources tournent.

resource "aws_budgets_budget" "monthly" {
  name         = "ticketbus-monthly"
  budget_type  = "COST"
  limit_amount = "60"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:project$ticketbus"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 66.6 # ~40$
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 91.6 # ~55$
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }
}
