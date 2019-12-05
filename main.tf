##
## Provider
##
provider "aws" {
    profile = "aws_reinvent"
    region  = "us-east-1"
}

##
## Local Variables
##
locals {
    project_name = "textract-poc"
    tags = {
        Project = local.project_name
    }
}

##
## Resources
##
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
    description        = "The Role used to publish to a project's SNS topic from textract."
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

resource "aws_sns_topic_subscription" "sns_to_sqs_subscription" {
  topic_arn = aws_sns_topic.document_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.document_queue.arn
}


##
## Outputs
##
output "bucket_name" {
    value       = aws_s3_bucket.document_bucket.bucket
    description = "The name of the bucket for ingesting documents."
    depends_on  = [
        document_bucket
    ]
}

output "topic_arn" {
    value       = aws_sns_topic.document_topic.arn
    description = "The ARN of the SNS Topic to publish notifications."
    depends_on  = [
        document_bucket
    ]
}

output "publish_to_topic_role_arn" {
    value       = aws_iam_role.document_publish_topic_role.arn
    description = "The ARN of the Role that is used when publishing to SNS."
    depends_on  = [
        document_publish_topic_role
    ]
}

output "queue_endpoint" {
    value       = aws_sqs_queue.document_queue.id
    description = "The URL for the Queue where we are notified of completion."
    depends_on  = [
        document_queue
    ]
}