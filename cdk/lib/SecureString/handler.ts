import type {
  CdkCustomResourceEvent,
  CdkCustomResourceResponse,
} from "aws-lambda";
import {
  SSMClient,
  DeleteParameterCommand,
  PutParameterCommand,
  type PutParameterCommandInput,
  LabelParameterVersionCommand,
} from "@aws-sdk/client-ssm";
import type { SecureStringProps } from "./SecureString";

const client = new SSMClient({ region: process.env.AWS_REGION });

type Event = Omit<CdkCustomResourceEvent, "ResourceProperties"> & {
  ResourceProperties: SecureStringProps;
  ServiceToken: string;
};

/**
 * SecureString Custom Resource handler
 * [lifecycle events](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources-readme.html#handling-lifecycle-events-onevent)
 */
export const handler = async (
  event: Event,
): Promise<CdkCustomResourceResponse> => {
  try {
    const { parameterName, stringValue, keyId, dataType } =
      event.ResourceProperties;

    const physId = {
      PhysicalResourceId: "SecureStringPhysicalIdStatic",
    };

    if (event.RequestType === "Delete") {
      await client.send(
        new DeleteParameterCommand({
          Name: parameterName,
        }),
      );

      return physId;
    }

    const putInput: PutParameterCommandInput = {
      Name: parameterName,
      Type: "SecureString",
      Value: stringValue,
      DataType: dataType ?? "text",
      KeyId: keyId,
      Overwrite: true, // SDK default: false
    };

    if (event.RequestType === "Create") {
      // on create only, put the original version
      await client.send(new PutParameterCommand(putInput));
    }

    // create and update - simulate versions and labels
    const res = await client.send(
      new PutParameterCommand({
        ...putInput,
        Value: stringValue + " - " + new Date().toISOString(),
      }),
    );

    await client.send(
      new LabelParameterVersionCommand({
        Name: parameterName,
        ParameterVersion: res.Version ? res.Version - 1 : undefined,
        Labels: ["Dev"],
      }),
    );

    await client.send(
      new LabelParameterVersionCommand({
        Name: parameterName,
        ParameterVersion: res.Version,
        Labels: ["Prod"],
      }),
    );

    return {
      ...physId,
      Data: { Version: res.Version?.toString() },
    };
  } catch (err: unknown) {
    console.log(err);

    if (err instanceof Error) {
      throw new Error(err.message);
    }

    throw new Error("event handler error");
  }
};
