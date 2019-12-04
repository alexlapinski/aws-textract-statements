import { SNS, Textract } from 'aws-sdk';
import { error, success, log } from "./logging";
import { getAwsConfig } from './settings';

const getTopicArn = async (topicName: string) => {
    const sns = new SNS();
    const topics = await sns.listTopics();
    log(JSON.stringify(topics));

    return ''; // TODO
};

const getRoleArn = async () => {
    return Promise.resolve('');
};

const startDocumentAnalysis = async (filename: string) => {
    const { bucketName, topicName } = getAwsConfig();
    const textract = new Textract();

    const topicArn = await getTopicArn(topicName);
    const roleArn = await getRoleArn();

    return textract.startDocumentAnalysis({
        DocumentLocation: {
            S3Object: {
                Bucket: bucketName,
                Name: filename,
            },
        },
        FeatureTypes: ['TABLES', 'FORMS'],
        NotificationChannel: {
            SNSTopicArn: topicArn,
            RoleArn: roleArn,
        },
    })
    .promise();
}

const main = async () => {

};

if (require.main === module) {
    main()
        .then(() => success('Done'))
        .catch((err) => error('Error', err));
}