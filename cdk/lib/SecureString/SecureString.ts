import path from "path";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { custom_resources as cr } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_lambda_nodejs as nodejs } from "aws-cdk-lib";

/**
 * A subset of the parameters accepted by the SDK's `PutParameterCommand`.
 *
 * See [PutParameterCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/interfaces/putparametercommandinput.html).
 */
export interface SecureStringProps {
  parameterName: string;
  stringValue: string;
  /**
   * The [data type](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/interfaces/putparametercommandinput.html#datatype) for a StringParameter.
   * @default
   * `text`
   */
  dataType?: "text" | "aws:ec2:image" | "aws:ssm:integration";
  keyId?: string;
}

/**
 * Custom Resource to create a Systems Manager `SecureString` Parameter
 *
 * CloudFormation / CDK do not support creating SecureString Parameters
 */
export class SecureString extends Construct {
  readonly parameterName: string;
  readonly parameterArn: string;
  readonly version: string;

  constructor(scope: Construct, id: string, props: SecureStringProps) {
    super(scope, id);

    this.parameterName = props.parameterName;
    this.parameterArn = cdk.Stack.of(this).formatArn({
      service: "ssm",
      resource: "parameter",
      resourceName: props.parameterName.replace(/^\//, ""),
      arnFormat: cdk.ArnFormat.SLASH_RESOURCE_NAME,
    });

    const fn = new nodejs.NodejsFunction(this, "CRHandler", {
      description: "A Custom Resource handler for the SecureString",
      entry: path.join(__dirname, "handler.ts"),
      runtime: lambda.Runtime.NODEJS_16_X,
      architecture: lambda.Architecture.ARM_64,
      reservedConcurrentExecutions: 1,
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "ssm:PutParameter",
            "ssm:DeleteParameter",
            "ssm:LabelParameterVersion",
          ],
          resources: [this.parameterArn],
        }),
      ],
    });

    const provider = new cr.Provider(this, "ProviderCR", {
      onEventHandler: fn,
    });

    const crResponse = new cdk.CustomResource(this, "CustomResource", {
      resourceType: "Custom::SecureString",
      serviceToken: provider.serviceToken,
      properties: props,
    });

    this.version = crResponse.getAttString("Version");
  }
}
