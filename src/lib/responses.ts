/**
 * Extension responses
 */
export type ExtensionResponse =
  ParameterResponse | SecretResponse | ErrorResponse;

/**
 * The Extension's response for Parameters.
 *
 * See: [GetParameterCommandOutput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/interfaces/getparametercommandoutput.html).
 */
export interface ParameterResponse {
  /**
   * The Parameter response.
   */
  Parameter: ExtensionParameter;
  /**
   * The Extension appears to always return an empty object `{}`.
   */
  ResultMetadata: Record<never, never>;
}

interface ExtensionParameter {
  ARN?: string;
  DataType: string | null;
  LastModifiedDate: string;
  Name?: string;
  Selector: string | null;
  /**
   * SourceResult is the JSON response from Secrets Manager.  Null for Paramter Store requests.
   */
  SourceResult: string | null;
  Type?: "String" | "StringList" | "SecureString";
  /**
   * Value returns null if a BinarySecret is returned from the Parameter endpoint.
   */
  Value: string | null;
  Version?: number;
}

/**
 * The Extension's response for Secrets.
 *
 * See: [GetSecretValueCommandOutput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/interfaces/getsecretvaluecommandoutput.html).
 */
export interface SecretResponse {
  ARN?: string;
  CreatedDate: string;
  Name?: string;
  /**
   * The Binary Secret value.
   * The Extension returns `SecretBinary` as a Base64 encoded string.
   */
  SecretBinary: string | null;
  /**
   * The String Secrert value.
   */
  SecretString: string | null;
  VersionId?: string;
  VersionStages?: string[];
  /**
   * The Extension appears to always return an empty object `{}`-
   */
  ResultMetadata: Record<never, never>;
}

/**
 * An error response from the Extension.
 */
export interface ErrorResponse {
  error: string;
}
