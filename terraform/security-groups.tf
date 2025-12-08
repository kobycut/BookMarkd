resource "aws_security_group" "rds" {
  name        = "bookmarkd-rds-sg-${var.environment}"
  description = "Security group for BookMarkd RDS MySQL instance"
  vpc_id      = var.vpc_id
  
  tags = {
    Name        = "bookmarkd-rds-sg"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_security_group_rule" "rds_ingress_from_backend" {
  type                     = "ingress"
  description              = "MySQL access from backend application"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = var.backend_security_group_id
}

resource "aws_security_group_rule" "rds_egress" {
  type              = "egress"
  description       = "Allow all outbound traffic"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.rds.id
  cidr_blocks       = ["0.0.0.0/0"]
}
