import os
import json
import boto3


dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ['TABLE_NAME']


def handler(event, context):
    for message in event['Records']:
        body = json.loads(message.get('body', '{}'))
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
