variable "aws_region" {
  description = "Région AWS pour toutes les ressources du projet"
  type        = string
  default     = "eu-west-3"
}

variable "github_repo" {
  description = "owner/repo GitHub autorisé à assumer le role de déploiement via OIDC"
  type        = string
  default     = "JuniorZ-spec/FINAL-TICKET-BUS"
}

variable "budget_alert_emails" {
  description = "Emails notifiés quand le budget AWS mensuel dépasse les seuils définis"
  type        = list(string)
}
