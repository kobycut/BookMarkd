terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Optional: Store state in S3 for team collaboration
  # Uncomment and configure after creating S3 bucket
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "bookmarkd/db/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}
