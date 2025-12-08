# BookMarkd Terraform Infrastructure

This directory contains Terraform configuration for deploying the BookMarkd MySQL database on AWS RDS.

## 📋 Prerequisites

1. **Terraform** installed (v1.0+)

   ```bash
   terraform --version
   ```

   Should return `Terraform v1.14.0` or similar.

   Otherwise, install from [terraform.io](https://www.terraform.io/downloads.html).

2. **AWS CLI** Installed

   ```bash
   aws --version
   ```

   Should return `aws-cli/2.32.11 Python/3.13.9 Windows/11 exe/AMD64` or similar.

   Otherwise, install with chocolatey or similar:

   ```bash
   choco install awscli
   ```

3. **AWS CLI** configured with credentials

   Verify credentials by retrieving your AWS Account Id:

   ```bash
   aws sts get-caller-identity
   ```

   Should return your Account ex. 123456789012 (and other details) which matches the top right of the AWS Console.

   Otherwise, configure it with:

   ```bash
   aws configure
   ```

   Note: You can later check `C:\Users\YourUser\.aws\credentials` for your configuration info.

4. **IAM Permissions**:

   Your AWS user/role needs permissions to create:
   - VPC and networking resources (VPC, subnets, route tables, Internet Gateway, NAT Gateway)
   - RDS instances and related resources
   - Security groups
   - Elastic IPs

   **Note**: This Terraform configuration now creates all required networking infrastructure automatically!

## 🏗️ Architecture

This configuration deploys a complete AWS infrastructure:

### Networking

- **VPC** with configurable CIDR block (default: 10.0.0.0/16)
- **Public Subnets** (2+ across different AZs) for NAT Gateways and load balancers
- **Private Subnets** (2+ across different AZs) for RDS and backend applications
- **Internet Gateway** for public subnet internet access
- **NAT Gateways** (optional, one per AZ) for private subnet outbound internet access
- **Route Tables** properly configured for public and private subnets
- **VPC Endpoints** (optional) for AWS services like S3

### Database

- **AWS RDS MySQL 8.0** database instance
- **DB Subnet Group** across multiple availability zones
- **Security Groups** restricting RDS access to backend only
- **DB Parameter Group** with optimized UTF-8 settings for BookMarkd
- **Automated backups** with configurable retention
- **Multi-AZ deployment** (optional for production)
- **Performance Insights** and CloudWatch logging

### Security

- **Backend Security Group** for application servers
- **RDS Security Group** allowing MySQL (port 3306) only from backend
- **Encrypted storage** at rest for RDS

## 📁 Files

| File | Purpose |
|------|---------|
| `main.tf` | Provider configuration and Terraform settings |
| `variables.tf` | Input variable definitions (not values) |
| `vpc.tf` | VPC, subnets, NAT gateways, and networking |
| `rds.tf` | RDS instance and related resources |
| `security-groups.tf` | Security groups for backend and RDS |
| `outputs.tf` | Output values (endpoints, connection strings, VPC info) |
| `terraform.tfvars.example` | Example variable values |
| `terraform.tfvars` | User variable values (not committed) |
| `.gitignore` | Prevents committing sensitive files |

## 🚀 Quick Start

### 1. Configure Variables

Copy the example file and fill in your values:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your actual values (e.g. database user/password):

```hcl
# Database Configuration
db_username = "bookmarkd_user"
db_password = "YourSecurePassword123!"
```

**⚠️ IMPORTANT**: Never commit `terraform.tfvars` to version control!

### 2. Initialize Terraform

```bash
terraform init
```

This downloads required providers and initializes the working directory.

### 3. Review the Plan

```bash
terraform plan
```

Review the resources that will be created.

### 4. Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted to create the resources.

### 5. Get Database Connection Info

```bash
# View all outputs
terraform output
```

## 🔧 Configuration

### Environment-Specific Settings

The configuration automatically adjusts based on the `environment` variable:

| Feature | Dev | Production |
|---------|-----|------------|
| Backup Retention | 1 day | 7 days |
| Multi-AZ | Disabled | Optional (configurable) |
| Deletion Protection | Disabled | Enabled |
| Performance Insights | Disabled | Enabled |
| Final Snapshot | Skipped | Created |

### VPC Configuration Options

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `vpc_cidr` | VPC IP range | `10.0.0.0/16` | Provides 65,536 IP addresses |
| `az_count` | Number of AZs | `2` | Minimum 2 required for RDS |
| `enable_nat_gateway` | NAT for internet access | `true` | ~$32/month per NAT Gateway |
| `enable_vpc_endpoints` | VPC endpoints for AWS services | `false` | Improves security and reduces costs |

**Cost Tip**: For dev environments, you can set `enable_nat_gateway = false` to save ~$32/month if your private resources don't need internet access.

### Instance Sizing

Common RDS instance classes:

| Instance Class | vCPUs | RAM | Use Case | Cost/Month* |
|---------------|-------|-----|----------|-------------|
| `db.t3.micro` | 2 | 1 GB | Dev/Testing | ~$15 |
| `db.t3.small` | 2 | 2 GB | Small Production | ~$30 |
| `db.t3.medium` | 2 | 4 GB | Medium Production | ~$60 |
| `db.r6g.large` | 2 | 16 GB | Large Production | ~$145 |

*Approximate costs in us-east-1, subject to change

### Total Infrastructure Cost Estimate

For a **development environment**:

- RDS db.t3.micro: ~$15/month
- NAT Gateway (1 AZ): ~$32/month
- EBS storage (20GB): ~$2/month
- **Total**: ~$49/month

For **production with high availability**:

- RDS db.t3.small (Multi-AZ): ~$60/month
- NAT Gateways (2 AZs): ~$64/month
- EBS storage (20GB, replicated): ~$4/month
- **Total**: ~$128/month

## 🔐 Security Best Practices

1. **Use AWS Secrets Manager** for database credentials:

   ```hcl
   # In variables.tf, reference secrets instead of plaintext
   data "aws_secretsmanager_secret_version" "db_password" {
     secret_id = "bookmarkd/db/password"
   }
   ```

2. **Enable encryption** at rest (already configured)

3. **Restrict network access** via security groups (already configured)

4. **Use IAM authentication** for enhanced security (optional)

5. **Enable CloudWatch alarms** for monitoring:
   - CPU utilization
   - Storage space
   - Connection count

## 📊 Monitoring

After deployment, monitor your database in AWS Console:

- **CloudWatch Metrics**: CPU, connections, IOPS
- **RDS Performance Insights**: Query performance
- **Enhanced Monitoring**: OS-level metrics

## 🔄 Updating Infrastructure

1. Modify Terraform files
2. Run `terraform plan` to preview changes
3. Run `terraform apply` to apply changes

Terraform will only update what changed.

### Common Updates

**Scaling RDS instance**:

```hcl
# In terraform.tfvars
db_instance_class = "db.t3.small"  # Upgrade from db.t3.micro
```

**Adding more availability zones**:

Check your AWS region for available AZs [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/regions_az/), then update:

```hcl
# In terraform.tfvars
az_count = 3  # Increase from 2
```

**Enabling Multi-AZ for production**:

```hcl
# In terraform.tfvars
environment = "production"
enable_multi_az = true
```

## 🗑️ Destroying Resources

**⚠️ WARNING**: This will permanently delete your database!

First check the destroy plan:

```bash
terraform plan -destroy
```

Then run the destroy command:

```bash
terraform destroy
```

For production databases with `deletion_protection = true`, you must first disable it:

1. Set `deletion_protection = false` in `rds.tf`
2. Run `terraform apply`
3. Then run `terraform destroy`

## 📝 Integration with BookMarkd

### Update Flask Configuration

After deployment, update your `backend/config.py`:

```python
class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    # Use the Terraform output
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
```

Use the Terraform output directly:

```bash
export DATABASE_URL=$(terraform output -raw db_connection_string)
```

Or (1) manually grab the sensitive connection string from Terraform output:

```bash
terraform output -raw db_connection_string
```

Then (2) manually set the environment variable:

```bash
export DATABASE_URL="mysql://user:pass@rds-endpoint/bookmarkd"
```

### Run Database Migrations

After deploying RDS, initialize your database schema:

```bash
# From your backend directory
flask db upgrade

# Or run your seed script
python database/seed.py
```

## 🔧 Troubleshooting

### Connection Issues

1. **Check security group rules**: Ensure backend SG has access

   ```bash
   terraform output db_security_group_id
   ```

2. **Verify endpoint**:

   ```bash
   terraform output db_endpoint
   ```

3. **Test connection**:

   ```bash
   mysql -h $(terraform output -raw db_address) -u bookmarkd_user -p
   ```

### State Management

If working in a team, use remote IAC Terraform-state storage:

1. Create S3 bucket and DynamoDB table
2. Uncomment backend configuration in `main.tf`
3. Run `terraform init -migrate-state`

## 📚 Additional Resources

- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/regions_az/)

## 💰 Cost Estimation

Before deploying, estimate costs:

```bash
# Using Infracost (if installed)
infracost breakdown --path .
```

Or use [AWS Pricing Calculator](https://calculator.aws/)

## 🆘 Support

For BookMarkd-specific questions, see the main [project README](../README.md).
**Built with ❤️ for BookMarkd**
