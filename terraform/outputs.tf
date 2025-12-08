output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.bookmarkd.endpoint
}

output "db_address" {
  description = "RDS instance address (hostname only)"
  value       = aws_db_instance.bookmarkd.address
}

output "db_port" {
  description = "RDS instance port"
  value       = aws_db_instance.bookmarkd.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.bookmarkd.db_name
}

output "db_username" {
  description = "Database master username"
  value       = aws_db_instance.bookmarkd.username
  sensitive   = true
}

output "db_connection_string" {
  description = "Full database connection string for Flask (DATABASE_URL)"
  value       = "mysql://${var.db_username}:${var.db_password}@${aws_db_instance.bookmarkd.endpoint}/${aws_db_instance.bookmarkd.db_name}"
  sensitive   = true
}

output "db_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.bookmarkd.id
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.bookmarkd.arn
}

output "db_security_group_id" {
  description = "Security group ID for the RDS instance"
  value       = aws_security_group.rds.id
}

output "db_resource_id" {
  description = "RDS instance resource ID"
  value       = aws_db_instance.bookmarkd.resource_id
}
