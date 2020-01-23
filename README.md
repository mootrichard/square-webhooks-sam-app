# SAM Application Template for Webhooks on Square

## Prerequisites
- [AWS account](https://aws.amazon.com/)
- [AWS CLI installed](https://aws.amazon.com/cli/)
- [AWS SAM CLI installed](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Square Account](https://developer.squareup.com/apps)

## Tools Used in AWS
- API Gateway
- Lambda
- DynamoDB
- Parameter Store

## How This Works

This SAM Application creates an API Gateway, a Lambda function, and a DynamoDB table. The lambda function is tied to an API Gateway endpoint, which validates that the request is a Webhook event that came from Square and then stores the webhook data in a DynamoDB table with the Webhook `event_id` as the primary key.

Parameter Store is used to store the Square Webhook Signature Key to be used inside of the Lambda function as an environment variable for verifying the payload.

## Instructions

1. Create a parameter in Parameter Store to prevent error in deploying the SAM application

Run this command in your terminal:

```shell
aws ssm put-parameter --name=SIGNATURE_KEY --value=anything --type=String
```

This will create the necessary parameter in your parameter store to allow deploying the SAM application. We will be going back to change this later.

2. Deploy the SAM application to AWS

Run the following commands in your terminal:

```shell
sam build && sam deploy -g
```

3. Copy the API Gateway URL that has been emitted

Here is a redacted example of what should be emitted at the bottom:
```plaintext
-------------------------------------------------------------------------------------------------
OutputKey-Description                            OutputValue
-------------------------------------------------------------------------------------------------
WebhookFunctionFunctionIamRole - Implicit IAM    arn:aws:iam::REDACTED:role/square-
Role created for WebhookFunction function        webhooks-WebhookFunctionRole-REDACTED
WebhookFunction - Hello World Lambda Function    arn:aws:lambda:us-
ARN                                              east-1:REDACTED:function:square-webhooks-
                                                 WebhookFunction-REDACTED
WebhookApi - API Gateway endpoint URL            https://REDACTED.execute-api.us-
                                                 east-1.amazonaws.com/test/
-------------------------------------------------------------------------------------------------
```

The URL that you need should be found where you see `https://REDACTED.execute-api.us-east-1.amazonaws.com/test/`.

You can follow instructions [here](https://developer.squareup.com/docs/webhooks-api/subscribe-to-events#subscribe-to-a-webhook) for how to add the webhook URL to your Square account.

4. Update Parameter Store with Square Webhook Signature Key

Run the below command in your terminal:
```
aws ssm delete-parameter --name=SIGNATURE_KEY
```

> We are deleting the key due to Parameter Store not supporting dynamic versioning. Our SAM Application expects to use Version 1 of the parameter `SIGNATURE_KEY`.

Next we want to run the below command in your terminal, but replace `YOUR_SIGNATURE_KEY` with the key copied from your Square Webhook Signature Key:
```
aws ssm put-parameter --name=SIGNATURE_KEY --value=YOUR_SIGNATURE_KEY --type=String
```

There are additional instructions on [finding your Signature Key in the Square Documentation](https://developer.squareup.com/docs/webhooks-api/validate-notifications#information-you-will-need).

5. Test Your Webhook

Now that you have created a webhook endpoint and configured the subscription, you can quickly test your end point to see if it will handle the notification request correctly. To do this:

- Click on the webook event you want to test. A Webhook Details dialog opens.

- Click More on the bottom of the dialog to open a context menu.

- Click Send Test Event to send an event to the event listener that you set up at the endpoint.

> You should now see a `200 OK` response in Square indicating that the webhook event was correctly received and processed.

