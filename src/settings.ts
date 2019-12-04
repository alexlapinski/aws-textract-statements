if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

export const getAwsConfig = () => ({
    bucketName: process.env.AWS_BUCKET_NAME,
    region: process.env.AWS_ROLE_ARN,
});