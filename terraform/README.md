# BookMarkd Terraform Infrastructure

This directory contains Terraform configuration for deploying the BookMarkd MySQL database on AWS RDS.

## 📋 Prerequisites

1. **Terraform** installed (v1.0+)

   ```bash
   terraform --version
   ```

3. **AWS CLI** configured with credentials

   ```bash
   aws configure
   ```

5. **Existing AWS Resources**:

   - VPC with at least 2 private subnets in different availability zones
   - Security group for your backend application
   - IAM permissions to create RDS instances, security groups, and related resources

## 🏗️ Architecture

This configuration deploys:

- **AWS RDS MySQL 8.0** database instance
- **DB Subnet Group** across multiple availability zones
- **Security Group** restricting access to backend only
- **DB Parameter Group** with optimized settings for BookMarkd
- **Automated backups** and optional Multi-AZ deployment

## 📁 Files

| File | Purpose |
|------|---------|
| `main.tf` | Provider configuration and Terraform settings |
| `variables.tf` | Input variable definitions |
| `rds.tf` | RDS instance and related resources |
| `security-groups.tf` | Security group rules for database access |
| `outputs.tf` | Output values (endpoints, connection strings) |
| `terraform.tfvars.example` | Example variable values |
| `.gitignore` | Prevents committing sensitive files |

## 🚀 Quick Start

### 1. Configure Variables

Copy the example file and fill in your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your actual values:

```hcl
environment = "dev"
aws_region  = "us-east-1"

db_username = "bookmarkd_user"
db_password = "YourSecurePassword123!"

vpc_id                    = "vpc-xxxxx"
private_subnet_ids        = ["subnet-xxxxx", "subnet-yyyyy"]
backend_security_group_id = "sg-xxxxx"
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

# Get connection string for Flask
terraform output -raw db_connection_string
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

### Instance Sizing

Common RDS instance classes:

| Instance Class | vCPUs | RAM | Use Case | Cost/Month* |
|---------------|-------|-----|----------|-------------|
| `db.t3.micro` | 2 | 1 GB | Dev/Testing | ~$15 |
| `db.t3.small` | 2 | 2 GB | Small Production | ~$30 |
| `db.t3.medium` | 2 | 4 GB | Medium Production | ~$60 |
| `db.r6g.large` | 2 | 16 GB | Large Production | ~$145 |

*Approximate costs in us-east-1, subject to change

## 🔐 Security Best Practices

1. **Use AWS Secrets Manager** for database credentials:

   ```hcl
   # In variables.tf, reference secrets instead of plaintext
   data "aws_secretsmanager_secret_version" "db_password" {
     secret_id = "bookmarkd/db/password"
   }
   ```

3. **Enable encryption** at rest (already configured)

4. **Restrict network access** via security groups (already configured)

5. **Use IAM authentication** for enhanced security (optional)

6. **Enable CloudWatch alarms** for monitoring:
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

## 🗑️ Destroying Resources

**⚠️ WARNING**: This will permanently delete your database!

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

Set the environment variable:

```bash
export DATABASE_URL="mysql://user:pass@rds-endpoint/bookmarkd"
```

Or use the Terraform output directly:

```bash
export DATABASE_URL=$(terraform output -raw db_connection_string)
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

3. **Verify endpoint**:

   ```bash
   terraform output db_endpoint
   ```

5. **Test connection**:

   ```bash
   mysql -h $(terraform output -raw db_address) -u bookmarkd_user -p
   ```

### State Management

If working in a team, use remote state storage:

1. Create S3 bucket and DynamoDB table
2. Uncomment backend configuration in `main.tf`
3. Run `terraform init -migrate-state`

## 📚 Additional Resources

- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

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
