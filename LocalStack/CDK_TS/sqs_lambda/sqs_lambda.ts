import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";


export const TABLE_NAME = process.env.TABLE_NAME;
const client_db = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client_db);

export const BUCKET_NAME = process.env.BUCKET_NAME;
export const client_s3 = new S3Client({});

export interface Result {
    statusCode: number,
    responseMessage: string
};

export const handler = async (event: any = {}): Promise<Result> => {
    for (const record of event.Records) {
        const item = JSON.parse(record.body);
        const user_id: string = item.id;
        const user_msg: string = item.message;
        const user_image = typeof item.image == 'object' ? item.image : JSON.parse(item.image);
        const file_name = user_id + "_" + user_image.file_name;
        const file_content = user_image.content;

        let response_dynamo: any = { "$metadata": { "httpStatusCode": 500 } };
        try {
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    id: user_id,
                    message: user_msg,
                    file_name: file_name
                },
            });

            response_dynamo = await docClient.send(command);

            console.log("Record saved to DynamoDB with response: ", response_dynamo.$metadata.httpStatusCode);

        } catch (error) {
            console.error(error);
            response_dynamo = { "$metadata": { "httpStatusCode": 500 } };
        };

        let response_s3: any = { "$metadata": { "httpStatusCode": 500 } };
        try {
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: file_name,
                Body: file_content,
            });
            const response_s3 = await client_s3.send(command);
            console.log(response_s3);
        } catch (error) {
            console.error("Image saved to S3 with Response: ", error);
            response_s3 = { "$metadata": { "httpStatusCode": 500 } };
        };
    }

    return {
        statusCode: 200,
        responseMessage: "All messages done..."
    };
};
