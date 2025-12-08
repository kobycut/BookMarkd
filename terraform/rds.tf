resource "aws_db_instance" "bookmarkd" {
  identifier        = "bookmarkd-db-${var.environment}"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = var.db_instance_class
  
  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  
  # Database configuration
  db_name  = "bookmarkd"
  username = var.db_username
  password = var.db_password
  port     = 3306
  
  # Network configuration
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  publicly_accessible    = false
  
  # Backup configuration
  backup_retention_period = var.environment == "production" ? var.backup_retention_period : 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  # High availability
  multi_az = var.environment == "production" ? var.enable_multi_az : false
  
  # Snapshot configuration
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "bookmarkd-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  # Performance and monitoring
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  performance_insights_enabled    = var.environment == "production"
  performance_insights_retention_period = var.environment == "production" ? 7 : null
  
  # Parameters
  parameter_group_name = aws_db_parameter_group.bookmarkd.name
  
  # Deletion protection for production
  deletion_protection = var.environment == "production"
  
  tags = merge(
    {
      Name        = "BookMarkd Database"
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

resource "aws_db_subnet_group" "main" {
  name       = "bookmarkd-db-subnet-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
  
  tags = {
    Name        = "BookMarkd DB subnet group"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_db_parameter_group" "bookmarkd" {
  name   = "bookmarkd-mysql8-${var.environment}"
  family = "mysql8.0"
  
  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }
  
  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }
  
  parameter {
    name  = "max_connections"
    value = var.environment == "production" ? "150" : "50"
  }
  
  tags = {
    Name        = "BookMarkd DB parameter group"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
