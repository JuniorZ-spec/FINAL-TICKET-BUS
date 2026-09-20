variable "backend_image_tag" {
  description = "Tag exact de l'image ECR a deployer (ex: sha-<commit>) - pas de defaut, choix explicite obligatoire (voir docs/decisions.md, repo ECR immutable sans tag latest)"
  type        = string
}

variable "backend_container_port" {
  type    = number
  default = 5000
}

variable "desired_count" {
  description = "1 seul par defaut - suffisant pour la demo, evite de payer 2 taches en parallele"
  type        = number
  default     = 1
}

# ── Secrets applicatifs, stockes en SSM Parameter Store (SecureString) ──
# Fournis via terraform.tfvars (gitignore) ou variables d'environnement
# TF_VAR_*, jamais commit. Voir terraform.tfvars.example.

variable "db_master_username" {
  type    = string
  default = "ticketbus"
}

variable "db_master_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "email" {
  type      = string
  sensitive = true
}

variable "email_pass" {
  type      = string
  sensitive = true
}

variable "frontend_url" {
  description = "URL du frontend CloudFront, pour les liens dans les emails transactionnels"
  type        = string
  default     = ""
}
