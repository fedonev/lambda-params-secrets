import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { LambdaPSExtensionStack } from "./LambdaPSExtensionStack";

export interface AppStacksProps {
  appName: string;
  env: { account: string; region: string };
  purpose: "Prod" | "Dev" | "Test";
}

/**
 * Add stacks to an `App` or a Pipeline `Stage`
 *
 * sets `scope` and not `this` as the stack scope
 * to omit the wrapper construct id from the stack name
 */
export class AppStacks extends Construct {
  /**
   * Validate `account` and `region` formats.  Annotate `scope` with an error if the validation fails.
   * @param account
   * @param region
   * @returns echo `account` and `region` if valid
   */
  static checkEnv = (
    account: unknown,
    region: unknown,
  ): { account: string; region: string } => {
    if (typeof account != "string" || !/\d{12}/.test(account))
      throw new Error(
        `Provide an explicit AWS Account. ${account} is not a vaild Account.`,
      );

    if (typeof region != "string" || !/[a-z]{2}-[a-z]{4,7}-\d/.test(region))
      throw new Error(
        `Provide an explicit AWS Region. ${region} is not a vaild Region.`,
      );

    return { account, region };
  };

  constructor(scope: cdk.App | cdk.Stage, id: string, props: AppStacksProps) {
    super(scope, id);

    const extensionStack = new LambdaPSExtensionStack(
      scope, // not this
      "LambdaPSExtensionStack",
      {
        description:
          "Retieve sample Parameters and Secrets from a Lambda using the P&S Extension.",
        env: props.env,
        terminationProtection: props.purpose === "Prod",
      },
    );

    cdk.Tags.of(extensionStack).add("x:cdk:app-name", props.appName);
    cdk.Tags.of(extensionStack).add("x:cdk:purpose", props.purpose);
  }
}
