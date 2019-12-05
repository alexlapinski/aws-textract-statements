import { SNS, Textract, S3, SQS } from 'aws-sdk';
import { error, success, log } from "./logging";
import { getAwsConfig } from './settings';
import { readFile, writeFile } from 'fs';
import path from 'path';
import * as R from 'ramda';

export const assertDefined = (name: string, value: string | undefined) => {
    if (!value) {
        throw new Error(`${name} cannot be null or undefined.`);
    }
};

export const startDocumentAnalysis = async (
    region: string,
    bucketName: string | undefined, 
    topicArn: string | undefined,
    roleArn: string | undefined,
    filename: string) => {

    const textract = new Textract({
        region
    });

    if (bucketName === undefined) {
        throw new Error('bucketName is undefined.');
    }

    if (topicArn === undefined) {
        throw new Error('topicArn is undefined.');
    }

    if (roleArn === undefined) {
        throw new Error('roleArn is undefined.');
    }

    const params = {
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
    };

    return textract
        .startDocumentAnalysis(params)
        .promise()
        .then(response => response.JobId);
};

export const readFileAsync = (filepath: string): Promise<Buffer> => 
    new Promise((resolve, reject) => 
        readFile(
            filepath, 
            (err, data) => err ? reject(err) : resolve(data),
    )
);

export const uploadFile = (bucketName: string | undefined, filename: string, file: Buffer) => {
    const s3 = new S3();
    
    if (!bucketName) {
        throw new Error('bucketName is undefined or null');
    }

    return s3
        .upload({
            Bucket: bucketName,
            Key: filename,
            Body: file,
            ServerSideEncryption: 'AES256'
        })
        .promise();
};

const listenForCompletion = async (queueUrl: string | undefined) => {

    const sqs = new SQS();

    if (!queueUrl) {
        throw new Error('queueUrl cannot be null or undefined');
    }

    let state;
    while(true) {
        state = await sqs
            .receiveMessage({
                QueueUrl: queueUrl,
                AttributeNames: ['ALL'],
                MessageAttributeNames: ['ALL'],
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 5,
            })
            .promise();

        if(state) {
            log(JSON.stringify(state));
            break
        } else {
            await sleep(10000);
        }
    }
};

const sleep = (durationInMs: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, durationInMs));

const getAnalysis = (jobId: string | undefined) => {
    const textract = new Textract();

    if (!jobId) {
        throw new Error('JobId cannot be null or undefined');
    }

    return textract.getDocumentAnalysis({ JobId: jobId }).promise();
}

const main = async () => {
    const filepath = './data/statement.pdf';
    const filename = path.basename(filepath);

    const { region, bucketName, topicArn, roleArn, queueUrl } = getAwsConfig();

    // Read Document from Disk
    log(`Reading file '${filepath}'`);
    const file = await readFileAsync(filepath);

    log(`Uploading file '${filename}' to bucket '${bucketName}'`);
    await uploadFile(bucketName, filename, file);
    
    log(`Starting Document analysis for '${filename}'`);
    const jobId = await startDocumentAnalysis(region, bucketName, topicArn, roleArn, filename);
    log(`JobId: ${jobId}`);

    // Listen to SNS / SQS for completions
    // log(`Listening for analysis completion`);
    // await listenForCompletion(queueUrl);
    // TODO: Fix listener so it's actually listening correctly
    // Listener should get more details from the message....

    // THIS works below, but is crappy
    log(`Polling for analysis completion`);
    let analysis: Textract.GetDocumentAnalysisResponse;
    while (true) {
        analysis = await getAnalysis(jobId);

        if (analysis.JobStatus === 'IN_PROGRESS') {
            await sleep(10000);
        } else {
            break;
        }
    }
    // TODO: Write analysis to file (extract to function)
    await (new Promise(
        (resolve, reject) => 
            writeFile(
                'output.json', 
                JSON.stringify(analysis, null, 2), 
                (err) => err ? reject(err) : resolve()
            )
        )
    );

    // @ts-ignore // TODO: Fix typing
    const segments = R.map((block:any) => ({
        Type: R.prop('BlockType', block),
        Text: R.prop('Text', block),
    }), analysis.Blocks);

    success(JSON.stringify(segments, null, 2));
};

if (require.main === module) {
    main()
        .then(() => success('Done'))
        .catch((err) => {
            error('Error', err);
            error(JSON.stringify(err));
        });
}