import type {
  CdkCustomResourceEvent,
  CdkCustomResourceResponse,
} from "aws-lambda";
import {
  SecretsManagerClient,
  DeleteSecretCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import type { SecretHandlerProps } from "./Secret";

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

type Event = Omit<CdkCustomResourceEvent, "ResourceProperties"> & {
  ResourceProperties: SecretHandlerProps;
  ServiceToken: string;
};

/**
 * Secret Custom Resource handler.
 *
 * [lifecycle events](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources-readme.html#handling-lifecycle-events-onevent)
 */
export const handler = async (
  event: Event,
): Promise<CdkCustomResourceResponse> => {
  try {
    const { secretName, secretString, secretBinary, description } =
      event.ResourceProperties;

    const physId = {
      PhysicalResourceId: "SecretPhysicalIdStatic",
    };

    // Delete the secret
    if (event.RequestType === "Delete") {
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/interfaces/deletesecretcommandinput.html
      await client.send(
        new DeleteSecretCommand({
          SecretId: secretName,
          ForceDeleteWithoutRecovery: true,
        }),
      );

      return physId;
    }

    const commonInput = {
      SecretBinary: secretBinary ? Buffer.from(secretBinary.data) : undefined,
      SecretString: secretString,
      Description: description,
    };

    // Create a new secret and simulate a new version by updating its value
    if (event.RequestType === "Create") {
      //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/interfaces/createsecretcommandinput.html
      await client.send(
        new CreateSecretCommand({
          ...commonInput,
          Name: secretName,
        }),
      );

      const suffix = " updatedVersion!";

      const res = await client.send(
        new UpdateSecretCommand({
          ...commonInput,
          SecretId: secretName,
          SecretBinary: secretBinary
            ? Buffer.concat([
                Buffer.from(secretBinary.data),
                Buffer.from(suffix),
              ])
            : undefined,
          SecretString: secretString ? secretString + suffix : undefined,
        }),
      );

      return {
        ...physId,
        Data: { Arn: res.ARN, VersionId: res.VersionId },
      };
    }

    // Update the secret
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/interfaces/updatesecretcommandinput.html
    const res = await client.send(
      new UpdateSecretCommand({
        ...commonInput,
        SecretId: secretName,
      }),
    );

    return {
      ...physId,
      Data: { Arn: res.ARN, VersionId: res.VersionId },
    };
  } catch (err: unknown) {
    console.log(err);

    if (err instanceof Error) {
      throw new Error(err.message);
    }

    throw new Error("event handler error");
  }
};
