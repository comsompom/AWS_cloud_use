import { Stack, StackProps, CfnOutput, Duration, } from 'aws-cdk-lib';
import {
    aws_iam as iam,
    aws_s3 as s3,
    aws_lambda as lambda,
    aws_lambda_event_sources as lambdaEventSources,
} from 'aws-cdk-lib';
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TsStackStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

        const api_table = "demo_table";
        const s3_bucket_name = 'lambda-sample-s3';

        // add S3 bucket
        const bucket = new s3.Bucket(this, 'amzn-s3-demo-bucket', {
            bucketName: s3_bucket_name,
            versioned: true,
            websiteRedirect: { hostName: 'aws.amazon.com' }
        });

        // add DynamoDB table
        const table = new Table(this, api_table, {
            tableName: api_table,
            partitionKey: {
                name: "id",
                type: AttributeType.STRING,
            }
        });

        // add dead letter queue
        const dlq = new sqs.Queue(this, "dead_letter_queue_id.fifo", {
            contentBasedDeduplication: true,
            queueName: 'dead_letter_queue.fifo',
            retentionPeriod: Duration.days(7)
        });

        // add api queue
        const queue = new sqs.Queue(this, 'CdkTsQueue.fifo', {
            contentBasedDeduplication: true,
            fifo: true,
            visibilityTimeout: Duration.seconds(300),
            queueName: 'lambda_queue.fifo',
        });

        // add api lambda
        const api_lambda = new lambda.Function(this, 'api_lambda_job', {
            code: new lambda.AssetCode('./api_lambda'),
            handler: 'api_lambda.handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: Duration.seconds(300),
            memorySize: 256,
            environment: {
                "TABLE_NAME": api_table,
                "QUEUE_URL": queue.queueUrl
            }
        });

        // Define the Lambda function URL resource
        const api_lambda_url = api_lambda.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE,
        });

        // grant rights to api_lambda
        table.grantReadWriteData(api_lambda);

        // add sqs lambda
        const sqs_lambda = new lambda.Function(this, 'sqs_lambda_job', {
            code: new lambda.AssetCode('./sqs_lambda'),
            handler: 'sqs_lambda.handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: Duration.seconds(300),
            memorySize: 256,
            environment: {
                "TABLE_NAME": api_table,
                "QUEUE_URL": queue.queueUrl,
                "BUCKET_NAME": s3_bucket_name,
            }
        });

        // Define the Lambda function URL resource
        const sqs_lambda_url = sqs_lambda.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE,
        });

        // grant rights to sqs_lambda
        table.grantReadWriteData(sqs_lambda);

        const eventSource = new lambdaEventSources.SqsEventSource(queue);

        sqs_lambda.addEventSource(eventSource);

        // Add s3 bucket role to sqs lambda
        const lambdaPolicy = new iam.PolicyStatement();
        lambdaPolicy.addActions("s3:ListBucket");
        lambdaPolicy.addActions("s3:getBucketLocation");
        lambdaPolicy.addActions("s3:*Object");
        lambdaPolicy.addResources(bucket.bucketArn);

        sqs_lambda.addToRolePolicy(lambdaPolicy);


        // Define a CloudFormation output for your URL
        new CfnOutput(this, "API_lambda_URL", { value: api_lambda_url.url, });
        new CfnOutput(this, "SQS_lambda_URL", { value: sqs_lambda_url.url, });
        new CfnOutput(this, 'QueueUrl', { value: queue.queueUrl, });
        new CfnOutput(this, 'BucketName', { value: bucket.bucketWebsiteUrl, });
    }
}
