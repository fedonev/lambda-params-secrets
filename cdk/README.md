# CDK Testing App

A CDK app for testing the `lambda-params-secrets` client.

## What does it do?

The CDK deploys a single stack with:
- several dummy Secret and Parameter resources
- a Node.js Lambda with the AWS Parameters and Secrets Lambda Extension layer

The [Lambda handler](./lib/funcTestCases.ts) uses the package's Client to make sample requests to the Extension.  It returns a [map of test request paths and responses](../data/test-responses.json).

## Getting Started

The `package.json` has scripts for `cdk-synth`, `cdk-deploy` and `cdk-destroy`.

```bash
# deploy the app using the default AWS profile
npm run cdk-deploy

# apply a different profile
npm run cdk-deploy -- --profile my-profile
```

:moneybag: The app deploys several Secret Manager Secrets, which are not free.
