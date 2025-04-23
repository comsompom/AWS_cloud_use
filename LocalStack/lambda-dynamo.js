import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { readFile } from "node:fs/promises";

import {
    PutObjectCommand,
    S3Client,
    S3ServiceException,
} from "@aws-sdk/client-s3";


const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const table_name = "user_table";
const bucket_name = "sample_super_secret_bucket";


exports.handler = async (event) => {
    const id = event.id;
    const user = event.user;
    const msg = event.msg;
    const image = event.image;
    if (id != "" && user != "" && msg != "") {
        try {
            const response = read_dynamo_db(user, id);
            if ("user" in response && "status" in response) {
                if (response.status === 1) {
                    if (image != "") {
                        const key = user + id;
                        const file_path = user + "/" + "id";
                        save_to_s3(bucket_name, key, file_path);
                    } else {
                        save_to_dynamo(id, user, nsg);
                    }
                } else {
                    return Response.json({ status_code: "4xx", error_msg: "${user} deactivated" });
                };
            };

        } catch (error) {
            return Response.json({ status_code: "4xx", error_msg: "${error}" });
        }
    }
};


async function save_to_dynamo(id, user, msg) {
    let response = "";
    try {
        const command = new PutCommand({
            TableName: table_name,
            Item: {
                id: id,
                user: user,
                msg: msg,
                status: "1",
            },
        });

        response = await docClient.send(command).promise();
        console.log(response);

    } catch (error) {
        console.error(error);
        response = error;
    };

    return response;
};


async function read_dynamo_db(user, id) {
    let response = "";
    try {
        var params = {
            Key: {
                "user": { "S": user },
                "id": { "N": id }
            },
            TableName: table_name
        };
        response = await dynamodb.getItem(params).promise();
        console.log(JSON.stringify(response));
    } catch (error) {
        console.error(error);
        response = error;
    }
    return response;
};


async function save_to_s3(bucketName, key, filePath){
    const client = new S3Client({});
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: await readFile(filePath),
    });

    try {
        const response = await client.send(command);
        console.log(response);
    } catch (caught) {
        if (
            caught instanceof S3ServiceException &&
            caught.name === "EntityTooLarge"
        ) {
            console.error(
                `Error from S3 while uploading object to ${bucketName}. 
                The object was too large. To upload objects larger than 5GB,
                use the S3 console (160GB max) or the multipart upload API (5TB max).`,
            );
        } else if (caught instanceof S3ServiceException) {
            console.error(
                `Error from S3 while uploading object to ${bucketName}.  ${caught.name}: ${caught.message}`,
            );
        } else {
            throw caught;
        }
    }
};
