import { Stack, StackProps, CfnOutput, Duration, Aws } from 'aws-cdk-lib';
import {
    aws_iam as iam,
    aws_s3 as s3,
    aws_lambda as lambda,
    aws_s3objectlambda as s3ObjectLambda,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class JsStackStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

      const bucket = new s3.Bucket(this, 'amzn-s3-demo-bucket', {
          bucketName: 'lambda-sample-s3',
          versioned: true,
          websiteRedirect: { hostName: 'aws.amazon.com' }
      });

      const queue = new sqs.Queue(this, 'CdkTsQueue', {
          visibilityTimeout: Duration.seconds(300),
          queueName: 'products',
      });


      // Modify the Lambda function resource
      const api_lambda = new lambda.Function(this, "api_lambda_job", {
          runtime: lambda.Runtime.NODEJS_20_X, // Provide any supported Node.js runtime
          handler: "api_lambda.handler",
          code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          return {
            statusCode: 200,
            body: JSON.stringify(event.body),
          };
        };
      `),
      });

      // Define the Lambda function URL resource
      const api_lambda_url = api_lambda.addFunctionUrl({
          authType: lambda.FunctionUrlAuthType.NONE,
      });

      // Define a CloudFormation output for your URL
      new CfnOutput(this, "API_lambda_URL", {
          value: api_lambda_url.url,
      });
      new CfnOutput(this, 'QueueUrl', { value: queue.queueUrl, });
      new CfnOutput(this, 'BucketName', { value: bucket.bucketWebsiteUrl, });
  }
}

//https://medium.com/@ibrahim.ahdadou/using-cdk-with-typescript-and-localstack-to-create-aws-services-locally-1d675ba4bcaa
