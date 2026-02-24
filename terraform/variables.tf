variable "project_name" {
  description = "Name of the project"
  default     = "todo-api"
}

variable "db_username" {
  description = "Database username"
  default     = "todouser"
}

variable "db_password" {
  description = "Database password"
  sensitive   = true
  default     = "todopass123"
}