#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppStacks } from "../lib/AppStacks";

/**
 * CDK entry point for deploys from the CLI.
 * Create an app and add the stacks.
 */
const app = new cdk.App();

new AppStacks(app, "Dev", {
  env: AppStacks.checkEnv(
    process.env.CDK_DEFAULT_ACCOUNT,
    process.env.CDK_DEFAULT_REGION,
  ),
  purpose: "Dev",
  appName: "LambdaPSExtensionTests",
});
