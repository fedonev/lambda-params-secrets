import { HttpRequester, Requester } from "./lib/requester";
import {
  type Handler,
  ParameterHandler,
  type ParameterHandlerProps,
  SecretHandler,
  type SecretHandlerProps,
} from "./lib/handlers";
import type {
  ErrorResponse,
  ExtensionResponse,
  ParameterResponse,
  SecretResponse,
} from "./lib/responses";

/**
 *  Options for retrieving a Parameter.
 */
export type ParameterOptions = Omit<ParameterHandlerProps, "parameterName">;
/**
 * Options for retrieving a String Parameter.
 * Cannot set both `label` and `version`.
 */
export type StringParameterOptions = Pick<
  ParameterOptions,
  "label" | "version"
>;
/**
 * Options for retrieving a String List Parameter.
 * Cannot set both `label` and `version`.
 */
export type StringListParameterOptions = StringParameterOptions;
/**
 * Options for retrieving a Secure String Parameter.
 * Cannot set both `label` and `version`.
 */
export type SecureStringParameterOptions = Pick<
  ParameterOptions,
  "label" | "version" | "withDecryption"
>;

/**
 * Options when retrieving Secrets using the Parameter Store endpoint.
 * Set one or neither, but not both:
 *
 * - `label` sets the `VersionStage` of the Secret (default `AWSCURRENT`)
 * - `version` sets the `VersionId`
 *
 * `withDecryption` is not an option.
 *  Secrets returned from the Parameter Store are always returned encrypted
 */
export type SecretFromParamStoreOptions = Pick<
  ParameterOptions,
  "version" | "label"
>;
export type SecretOptions = Omit<SecretHandlerProps, "secretId">;

/**
 * Client Options
 */
export interface ClientOptions {
  /**
   * Requests to the extension require an AWS-supplied session token.
   * The Lambda service sets the opaque token value for running functions in the `AWS_SESSION_TOKEN` environment variable.
   *
   * The Client sends the token in the `X-Aws-Parameters-Secrets-Token` header.
   * Using this header indicates that the caller is within the Lambda environment.
   *
   * @default
   * process.env.AWS_SESSION_TOKEN
   */
  token?: string;
  /**
   * Port is the Lambda Extension HTTP listener's assigned port on `localhost`.
   *
   * The Lambda service sets a default value of `"2773"` in `PARAMETERS_SECRETS_EXTENSION_HTTP_PORT`.
   * Lambda users can override the default by setting the Lambda Function's environment variable.
   *
   * `http://localhost:<port>`
   *
   * @default
   * process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT ?? "2773"
   */
  port?: string;
  /**
   * An object capable of making a HTTP GET Request
   *
   * @default
   * `HttpRequester`
   */
  requester?: Requester;
}

/**
 * The Client makes requests to the `http:localhost` endpoint exposed by
 * the AWS Parameters and Secrets Lambda Extension.
 */
export class Client {
  /**
   * The Extension's base URL endpoint.
   * Protocol + host + port number.
   *
   * @default
   * `http://localhost:2773`
   */
  readonly baseUrl: string;
  /**
   * An object capable of making a HTTP GET Request
   *
   * @default
   * `HttpRequester`
   */
  private readonly requester: Requester;

  constructor(props?: ClientOptions) {
    const port = parseInt(
      props?.port ??
        process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT ??
        "2773",
      10,
    );

    this.baseUrl = `http://localhost:${port}`;

    const token = props?.token ?? process.env.AWS_SESSION_TOKEN;

    if (!token) {
      throw new Error(
        "Missing token.  Expected a AWS session token in AWS_SESSION_TOKEN." +
          "\nEnsure the AWS-Parameters-and-Secrets-Lambda-Extension Layer is enabled on the Lambda.",
      );
    }

    this.requester = props?.requester ?? new HttpRequester();

    this.requester.addHeaders({ "X-Aws-Parameters-Secrets-Token": token });
  }

  /**
   * Get the resource.
   */
  private async getResource<T extends ExtensionResponse>(
    handler: Handler,
  ): Promise<T | ErrorResponse> {
    const res = await this.requester.get(this.baseUrl + handler.path);

    if (res.error) return { error: res.error };

    return res.json;
  }

  /**
   * Get a SSM String Parameter Value for from the Extension.
   *
   * If `parameterName` returns a comma-deliminated string for a `StringList`
   * and the decrypted value of a `SecureString`.
   * @param parameterName the `String` or `StringList` parameter name
   * @param options optional qualifiers
   * @returns a Promise of the parameter's string valu. `null` if error or undefined.
   */
  async stringParameter(
    parameterName: string,
    options?: StringParameterOptions,
  ): Promise<string | null> {
    const response = await this.parameterResponse(parameterName, options);

    if (!ParameterHandler.isParameterResponse(response)) return null;
    if (!response.Parameter.Type) return null;

    if (
      !["String", "StringList", "SecureString"].includes(
        response.Parameter.Type,
      )
    ) {
      return null;
    }

    return response.Parameter.Value ?? null;
  }

  /**
   * Get a SSM String Parameter List Values as an array from the Extension.
   *
   * Use the `stringParameter` method to return the stringified value of a `StringList`.
   * @param parameterName the `StringList` parameter name
   * @param options optional qualifiers
   * @returns a Promise of the parameter's values as an array. `null` if error or undefined.
   */
  async stringListParameter(
    parameterName: string,
    options?: StringListParameterOptions,
  ): Promise<string[] | null> {
    const response = await this.parameterResponse(parameterName, options);

    if (!ParameterHandler.isParameterResponse(response)) return null;
    if (!response?.Parameter?.Value || response.Parameter.Type != "StringList")
      return null;

    return response.Parameter.Value.split(",").map((el) => el.trim());
  }

