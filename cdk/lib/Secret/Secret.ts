import path from "path";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { custom_resources as cr } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_lambda_nodejs as nodejs } from "aws-cdk-lib";

/**
 * Passed to the Secret Construct
 */
export interface SecretProps {
  secretName: string;
  description?: string;
  /**
   * Provide one of `secretString` or `secretBinary`
   */
  secretString?: string;
  /**
   * Provide one of `secretString` or `secretBinary`
   */
  secretBinary?: Buffer;
}

/**
 * Secret CustomResource `properties`, which it passes to the Lambda handler.
 */
export interface SecretHandlerProps extends Omit<SecretProps, "secretBinary"> {
  /**
   * `Buffer` in JSON serialized form.  This is return type of [buf.toJSON()](https://nodejs.org/api/buffer.html#buftojson)
   */
  secretBinary?: {
    type: "Buffer";
    data: Array<number>;
  };
}

/**
 * Custom Resource to create a Secrets Manager Binary Secret
 *
 * CloudFormation / CDK do not support creating Secret Manager Binary Secrets
 *
 * CAUTION: For testing purposes only.  The secret value is exposed in the template.
 */
export class Secret extends Construct {
  readonly secretName: string;
  /**
   * Secret ARN with the `-??????` wildcard suffix
   */
  readonly secretArn: string;
  /**
   * The secret's UUID-type versionId.
   */
  readonly versionId: string;

  constructor(scope: Construct, id: string, props: SecretProps) {
    super(scope, id);

    if (
      (!props.secretBinary && !props.secretString) ||
      (props.secretBinary && props.secretString)
    )
      throw new Error(
        "Exactly one of secretString or secretBinary is required."
      );

    this.secretName = props.secretName;
    this.secretArn = cdk.Stack.of(this).formatArn({
      service: "secretsmanager",
      resource: "secret",
      resourceName: props.secretName + "-??????",
      arnFormat: cdk.ArnFormat.COLON_RESOURCE_NAME,
    });

    const fn = new nodejs.NodejsFunction(this, "CRHandler", {
      description: "A Custom Resource handler for the Secret",
      entry: path.join(__dirname, "handler.ts"),
      runtime: lambda.Runtime.NODEJS_16_X,
      architecture: lambda.Architecture.ARM_64,
      reservedConcurrentExecutions: 1,
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "secretsmanager:CreateSecret",
            "secretsmanager:UpdateSecret",
            "secretsmanager:DeleteSecret",
          ],
          resources: [this.secretArn],
        }),
      ],
    });

    /**
     * aws-cdk-lib.custom_resources Provider
     */
    const provider = new cr.Provider(this, "ProviderCR", {
      onEventHandler: fn,
    });

    const properties: SecretHandlerProps = {
      ...props,
      secretBinary: props?.secretBinary?.toJSON(),
    };

    const crResponse = new cdk.CustomResource(this, "CustomResource", {
      resourceType: "Custom::Secret",
      serviceToken: provider.serviceToken,
      properties,
    });

    this.versionId = crResponse.getAttString("VersionId");
  }
}
