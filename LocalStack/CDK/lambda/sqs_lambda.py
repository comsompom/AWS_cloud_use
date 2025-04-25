import os
import boto3


dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ['TABLE_NAME']


def process_message(message):
    try:
        print(f"Processed message {message['body']}")
        """
        Processed message {"id": "23920183", 
        "message": "Very Important Message New", 
        "image": "{\"file_name\": \"image.png\", \"content\": \"usefull_image_content\"}"}
        """
    except Exception as err:
        print("An error occurred")
        raise err


def handler(event, context):
    for message in event['Records']:
        body = message.get('body', dict())
        user_id = body.get('id', "NO_ID")
        user_msg = body.get('message', "NO MESSAGE RECEIVED")
        user_img = json.loads(body.get('image', '{}'))
        user_img_file_name = user_img.get('file_name', 'NO_FILE.txt')
        user_img_file_content = user_img.get('content', 'NO CONTENT PRESENT')
        file_name = f"{user_id}_{user_img_file_name}"

        table = dynamodb.Table(TABLE_NAME)
        # put item in table
        response = table.put_item(
            Item={
                'id': str(user_id),
                'message': str(user_msg),
                'image': str(file_name)
            }
        )

        print(f"PutItem succeeded: {response}")

        s3 = boto3.client('s3')
        s3.put_object(Body=user_img_file_content, Bucket="lambda-sample-s3", Key=file_name)
    return { 
      'statusCode': 200, 
      'body': 'File uploaded successfully.' 
      }