  /**
   * Get a SSM String Parameter List Value from the Extension.
   * @param parameterName the `SecureString` parameter name
   * @param options optional qualifiers.  The Client sets `withDecryption: true` by default.
   * @returns a Promise of the parameter's value. `null` if error or undefined.
   */
  async secureStringParameter(
    parameterName: string,
    options?: SecureStringParameterOptions,
  ): Promise<string | null> {
    const response = await this.parameterResponse(parameterName, {
      withDecryption: true,
      ...options,
    });

    if (!ParameterHandler.isParameterResponse(response)) return null;
    if (response?.Parameter?.Type != "SecureString") return null;

    return response.Parameter.Value ?? null;
  }

  /**
   * Get a String Secret [from the SSM Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/integration-ps-secretsmanager.html) using the Extension.
   *
   * Always returns the decrypted value.  The WithDecryption flag must be True for retrieving a Secret Manager secret.
   * @param secretId the `StringSecret` secret name
   * @param options optional qualifiers.  The Client sets `withDecryption: true` by default.
   * @returns a Promise of the parameter's value. `null` if error or undefined.
   */
  async stringSecretfromParameterStore(
    secretId: string,
    options?: SecretFromParamStoreOptions,
  ): Promise<string | null> {
    const response = await this.parameterResponse(secretId, {
      fromSecretsManager: true,
      withDecryption: true,
      ...options,
    });

    if (!ParameterHandler.isParameterResponse(response)) return null;
    return response.Parameter.Value ?? null;
  }

  /**
   * Get a Binary Secret [from the SSM Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/integration-ps-secretsmanager.html) using the Extension.
   *
   * Always returns the decrypted value.  The WithDecryption flag must be True for retrieving a Secret Manager secret.
   * @param secretId the `BinarySecret` secret name
   * @param options optional qualifiers.  The Client sets `withDecryption: true` by default.
   * @returns a Promise of a Binary Secret as a `Buffer. `null` if error or undefined.
   */
  async binarySecretfromParameterStore(
    secretId: string,
    options?: SecretFromParamStoreOptions,
  ): Promise<Buffer | null> {
    const response = await this.parameterResponse(secretId, {
      fromSecretsManager: true,
      withDecryption: true,
      ...options,
    });

    if (!ParameterHandler.isParameterResponse(response)) return null;
    if (!response.Parameter.SourceResult) return null;

    // Parameter.Value is null for a SecretBinary retrieved from the Parameter Store. Parse the byte array from the SourceResult
    const sourceResult = JSON.parse(response.Parameter.SourceResult);

    if (!sourceResult?.["secretBinary"]?.["hb"]) return null;

    return Buffer.from(sourceResult?.["secretBinary"]?.["hb"]);
  }

  /**
   * Get the full Response object from the Extension for a SSM Parameter
   * @param parameterName the parameter name
   * @param options optional qualifiers
   * @returns a Promise of the full response object returned by the Extension.
   */
  async parameterResponse(
    parameterName: string,
    options?: ParameterOptions,
  ): Promise<ParameterResponse | ErrorResponse> {
    const handler = new ParameterHandler({
      parameterName,
      ...options,
    });
    return this.getResource(handler);
  }

  /**
   * Get the extension localhost URL path for a SSM Parameter
   * @param parameterName the parameter name
   * @param options optional qualifiers
   * @returns the localhost path of the request
   */
  parameterPath(parameterName: string, options?: ParameterOptions): string {
    const handler = new ParameterHandler({
      parameterName,
      ...options,
    });
    return handler.path;
  }

  /**
   * * Get a Secrets Manager `StringSecret` Value from the Extension.
   * @param secretId the secret id
   * @param options optional qualifiers.
   * @returns a Promise of a String Secret or `null` if error or undefined
   */
  async stringSecret(
    secretId: string,
    options?: SecretOptions,
  ): Promise<string | null> {
    const response = await this.secretResponse(secretId, options);

    if (!SecretHandler.isSecretResponse(response)) return null;

    return response?.SecretString ?? null;
  }

  /**
   * Get a Secrets Manager `BinarySecret` Value as a `Buffer` from the Extension.
   *
   * Converts the Extension's Base64 string response to a `Buffer`.
   * @param secretId the secret id
   * @param options optional qualifiers.
   * @returns a Promise of a Binary Secret as a `Buffer. `null` if error or undefined.
   */
  async binarySecret(
    secretId: string,
    options?: SecretOptions,
  ): Promise<Buffer | null> {
    const response = await this.secretResponse(secretId, options);
    // GetSecretValueCommandOutput: "The response parameter represents the binary data as a base64-encoded string.""

    if (!SecretHandler.isSecretResponse(response)) return null;

    const b64 = response.SecretBinary;
    if (!b64) return null;

    return Buffer.from(b64, "base64");
  }

  /**
   * Get the full Response object from the Extension for a SecretManager Secret.
   *
   * For Binary Secrets _"The response parameter represents the binary data as a base64-encoded string."_
   * (`GetSecretValueCommandOutput`)
   * @param secretId the secret id
   * @param options optional qualifiers.
   * @returns a Promise of the full response object returned by the Extension
   */
  async secretResponse(
    secretId: string,
    options?: SecretOptions,
  ): Promise<SecretResponse | ErrorResponse> {
    const handler = new SecretHandler({ secretId, ...options });
    return this.getResource(handler);
  }

  /**
   * Get the extension localhost URL path for a SecretManager Secret
   * @param secretId the secret id
   * @param options optional qualifiers
   * @returns the localhost path of the request
   */
  secretPath(secretId: string, options?: SecretOptions): string {
    const handler = new SecretHandler({ secretId, ...options });
    return handler.path;
  }
}
