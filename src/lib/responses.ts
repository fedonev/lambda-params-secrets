import type { Parameter } from "@aws-sdk/client-ssm";
import type { GetSecretValueCommandOutput } from "@aws-sdk/client-secrets-manager";

/**
 * Extension responses
 */
export type ExtensionResponse =
  | ParameterResponse
  | SecretResponse
  | ErrorResponse;

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

interface ExtensionParameter
  extends Omit<
    Parameter,
    "DataType" | "LastModifiedDate" | "Selector" | "SourceResult" | "Value"
  > {
  DataType: string | null;
  LastModifiedDate: string;
  Selector: string | null;
  /**
   * SourceResult is the JSON response from Secrets Manager.  Null for Paramter Store requests.
   */
  SourceResult: string | null;
  /**
   * Value returns null if a BinarySecret is returned from the Parameter endpoint.
   */
  Value: string | null;
}

/**
 * The Extension's response for Secrets.
 *
 * See: [GetSecretValueCommandOutput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/interfaces/getsecretvaluecommandoutput.html).
 */
export interface SecretResponse
  extends Omit<
    GetSecretValueCommandOutput,
    "CreatedDate" | "SecretBinary" | "SecretString" | "$metadata"
  > {
  CreatedDate: string;
  /**
   * The Binary Secret value.
   * The Extension returns `SecretBinary` as a Base64 encoded string.
   */
  SecretBinary: string | null;
  /**
   * The String Secrert value.
   */
  SecretString: string | null;
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
