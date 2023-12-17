# lambda-params-secrets

A Node.js client for the [AWS Lambda Parameters and Secrets Extension](https://aws.amazon.com/about-aws/whats-new/2022/10/aws-parameters-secrets-lambda-extension/).

## What does it do?

**What this package does**: This package's zero-dependency Client makes GET requests from your Lambda to the AWS Extension layer's `localhost` endpoint. It saves you the effort of building the URL, making the HTTP request and parsing the response.

**What AWS does:** The AWS Parameters and Secrets Lambda Extension is an AWS-managed [Lambda Layer](https://docs.aws.amazon.com/lambda/latest/dg/invocation-layers.html). It's one way for Lambdas to [retrieve parameters](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html) from the AWS Parameter Store and [retrieve secrets](https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html) from AWS Secrets Manager. Instead of making SDK calls to these services directly, an Extension-enabled Lambda function makes a HTTP GET request to the Extension's `localhost` endpoint. The Extension makes the `GetParameter` and `GetSecretValue` SDK calls. It returns the JSON result in the HTTP response to the Lambda. The Extension also [caches the results](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html#ps-integration-lambda-extensions-how-it-works), which is its killer feature.

## Getting Started

### Prerequisites

1. Deploy a Node.js Lambda with the `AWS-Parameters-and-Secrets-Lambda-Extension` [layer added](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html#add-extension).
2. Grant the Lambda `ssm:GetParameter` or `secrets:GetSecretValue` permissions. Using the AWS Extension requires the same IAM permissions as making the SDK calls directly.

### Installation

```bash
npm install --save lambda-params-secrets
```

The main `Client` class itself has zero dependencies.  The package has dependencies on the AWS JS SDK v3 clients `@aws-sdk/client-secrets-manager` and `@aws-sdk/client-ssm` for their Typescript type definitions only.

### Usage

Instantiate a Client in your Lambda function handler. Call the Client's methods to get values:

```typescript
// my_lambda_handler.ts
import { Client } from 'lambda-params-secrets';

export async function handler(): Promise<void> {
  const client = new Client();
  const fooListParam: string[] = await client.stringListParameter(
    '/my-app/config/foo-list'
  );
  console.log(fooListParam); // -> ["foo", "bar", "baz"]
}
```

## API

Use Client methods to retrieve parameters and secrets values:

| Method                                                                                                                                                  | Options                        | Happy return value |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------ |
| [stringParameter(name, options)](https://fedonev.github.io/lambda-params-secrets/classes/Client.html#stringParameter)                                   | version, label                 | string             |
| [stringListParameter(name, options)](https://fedonev.github.io/lambda-params-secrets/classes/Client.html#stringListParameter)                           | version, label                 | array of strings   |
| [secureStringParameter(name, options)](https://fedonev.github.io/lambda-params-secrets/classes/Client.html#secureStringParameter)                       | version, label, withDecryption | string             |
| [stringSecret(secretId, options)](https://fedonev.github.io/lambda-params-secrets/classes/Client.html#stringSecret)                                     | versionId, versionStage        | string             |
| [binarySecret(secretId, options)](https://fedonev.github.io/lambda-params-secrets/classes/Client.html#binarySecret)                                     | versionId, versionStage        | Buffer             |
| [stringSecretfromParameterStore(secretId, options)](https://fedonev.github.io/lambda-params-secrets/classes/Client.html#stringSecretfromParameterStore) | version, label                 | string             |
| [binarySecretfromParameterStore(secretId, options)](https://fedonev.github.io/lambda-params-secrets/classes/Client.html#binarySecretfromParameterStore) | version, label                 | Buffer             |

The above methods return `null` if the Client receives an error response.

Want the whole response instead of just the value? Call [parameterResponse(name, options)](https://fedonev.github.io/lambda-params-secrets/classes/Client.html#parameterResponse) or [secretResponse(name, options)](https://fedonev.github.io/lambda-params-secrets/classes/Client.html#secretResponse) to retrieve the Extension's full JSON response.

### Client options

The [Client options](https://fedonev.github.io/lambda-params-secrets/interfaces/ClientOptions.html) have sensible defaults.  Instantiating a client with `new Client()` is a good starting point, which is equivalent to:

```typescript
const client = new Client({
  token: process.env.AWS_SESSION_TOKEN, // default value.  AWS set this opaque value.
  port: process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT, // default value.  AWS sets this by default to 2773.
  requester: new FetchRequester(), // default value.  Bare-bones getter that uses the Node.js native fetch library.  Use HttpRequester() for NodeJS runtimes < 18.
});
```

## Resources

- API [documentation](https://fedonev.github.io/lambda-params-secrets/).
- AWS Extension documentation for [parameters](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html) and [secrets](https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html).
- The [cdk](./cdk/README.md) directory has a CDK app with a sample Lambda for integration testing.
- [test-responses.json](./data/test-responses.json) contains sample request URLs and responses.
- [aws-layer-arns.json](./data/aws-layer-arns.json) contains the [Extension layer ARNs](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html#ps-integration-lambda-extensions-add) by region.

## What if it's not working?

- Double-check the [prerequisites](#prerequisites).
- Check your Lambda's CloudWatch logs. Regardless of the error, the AWS Extension sends clients only a generic `an unexpected error occurred while executing request` message in the HTTP response. But the Extension sends useful error details to the Lambda's CloudWatch logs.
- Please submit a [Bug Report](https://github.com/fedonev/lambda-params-secrets/issues) issue if you are experiencing a package-related error.

## Alternatives

1. Use the AWS Extension without this package. All the Client does is make the HTTP requests. You can do this yourself with any HTTP client.
2. Use the AWS Javascript SDK to call [GetParameter](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/getparametercommand.html) and [GetSecretValue](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/getsecretvaluecommand.html) directly. This is a great approach if you won't benefit from caching.
3. Set non-secret values at deploy-time as Lambda environment variables.

### Using the AWS Extension without this package

- The same [prerequisites](#prerequisites) apply.
- Make a GET request. See the AWS docs for more [examples](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html#ps-integration-lambda-extensions-sample-commands).
  ```
  http://localhost:2773/systemsmanager/parameters/get?name=%2Flambda-ext-test-param%2Fdummy-string
  ```
- Set the `X-Aws-Parameters-Secrets-Token` header value to `AWS_SESSION_TOKEN`.

The AWS Extension responds with a JSON object:

```json
{
  "Parameter": {
    "ARN": "arn:aws:ssm:us-east-1:123456789012:parameter/lambda-ext-test-param/dummy-string",
    "DataType": "text",
    "LastModifiedDate": "2022-11-16T08:22:40.362Z",
    "Name": "/lambda-ext-test-param/dummy-string",
    "Selector": null,
    "SourceResult": null,
    "Type": "String",
    "Value": "my-string-param-value",
    "Version": 1
  },
  "ResultMetadata": {}
}
```

## Contributing

Please submit [Bug Reports](https://github.com/fedonev/lambda-params-secrets/issues/new/choose) and [Feature Requests](https://github.com/fedonev/lambda-params-secrets/issues/new/choose) as issues.
:tada: Pull Requests are also welcome!
See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

This code is made available under the MIT license.
