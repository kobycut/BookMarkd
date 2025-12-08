# VPC Configuration for BookMarkd

# Get available availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    {
      Name        = "bookmarkd-vpc-${var.environment}"
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    {
      Name        = "bookmarkd-igw-${var.environment}"
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# Public Subnets (for NAT Gateways and potentially load balancers)
resource "aws_subnet" "public" {
  count                   = var.az_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    {
      Name        = "bookmarkd-public-subnet-${count.index + 1}-${var.environment}"
      Environment = var.environment
      Type        = "Public"
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# Private Subnets (for RDS and backend application)
resource "aws_subnet" "private" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + var.az_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    {
      Name        = "bookmarkd-private-subnet-${count.index + 1}-${var.environment}"
      Environment = var.environment
      Type        = "Private"
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? var.az_count : 0
  domain = "vpc"

  tags = merge(
    {
      Name        = "bookmarkd-nat-eip-${count.index + 1}-${var.environment}"
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per AZ for high availability)
resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? var.az_count : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    {
      Name        = "bookmarkd-nat-${count.index + 1}-${var.environment}"
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    {
      Name        = "bookmarkd-public-rt-${var.environment}"
      Environment = var.environment
      Type        = "Public"
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# Private Route Tables (one per AZ for separate NAT gateways)
resource "aws_route_table" "private" {
  count  = var.az_count
  vpc_id = aws_vpc.main.id

  # Only add NAT gateway route if NAT is enabled
  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(
    {
      Name        = "bookmarkd-private-rt-${count.index + 1}-${var.environment}"
      Environment = var.environment
      Type        = "Private"
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = var.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = var.az_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints for AWS Services (optional but recommended for security and cost)
# S3 VPC Endpoint (Gateway endpoint - free)
resource "aws_vpc_endpoint" "s3" {
  count        = var.enable_vpc_endpoints ? 1 : 0
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = merge(
    {
      Name        = "bookmarkd-s3-endpoint-${var.environment}"
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# S3 VPC Endpoint Route Table Associations
resource "aws_vpc_endpoint_route_table_association" "s3_private" {
  count           = var.enable_vpc_endpoints ? var.az_count : 0
  route_table_id  = aws_route_table.private[count.index].id
  vpc_endpoint_id = aws_vpc_endpoint.s3[0].id
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  count       = var.enable_vpc_endpoints ? 1 : 0
  name        = "bookmarkd-vpc-endpoints-sg-${var.environment}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    {
      Name        = "bookmarkd-vpc-endpoints-sg"
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}
