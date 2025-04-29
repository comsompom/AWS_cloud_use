# pylint: disable=E0001
import boto3 


def handler(event, context):
    """
    get the file name from event and save it to the S3 bucket
    """
    S3_BUCKET_NAME = "lambda-dynamo-s3"
    bucket_name = 'lambda-dynamo-s3' 
    file_name = f"{event['file_name']}.txt"
    file_content = 'This is the content of the file.' 
    
    s3 = boto3.client('s3') 
    s3.put_object(Body=file_content, Bucket=bucket_name, Key=file_name) 
    return { 
      'statusCode': 200, 
      'body': 'File uploaded successfully.' 
      }
