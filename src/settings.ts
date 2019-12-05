if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

export interface AWSConfig {
    bucketName?: string;
    topicArn?: string;
    roleArn?: string;
    queueUrl?: string;
    region: string;
}

export const getAwsConfig = ():AWSConfig => ({
    bucketName: process.env.AWS_BUCKET_NAME,
    topicArn: process.env.AWS_TOPIC_ARN,
    roleArn: process.env.AWS_ROLE_ARN,
    queueUrl: process.env.AWS_QUEUE_URL,
    region: process.env.AWS_REGION || 'us-east-1',
});