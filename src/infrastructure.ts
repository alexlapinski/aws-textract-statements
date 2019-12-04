import { S3, SNS, SQS } from 'aws-sdk';
import uuidv4 from 'uuid/v4';
import { log, error, success } from './logging';
import { getAwsConfig } from './settings';

export const getS3Client = () => new S3();
export const getSNSClient = () => new SNS();
export const getSQSClient = () => new SQS();
export const getUUID = () => uuidv4();

export const createBucket = (name: string) =>
    getS3Client()
        .createBucket({ 
            Bucket: `${name}-${getUUID()}`,
            ACL: 'private',
        })
        .promise();

export const createSNSTopic = (name: string) =>
    getSNSClient()
        .createTopic({ Name: name })
        .promise();

export const createSQSQueue = (name: string) =>
    getSQSClient()
        .createQueue({ QueueName: name })
        .promise();


const main = async () => {
    const { bucketName, topicName, queueName } = getAwsConfig();
    
    await createBucket(bucketName);

    await createSNSTopic(topicName);
    
    await createSQSQueue(queueName);
};

if (require.main === module) {
    main()
        .then(() => success('Done'))
        .catch(err => error('Error', err));
}