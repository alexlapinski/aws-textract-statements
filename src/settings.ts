if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

export const getAwsConfig = () => ({
    bucketName: process.env.AWS_BUCKET_NAME || 'textract-bucket',
    topicName: process.env.AWS_TOPIC_NAME || 'textract-topic',
    queueName: process.env.AWS_QUEUE_NAME || 'textract-queue',
    region: process.env.AWS_REGION || 'us-east-1',
});