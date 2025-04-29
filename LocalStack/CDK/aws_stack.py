# pylint: disable=E0401
# pylint: disable=C0115
# pylint: disable=R1735
# pylint: disable=W0612
# pylint: disable=R0903
"""
AWS CDK script to deploy the structure to the cloud
"""
from aws_cdk import (
    Duration,
    CfnOutput,
    Stack,
    aws_sqs as sqs,
    aws_lambda as _lambda,
    aws_lambda_event_sources as lambda_event_source,
    aws_s3 as s3,
    aws_dynamodb as _dynamo,
)
from constructs import Construct

class AwsStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket
        s3_bucket = s3.Bucket(
            self,
            "lambda-sample-s3",
            bucket_name="lambda-sample-s3",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    expiration=Duration.days(365),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        ),
                    ]
                )
            ]
        )

        # Create API DynamoDB table
        api_table = _dynamo.Table(
            self, "demo_table",
            partition_key=_dynamo.Attribute(
                name="id",
                type=_dynamo.AttributeType.STRING
            )
        )

        # Create dead-letter queue
        dlq = sqs.Queue(
            self,
            id="dead_letter_queue_id",
            content_based_deduplication=True,
            retention_period=Duration.days(7)
        )
        dead_letter_queue = sqs.DeadLetterQueue(
            max_receive_count=5,
            queue=dlq
        )

        # Create SQS between API and SQS Lambdas
        queue = sqs.Queue(
            self, "lambdaQueue",
            dead_letter_queue=dead_letter_queue,
            content_based_deduplication=True,
            visibility_timeout=Duration.seconds(300),
        )

        # Create API Lambda
        api_lambda = _lambda.Function(self, "api-lambda-job",
                                           runtime=_lambda.Runtime.PYTHON_3_10,
                                           handler="api_lambda.handler",
                                           code=_lambda.Code.from_asset("./lambda"),
                                           environment=dict(
                                               QUEUE_URL=queue.queue_url,
                                               TABLE_NAME=api_table.table_name)
                                           )
        api_lambda_url = api_lambda.add_function_url(
            auth_type = _lambda.FunctionUrlAuthType.NONE,)

        api_table.grant_write_data(api_lambda)

        # Create SQS Lambda
        sqs_lambda = _lambda.Function(self, "sqs-lambda-job",
                                      runtime=_lambda.Runtime.PYTHON_3_10,
                                      handler="sqs_lambda.handler",
                                      code=_lambda.Code.from_asset("./lambda"),
                                      environment=dict(
                                          QUEUE_URL=queue.queue_url,
                                          TABLE_NAME=api_table.table_name)
                                      )
        sqs_lambda_url = sqs_lambda.add_function_url(
            auth_type=_lambda.FunctionUrlAuthType.NONE, )
        api_table.grant_write_data(sqs_lambda)

        # This binds the lambda to the SQS Queue
        sqs_event_source = lambda_event_source.SqsEventSource(queue)

        # Add SQS event source to the Lambda function
        sqs_lambda.add_event_source(sqs_event_source)

        CfnOutput(self, "API_Lambda_URL", value=api_lambda_url.url)
        CfnOutput(self, "SQS_Lambda_URL", value=sqs_lambda_url.url)
        CfnOutput(self, "Upload_Sqs_Queue_Url", value=queue.queue_url,
                  description="One SQS Example")
        CfnOutput(self, "DynamoDB_table_name", value=api_table.table_name)
