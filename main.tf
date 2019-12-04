provider "aws" {
    profile = "aws_reinvent"
    region  = "us-east-1"
}

locals {
    project_name = "textract-poc"
    tags = {
        Project = local.project_name
    }
}

resource "aws_s3_bucket" "document_bucket" {
    bucket_prefix = "${local.project_name}-bucket"
    acl           = "private"
    tags          = local.tags
}

resource "aws_sns_topic" "document_topic" {
    name = "${local.project_name}-topic"
    tags = local.tags
}

resource "aws_iam_role" "document_publish_topic_role" {
    name               = "${local.project_name}-topic-publisher"
    tags               = local.tags

    assume_role_policy = <<EOF
{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": "sts:AssumeRole",
          "Principal": {
            "Service": "ec2.amazonaws.com"
          },
          "Effect": "Allow",
          "Sid": ""
        }
      ]
    }
EOF
}

resource "aws_iam_policy" "document_publish_policy" {
    name   = "NotifyTextractComplete"
    policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "SNS:Publish",
            "Effect": "Allow",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:RequestTag/Project": "$${aws:PrincipalTag/Project}"
                }
            }
        }
    ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "document_role_policy_attachment" {
    role       = aws_iam_role.document_publish_topic_role.name
    policy_arn = aws_iam_policy.document_publish_policy.arn
}

resource "aws_sqs_queue" "document_queue" {
    name = "${local.project_name}-queue"
    tags = local.tags
}

output "bucket_name" {
    value = aws_s3_bucket.document_bucket.bucket
    description = "The name of the new Bucket"
    depends_on = [
        document_bucket
    ]
}

output "publish_topic_role_arn" {
    value = aws_iam_role.document_publish_topic_role.arn
    description = "The 'Publish Message to SNS' Role ARN"
    depends_on = [
        document_publish_topic_role
    ]
}