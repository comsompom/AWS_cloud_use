# pylint: disable=C0303
# pylint: disable=C0114
# pylint: disable=E0401
# pylint: disable=W0613
# pylint: disable=R0801
import boto3 


def handler(event, context):
    """
    { "file_name": "sample_value" }
    """
    file_name = f'{event["file_name"]}.txt'
    file_content = 'This is the content of the file.' 
    
    s3 = boto3.client('s3')
    s3.put_object(Body=file_content, Bucket="lambda-sample-s3", Key=file_name)
    return { 
      'statusCode': 200, 
      'body': 'File uploaded successfully.' 
      }
