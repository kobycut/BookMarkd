# Security Group for Backend Application
resource "aws_security_group" "backend" {
  name        = "bookmarkd-backend-sg-${var.environment}"
  description = "Security group for BookMarkd backend application"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name        = "bookmarkd-backend-sg"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Allow inbound HTTP/HTTPS to backend (adjust as needed for your deployment)
resource "aws_security_group_rule" "backend_http" {
  type              = "ingress"
  description       = "HTTP from anywhere"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  security_group_id = aws_security_group.backend.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "backend_https" {
  type              = "ingress"
  description       = "HTTPS from anywhere"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.backend.id
  cidr_blocks       = ["0.0.0.0/0"]
}

# Allow Flask default port (adjust based on your deployment)
resource "aws_security_group_rule" "backend_flask" {
  type              = "ingress"
  description       = "Flask app port"
  from_port         = 5001
  to_port           = 5001
  protocol          = "tcp"
  security_group_id = aws_security_group.backend.id
  cidr_blocks       = ["0.0.0.0/0"]
}

# Allow all outbound traffic from backend
resource "aws_security_group_rule" "backend_egress" {
  type              = "egress"
  description       = "Allow all outbound traffic"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.backend.id
  cidr_blocks       = ["0.0.0.0/0"]
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "bookmarkd-rds-sg-${var.environment}"
  description = "Security group for BookMarkd RDS MySQL instance"
  vpc_id      = aws_vpc.main.id
  
  tags = {
    Name        = "bookmarkd-rds-sg"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Allow MySQL access from backend security group
resource "aws_security_group_rule" "rds_ingress_from_backend" {
  type                     = "ingress"
  description              = "MySQL access from backend application"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.backend.id
}

# Allow all outbound traffic from RDS
resource "aws_security_group_rule" "rds_egress" {
  type              = "egress"
  description       = "Allow all outbound traffic"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.rds.id
  cidr_blocks       = ["0.0.0.0/0"]
}
