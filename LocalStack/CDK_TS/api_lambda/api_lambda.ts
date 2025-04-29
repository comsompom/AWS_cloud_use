import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand, GetQueueAttributesCommand, SendMessageCommandInput } from "@aws-sdk/client-sqs";

const limit_sqs_messages: number = 2;

const TABLE_NAME = process.env.TABLE_NAME || '';
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const sqsClient = new SQSClient({});
const queueUrl = process.env.QUEUE_URL;

export interface Result {
    statusCodeLambda: number,
    statusCodeDynamo: number,
    numberSQSmessages: number,
    statusSQSsend: number,
    responseMessage: string
};

export interface bodySQS {
    id: string;
    message: string;
    image: string;
};

export const handler = async (event: any = {}): Promise<Result> => {
    if (!event.body) {
        return set_response(200, 400, 999, 400, 'invalid request, you are missing the parameter body');
    }
    const item = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
    if (!item.id || !item.message) {
        return set_response(200, 400, 999, 400, 'Not set id or message. Check documentation.');
    }
    const user_id: string = item.id;
    const user_msg: string = item.message;
    const user_image = typeof item.image == 'object' ? item.image : JSON.parse(item.image);

    const bodySQS: bodySQS = {
        id: user_id,
        message: user_msg,
        image: user_image
    };

    const messageBody = JSON.stringify(bodySQS);

    let response_dynamo: any = { "$metadata": { "httpStatusCode": 500 } };
    try {
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                id: user_id
            },
        });

        response_dynamo = await docClient.send(command);

    } catch (error) {
        console.error(error);
        response_dynamo = { "$metadata": { "httpStatusCode": 500 } };
    };

    const getQueueAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ["ApproximateNumberOfMessages"],
    });

    const getQueueAttributesResponse = await sqsClient.send(getQueueAttributesCommand);

    if (!getQueueAttributesResponse.Attributes || !getQueueAttributesResponse.Attributes.ApproximateNumberOfMessages) {
        throw new Error("Failed to get queue attributes or ApproximateNumberOfMessages attribute is missing.");
    }

    const numberSQSmessages = parseInt(getQueueAttributesResponse.Attributes.ApproximateNumberOfMessages);

    if (numberSQSmessages <= limit_sqs_messages) {
        const params: SendMessageCommandInput = {
            QueueUrl: queueUrl,
            MessageBody: messageBody,
            MessageGroupId: "lambdaQueue",
            MessageAttributes: {
                "MessageType": {
                    DataType: "String",
                    StringValue: "User_Message_$(user_id)",
                },
            },
        };

        const command = new SendMessageCommand(params);
        const send_msg_response = await sqsClient.send(command);

        if (!send_msg_response.MessageId) {
            return set_response(200, response_dynamo.$metadata.httpStatusCode, numberSQSmessages, 500, 'SQS message not send.');
        }

        console.log("Message sent to SQS, MessageId:", send_msg_response);
    };

    return set_response(200, response_dynamo.$metadata.httpStatusCode, numberSQSmessages, 200, "All API operations done.");
};

export const set_response = async (statusCodeLambda: number,
    statusCodeDynamo: number,
    numberSQSmessages: number,
    statusSQSsend: number,
    responseMessage: string): Promise<Result> => {
        return {
            statusCodeLambda: statusCodeLambda,
            statusCodeDynamo: statusCodeDynamo,
            numberSQSmessages: numberSQSmessages,
            statusSQSsend: statusSQSsend,
            responseMessage: responseMessage
        };
};
