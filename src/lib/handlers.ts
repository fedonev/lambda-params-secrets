import type {
  ExtensionResponse,
  ParameterResponse,
  SecretResponse,
} from "./responses";

/**
 * Handler is the abstract base class representing
 * values returned from the Lambda Extension.
 */
export abstract class Handler {
  /**
   * The request path
   *
   * Starts with a forward slash.  Includes query parameters.
   */
  abstract get path(): string;
}

/**
 * Parameter request properties
 *
 * See SDK [GetParameterCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/interfaces/getparametercommandinput.html).
 * In the GetParameter API, versions and labels are appended to the parameter name as a "selector".
 */
export interface ParameterHandlerProps {
  /**
   * The parameter name.
   */
  parameterName: string;
  /**
   * A Parameter [version](https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-paramstore-versions.html) number.
   * A new Parameter has a `version` of `1`
   *
   * @default undefined (latest version)
   */
  version?: number;
  /**
   * A Parameter [label](https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-paramstore-labels.html)
   *
   * If `version` is defined, the Extension ignores `label`
   * @default undefined (latest version)
   */
  label?: string;
  /**
   * Whether to return the decrypted SecureString [Parameter](https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_GetParameter.html) value.
   *
   * @default false
   */
  withDecryption?: boolean;
  /**
   * Whether `parameterName` is a Secrets Manager `SecretId` to be [retrieved via the ParameterStore](https://docs.aws.amazon.com/systems-manager/latest/userguide/integration-ps-secretsmanager.html).
   *
   * @default false
   */
  fromSecretsManager?: boolean;
}

/**
 * Handler for SSM Parameter Store parameter requests.
 *
 * [AWS Docs: Using Parameter Store parameters in AWS Lambda functions](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html#ps-integration-lambda-extensions-how-it-works)
 */
export class ParameterHandler extends Handler {
  readonly parameterName: string;
  readonly version?: number;
  readonly label?: string;
  readonly withDecryption: boolean;
  readonly fromSecretsManager: boolean;

  /**
   * Parameter response type guard
   * @param response
   * @returns true if `response` is a ParameterResponse
   */
  static isParameterResponse(
    response: ExtensionResponse,
  ): response is ParameterResponse {
    return typeof response === "object" && "Parameter" in response;
  }

  constructor(props: ParameterHandlerProps) {
    super();

    if (props.fromSecretsManager) {
      this.fromSecretsManager = true;
      this.parameterName =
        "/aws/reference/secretsmanager/" +
        (props.parameterName.startsWith("/")
          ? props.parameterName.substring(1)
          : props.parameterName);
    } else {
      this.parameterName = props.parameterName;
    }

    this.version = props.version;
    this.label = props.label;
    this.withDecryption = props?.withDecryption ?? false; // set default to false to avoid sending withDecryption on String and StringList
  }
  /**
   * The request path
   *
   * Starts with a forward slash.  Includes query parameters.
   */
  get path(): string {
    const url = new URL(
      "/systemsmanager/parameters/get",
      "http://not-used.dummy",
    );

    url.searchParams.append("name", this.parameterName);
    if (this.version != undefined)
      url.searchParams.append("version", this.version.toString());
    if (this.label) url.searchParams.append("label", this.label);
    if (this.withDecryption) url.searchParams.append("withDecryption", "true");

    return url.pathname + url.search;
  }
}

/**
 * Secret request properties
 *
 * See SDK [GetSecretValuesCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/interfaces/getsecretvaluecommandinput.html)
 */
export interface SecretHandlerProps {
  secretId: string;
  /**
   * [Secret](https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html#API_GetSecretValue_RequestSyntax) versionStage.
   * See the [UpdateSecretVersionStage](https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_UpdateSecretVersionStage.html) API docs for details.
   *
   * @default undefined (AWSCURRENT)
   */
  versionStage?: string;
  /**
   * [Secret](https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html#API_GetSecretValue_RequestSyntax) versionId.
   * UUID-type.  See also the [Version](https://docs.aws.amazon.com/secretsmanager/latest/userguide/getting-started.html#term_version) docs.
   *
   * @default undefined
   */
  versionId?: string;
}

/**
 * Handler for Secrets Manager `Secret` requests.
 *
 * [AWS Docs: Use AWS Secrets Manager secrets in AWS Lambda functions](https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html)
 */
export class SecretHandler extends Handler {
  readonly secretId: string;
  readonly versionStage?: string;
  readonly versionId?: string;

  /**
   * SecretResponse response type guard
   * @param response
   * @returns true if `response` is a SecretResponse
   */
  static isSecretResponse(
    response: ExtensionResponse,
  ): response is SecretResponse {
    return typeof response === "object" && "SecretString" in response;
  }

  constructor(props: SecretHandlerProps) {
    super();

    this.secretId = props.secretId;
    this.versionStage = props.versionStage;
    this.versionId = props.versionId;
  }
  /**
   * The request path
   *
   * Starts with a forward slash.  Includes query parameters.
   */
  get path(): string {
    const url = new URL("/secretsmanager/get", "http://not-used.dummy");

    url.searchParams.append("secretId", this.secretId);
    if (this.versionStage)
      url.searchParams.append("versionStage", this.versionStage);
    if (this.versionId !== undefined)
      url.searchParams.append("versionId", this.versionId.toString());

    return url.pathname + url.search;
  }
}
