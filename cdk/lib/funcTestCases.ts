import { Client, HttpRequester } from "../../src";
import type { TestResponses, TestResponse } from "../../data";
import type { TestResources } from "./LambdaPSExtensionStack";

/**
 * Generate some sample Client responses using the CDK-generted Secrets and Parameters.
 * Retrieve Secrets and Parameters from the Parameter and Secret Extension using the Client.
 *
 * If the test cases are run correctly,
 * the Lambda will return `"result": "success"` in the response:
 *
 * `{"result": "success", "responses": { ... }}}`
 *
 * If the test cases are run incorrectly,
 * the Lambda will return `"result": "failure"` in the response.
 *
 * Output is saved at `data/test-responses.json`
 */
export async function handler(): Promise<TestResponses> {
  const happy: Record<string, TestResponse> = {};
  const unhappy: Record<string, TestResponse> = {};

  try {
    // instantiate a client with default settings
    const client = new Client();

    if (!process.env.TEST_CASES) throw new Error("Missing TEST_CASES!");
    const cases = JSON.parse(process.env.TEST_CASES) as TestResources;

    const pp = client.parameterPath;
    const sp = client.secretPath;

    // Happy test cases
    // fetch responses and values for some happy test cases
    //
    console.log("Run the Happy 😀 test cases - expect no errors.");

    happy[pp(cases.stringParam.name)] = {
      description:
        "The stringParameter method returns a string for a String Parameter.",
      value: await client.stringParameter(cases.stringParam.name),
      response: await client.parameterResponse(cases.stringParam.name),
    };

    happy[pp(cases.stringListParam.name)] = {
      description:
        "The stringListParameter method returns as array of strings for a StringList",
      value: await client.stringListParameter(cases.stringListParam.name),
      response: await client.parameterResponse(cases.stringListParam.name),
    };

    happy[pp(cases.stringListParam.name, { version: 1 })] = {
      description:
        "The stringParameter method returns a comma-deliminated string for a StringList",
      value: await client.stringParameter(cases.stringListParam.name, {
        version: 1,
      }),
      response: await client.parameterResponse(cases.stringListParam.name, {
        version: 1,
      }),
    };

    happy[pp(cases.secureStringParam.name, { withDecryption: true })] = {
      description:
        "The secureStringParameter method decrypts the SecureString by default",
      value: await client.secureStringParameter(cases.secureStringParam.name),
      response: await client.parameterResponse(cases.secureStringParam.name, {
        withDecryption: true,
      }),
    };

    happy[
      pp(cases.secureStringParam.name, { version: 1, withDecryption: false })
    ] = {
      description:
        "The secureStringParameter method can optionally return the enrypted value.",
      value: await client.secureStringParameter(cases.secureStringParam.name, {
        version: 1,
        withDecryption: false,
      }),
      response: await client.parameterResponse(cases.secureStringParam.name, {
        version: 1,
        withDecryption: false,
      }),
    };

    happy[
      pp(cases.secureStringParam.name, { label: "Dev", withDecryption: true })
    ] = {
      description:
        "The secureStringParameter method with optional Parameter label set.",
      value: await client.secureStringParameter(cases.secureStringParam.name, {
        label: "Dev",
      }),
      response: await client.parameterResponse(cases.secureStringParam.name, {
        label: "Dev",
        withDecryption: true,
      }),
    };

    happy[pp(cases.secureStringParam.name, { version: 1 })] = {
      description:
        "The stringParameter method returns a SecureString's *encrypted* value.",
      value: await client.stringParameter(cases.secureStringParam.name, {
        version: 1,
      }),
      response: await client.parameterResponse(cases.secureStringParam.name, {
        version: 1,
      }),
    };

    happy[sp(cases.stringSecret.name)] = {
      description:
        "The stringSecret method returns the unencrypted string for a String Secret.",
      value: await client.stringSecret(cases.stringSecret.name),
      response: await client.secretResponse(cases.stringSecret.name),
    };

    happy[sp(cases.stringSecret.name, { versionStage: "AWSCURRENT" })] = {
      description:
        "The stringSecret method with versionStage set.  Returns the string value for a VersionStage.",
      value: await client.stringSecret(cases.stringSecret.name, {
        versionStage: "AWSCURRENT",
      }),
      response: await client.secretResponse(cases.stringSecret.name, {
        versionStage: "AWSCURRENT",
      }),
    };

    happy[
      pp(cases.stringSecret.name, {
        withDecryption: true,
        fromSecretsManager: true,
      })
    ] = {
      description:
        "The stringSecretfromParameterStore method returns a Secret from the Parameter Store endpoint.",
      value: await client.stringSecretfromParameterStore(
        cases.stringSecret.name,
      ),
      response: await client.parameterResponse(cases.stringSecret.name, {
        withDecryption: true,
        fromSecretsManager: true,
      }),
    };

    happy[
      pp(cases.binarySecret.name, {
        withDecryption: true,
        label: "AWSPREVIOUS",
        fromSecretsManager: true,
      })
    ] = {
      description:
        "The binarySecretfromParameterStore method with a VersionStage (as the `label` parameter) returns a decrypted `AWSPREVIOUS` Binary Secret using the Parameter Store endpoint.",
      value: await client.binarySecretfromParameterStore(
        cases.binarySecret.name,
        {
          label: "AWSPREVIOUS",
        },
      ),
      response: await client.parameterResponse(cases.binarySecret.name, {
        withDecryption: true,
        label: "AWSPREVIOUS",
        fromSecretsManager: true,
      }),
    };

    happy[sp(cases.binarySecret.name)] = {
      description:
        "The binarySecret method decodes the extension's Base64-encoded Uint8Array to a Buffer",
      value: await client.binarySecret(cases.binarySecret.name),
      response: await client.secretResponse(cases.binarySecret.name),
    };

    happy[sp(cases.binarySecret.name, { versionStage: "AWSPREVIOUS" })] = {
      description:
        "The binarySecret method with the VersionStage label option set.",
      value: await client.binarySecret(cases.binarySecret.name, {
        versionStage: "AWSPREVIOUS",
      }),
      response: await client.secretResponse(cases.binarySecret.name, {
        versionStage: "AWSPREVIOUS",
      }),
    };

    happy[
      sp(cases.binarySecret.name, {
        versionId: cases.binarySecret.versionId,
      })
    ] = {
      description: "The binarySecret method with the VersionId option set.",
      value: await client.binarySecret(cases.binarySecret.name, {
        versionId: cases.binarySecret.versionId,
      }),
      response: await client.secretResponse(cases.binarySecret.name, {
        versionId: cases.binarySecret.versionId,
      }),
    };

    // Unhappy test cases
    // fetch responses and values for some error test cases
    //
    console.log("Run the Unhappy 😢 test cases - expect errors.");

    unhappy[pp("does-not-exist")] = {
      description: "Error Expected: non-existent or unauthorized parameter.",
      value: await client.stringParameter("does-not-exist"),
      response: await client.parameterResponse("does-not-exist"),
    };

    unhappy[pp(cases.stringListParam.name, { version: 0 })] = {
      description: "Error Expected: invalid Parameter version number.",
      value: await client.stringParameter(cases.stringListParam.name, {
        version: 0,
      }),
      response: await client.parameterResponse(cases.stringListParam.name, {
        version: 0,
      }),
    };

    unhappy[pp(cases.stringParam.name, { version: 1 })] = {
      description:
        "Error Expected: stringListParameter returns a null value if called on a String Parameter.",
      value: await client.stringListParameter(cases.stringParam.name, {
        version: 1,
      }),
      response: {
        error: "Cannot parse a String parameter to a list",
      },
    };

    unhappy[sp(cases.stringSecret.name, { versionStage: "DOESNOTEXIST" })] = {
      description: "Error Expected: non-existent versionStage.",
      value: await client.stringSecret(cases.stringSecret.name, {
        versionStage: "DOESNOTEXIST",
      }),
      response: await client.secretResponse(cases.stringSecret.name, {
        versionStage: "DOESNOTEXIST",
      }),
    };

    // HTTP requester test cases
    // test the HttpRequester rquester
    //
    console.log("Run the HTTP requester test cases");

    const clientHttp = new Client({
      requester: new HttpRequester(),
      token: process.env.AWS_SESSION_TOKEN,
      port: process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT,
    });

    happy["HttpRequester-" + pp(cases.stringParam.name)] = {
      description:
        "The stringParameter method returns a string for a String Parameter using the HttpRequester.",
      value: await clientHttp.stringParameter(cases.stringParam.name),
      response: await clientHttp.parameterResponse(cases.stringParam.name),
    };

    // fetch responses and values for some error test cases
    unhappy[pp("HttpRequester-" + "does-not-exist")] = {
      description:
        "Error Expected: non-existent or unauthorized parameter using the HttpRequester.",
      value: await clientHttp.stringParameter("does-not-exist"),
      response: await clientHttp.parameterResponse("does-not-exist"),
    };

    const responses = { ...happy, ...unhappy };

    if (!Object.values(responses).every((x) => x.response != undefined)) {
      const errs = Object.values(responses).filter((x) => !!x.response);
      console.log(errs);

      throw new Error(
        "Assert failed - a response is NOT defined for all cases",
      );
    }

    if (
      !Object.values(happy).every(
        (x) => x.value !== null && x.response["error"] === undefined,
      )
    ) {
      const errs = Object.values(happy).filter(
        (x) => x.value === null || x.response["error"] !== undefined,
      );
      console.log("Happy case errors:", errs);

      throw new Error(
        "Happy case errors - expected non-null values and undefined errors",
      );
    }

    if (
      !Object.values(unhappy).every(
        (x) => x.value === null && x.response["error"] !== undefined,
      )
    ) {
      const errs = Object.values(unhappy).filter(
        (x) => x.value !== null || x.response["error"] === undefined,
      );
      console.log("Unhappy case errors", errs);

      throw new Error(
        "Unhappy case errors - expected null values and defined errors",
      );
    }

    return { result: "success", responses };
  } catch (err: unknown) {
    console.log(
      err instanceof Error ? err.message : "An unknown error has occurred.",
    );

    return { result: "failure", responses: { ...happy, ...unhappy } };
  }
}
