const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient();
const { createHmac } = require('crypto');

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.webhookFunction = async (event) => {
    const {
        TABLE_NAME,
        SIGNATURE_KEY, // This is set in the Parameter Store
    } = process.env;
    const hmac = createHmac('sha1', SIGNATURE_KEY);
    const requestUrl = `https://${
        event.requestContext.domainName + event.requestContext.path
    }`;

    try {
        console.info('Event Info: ', event);

        hmac.update(requestUrl+event.body);
        const hash = hmac.digest('base64');

        // Check if we have a valid webhook event
        if(hash !== event.headers['x-square-signature']) {
            // We have an invalid webhook event.
            // Logging and stopping processing.
            console.error(`Mismatched request signature, ${
                hash
            } !== ${
                event.headers['x-square-signature']
            }`)
            throw new Error(`Mismatched request signature`);
        }

        const requestBody = JSON.parse(event.body);

        // Storing the webhook event data to process later
        await DynamoDB.put({
            TableName: TABLE_NAME,
            Item: {
                id: requestBody.event_id,
                ...requestBody
            }
        }).promise();

        // Signal back to Square the event was received
        return {
            'statusCode': 200,
            'body': "ok"
        }
    } catch (err) {
        console.error(err);

        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': JSON.stringify({
                message: err.message
            })
        };
    }

};
