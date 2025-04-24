from aws_cdk import (
    Duration,
    CfnOutput,
    Stack,
    aws_sqs as sqs,
    aws_lambda as _lambda,
    aws_s3 as s3
)
from constructs import Construct

class AwsStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

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

        queue = sqs.Queue(
            self, "lambdaQueue",
            visibility_timeout=Duration.seconds(300),
        )

        lambda_function = _lambda.Function(self, "create-job",
                                           runtime=_lambda.Runtime.PYTHON_3_10,
                                           handler="lambda_sample.handler",
                                           code=_lambda.Code.from_asset("./lambda"),
                                           environment=dict(
                                               QUEUE_URL=queue.queue_url)
                                           )
        lambda_function_url = lambda_function.add_function_url(
            auth_type = _lambda.FunctionUrlAuthType.NONE,)

        CfnOutput(self, "myFunctionUrlOutput", value=lambda_function_url.url)
        CfnOutput(
            self,
            "Upload_Sqs_Queue_Url",
            value=queue.queue_url,
            description="One SQS Example",
        )
