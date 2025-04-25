import os
import json
import boto3


dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ['TABLE_NAME']

sqs_client = boto3.client('sqs')
QUEUE_URL = os.environ['QUEUE_URL']

def handler(event, context):
    """
    { "id": "920183",
      "message": "Very Important Message",
      "image": { "file_name": "image.png",
                 "content": "usefull_image_content" } }
    """
    body = json.loads(event.get('body', dict()))
    user_id = body.get("id", "000000")
    user_msg = body.get("message", "NOT PRESENT")
    user_image = body.get("image", "")
    image_name = "no_file.txt"
    if user_image:
        image_name = user_image.get("file_name", "no_file.txt")

    file_name = f"{user_id}_{image_name}"

    table = dynamodb.Table(TABLE_NAME)
    # put item in table
    response = table.put_item(
        Item={
            'id': str(user_id),
            'message': str(user_msg),
            'image': str(file_name)
        }
    )
    return_dynamo = response.get('ResponseMetadata', dict()).get('HTTPStatusCode')

    body = {
        'id': str(user_id),
        'message': str(user_msg),
        'image': json.dumps(user_image)
    }

    response_sqs_attr = sqs_client.get_queue_attributes(
        QueueUrl=QUEUE_URL,
        AttributeNames=['ApproximateNumberOfMessages'])
    aprox_msg_number = response_sqs_attr.get("Attributes", dict()).get("ApproximateNumberOfMessages", None)

    if aprox_msg_number and int(aprox_msg_number) < 3:
        response = sqs_client.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(body),
            MessageGroupId="lambdaQueue",
            DelaySeconds=0,
        )
        return_sqs = response.get('ResponseMetadata', dict()).get('HTTPStatusCode')
    else:
        return_sqs = 500

    return {
        'statusCodeLambda': 200,
        'statusCodeDynamo': return_dynamo,
        'numberSQSmessages': aprox_msg_number,
        'statusCodeSQS': return_sqs
      }
