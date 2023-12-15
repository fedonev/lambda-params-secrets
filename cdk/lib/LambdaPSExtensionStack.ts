import path from "path";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { aws_lambda_nodejs as nodejs } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_ssm as ssm } from "aws-cdk-lib";
import { aws_secretsmanager as sm } from "aws-cdk-lib";
import {
  LambdaPSExtension,
  type LayerArnComponents,
} from "./LambdaPSExtension";
import { SecureString } from "./SecureString";
import { Secret } from "./Secret";

/**
 * A map of the deployed Parameter and Secret properties.
 */
export type TestResources = Record<
  | "stringParam"
  | "stringListParam"
  | "secureStringParam"
  | "stringSecret"
  | "binarySecret",
  { name: string; versionId?: string }
>;

interface LambdaPSExtensionStackProps extends cdk.StackProps {
  /**
   * The ARN of the AWS-managed Lambda Parameters and Secrets Extension layer.
   *
   * Provide an ARN from the list in the [AWS docs](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html#ps-integration-lambda-extensions-add).
   * or a map of ARN components.
   * @default
   * Try to look up the ARN from a local map using the Stack's region.
   */
  layerArn?: string | LayerArnComponents;
}

/**
 * A stack to test the `lambda-ext-params-secrers` client.
 * A Lambda function reads test Secrets and Parameters values using the client.
 */
export class LambdaPSExtensionStack extends cdk.Stack {
  readonly lambda: lambda.IFunction;

  constructor(
    scope: Construct,
    id: string,
    props: LambdaPSExtensionStackProps,
  ) {
    super(scope, id, props);

    /**
     * Some parameters and secrets to test
     */
    const paramPath = "/lambda-ext-test-param";

    const stringParam = new ssm.StringParameter(this, "DummyStringParam", {
      parameterName: `${paramPath}/dummy-string`,
      stringValue: "my-string-param-value",
    });

    const stringListParam = new ssm.StringListParameter(
      this,
      "DummyStringListParam",
      {
        parameterName: `${paramPath}/dummy-string-list`,
        stringListValue: ["listval-0", "listval-1", "listval-2"],
      },
    );

    // creates a SecureString Paramter
    // and immediately increments the version and adds a label
    const secureString = new SecureString(this, "DummySecureString", {
      parameterName: `${paramPath}/dummy-secure-string`,
      stringValue: "my-secure-string-value",
    });

    const stringSecret = new sm.Secret(this, "DummyStringSecret", {
      secretName: "dummy-string-secret",
      secretStringValue: cdk.SecretValue.unsafePlainText(
        "an-insecure-string-secret-value",
      ),
    });

    // creates a BinarySecret and immediately updates it to simulate versions.
    const binarySecret = new Secret(this, "DummyBinarySecret", {
      secretName: "dummy-binary-secret",
      secretBinary: Buffer.from("a string secret value to be saved as binary"),
    });

    const testCases: TestResources = {
      stringParam: { name: stringParam.parameterName },
      stringListParam: { name: stringListParam.parameterName },
      secureStringParam: { name: secureString.parameterName },
      stringSecret: { name: stringSecret.secretName },
      binarySecret: {
        name: binarySecret.secretName,
        versionId: binarySecret.versionId,
      },
    };

    /**
     * A Lambda that uses the Extension to get the test params/secret values
     */
    const architecture = lambda.Architecture.ARM_64;

    this.lambda = new nodejs.NodejsFunction(this, "PSExtensionLambda", {
      description: "Run test cases against the P&S Extension with the Client",
      entry: path.join(__dirname, "funcTestCases.ts"),
      architecture,
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        TEST_CASES: JSON.stringify(testCases),
      },
      layers: [
        new LambdaPSExtension(this, "PSExtension", {
          layerArn: props.layerArn ?? { architecture },
        }),
      ],
    });

    stringParam.grantRead(this.lambda);
    stringListParam.grantRead(this.lambda);
    stringSecret.grantRead(this.lambda);

    this.lambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          secureString.parameterArn,
          // allow the test Lambda to retrieve Secrets via SSM
          ...[stringSecret.secretName, binarySecret.secretName].map((s) =>
            this.formatArn({
              service: "ssm",
              resource: "parameter",
              resourceName: "aws/reference/secretsmanager/" + s,
              arnFormat: cdk.ArnFormat.SLASH_RESOURCE_NAME,
            }),
          ),
        ],
      }),
    );

    this.lambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [binarySecret.secretArn],
      }),
    );

    this.lambda.node.addDependency(secureString);
    this.lambda.node.addDependency(binarySecret);

    new cdk.CfnOutput(this, "FunctionName", {
      value: this.lambda.functionName,
    });
  }
}
