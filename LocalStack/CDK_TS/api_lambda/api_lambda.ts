// Define the shape of the input event
type UserMsgEvent = {
    id: string;
    message: string;
    image: string;
}

export const handler = async (event: UserMsgEvent): Promise<string> => {
    return "statusCode: 200";
};
