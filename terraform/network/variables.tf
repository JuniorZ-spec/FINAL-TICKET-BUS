variable "aws_region" {
  type    = string
  default = "eu-west-3"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Un CIDR par AZ — 2 AZ suffisent pour satisfaire les contraintes multi-AZ de l'ALB et de RDS"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "backend_container_port" {
  description = "Port sur lequel écoute le conteneur backend (voir backend/server.ts)"
  type        = number
  default     = 5000
}
