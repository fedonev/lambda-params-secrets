import * as cdk from "aws-cdk-lib";
import { LambdaPSExtension, LayerArnComponents } from "./LambdaPSExtension";

describe("The Extension Construct can build the Layer ARN", () => {
  const app = new cdk.App();

  interface TestResources {
    name: string;
    stack: cdk.Stack;
    layerArn: string | LayerArnComponents;
    expected: string;
    expectError?: boolean;
  }

  const cases: Array<TestResources> = [
    {
      name: "a complete ARN",
      stack: new cdk.Stack(app, "Stack1"),
      layerArn:
        "arn:aws:lambda:us-east-2:590474943231:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2",
      expected:
        "arn:aws:lambda:us-east-2:590474943231:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2",
    },
    {
      name: "Stack region",
      stack: new cdk.Stack(app, "Stack2", {
        env: { account: "123456789012", region: "us-east-2" },
      }),
      layerArn: {},
      expected:
        "arn:aws:lambda:us-east-2:590474943231:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2",
    },
    {
      name: "Stack region with Architecture",
      stack: new cdk.Stack(app, "Stack3", {
        env: { account: "123456789012", region: "eu-central-1" },
      }),
      layerArn: { architecture: cdk.aws_lambda.Architecture.ARM_64 },
      expected:
        "arn:aws:lambda:eu-central-1:187925254637:layer:AWS-Parameters-and-Secrets-Lambda-Extension-Arm64:2",
    },
    {
      name: "an unknownn region name throws",
      stack: new cdk.Stack(app, "Stack4", {
        env: { account: "123456789012", region: "mars-central-99" },
      }),
      layerArn: {},
      expectError: true,
      expected:
        "Cannot read properties of undefined (reading 'layerVersionArn')",
    },
    {
      name: "an non-existing architecture throws",
      stack: new cdk.Stack(app, "Stack5"),
      layerArn: {
        layerRegion: "sa-east-1",
        architecture: cdk.aws_lambda.Architecture.ARM_64,
      },
      expectError: true,
      expected:
        "Cannot read properties of undefined (reading 'layerVersionArn')",
    },
  ];

  cases.forEach((c) => {
    test(`LayerArn from ${c.name}`, () => {
      const ext = new LambdaPSExtension(c.stack, "Extension", {
        layerArn: c.layerArn,
      });

      if (c.expectError) {
        expect(() => ext.layerVersionArn).toThrow(c.expected);
      } else {
        expect(ext.layerVersionArn).toBe(c.expected);
      }
    });
  });
});
