import type { GetSecretValueCommandOutput } from "@aws-sdk/client-secrets-manager";
import type { Parameter } from "@aws-sdk/client-ssm";
import type { ParameterResponse, SecretResponse } from "./responses";

type IsExact<Actual, Expected> = [Actual] extends [Expected]
  ? [Expected] extends [Actual]
    ? true
    : false
  : false;
type Defined<T> = Exclude<T, undefined>;

type ExpectedExtensionParameter = Omit<
  Parameter,
  "DataType" | "LastModifiedDate" | "Selector" | "SourceResult" | "Value"
> & {
  DataType: Defined<Parameter["DataType"]> | null;
  LastModifiedDate: string;
  Selector: Defined<Parameter["Selector"]> | null;
  SourceResult: Defined<Parameter["SourceResult"]> | null;
  Value: Defined<Parameter["Value"]> | null;
};

type ExpectedSecretResponse = Omit<
  GetSecretValueCommandOutput,
  "$metadata" | "CreatedDate" | "SecretBinary" | "SecretString"
> & {
  CreatedDate: string;
  SecretBinary: string | null;
  SecretString: string | null;
  ResultMetadata: Record<never, never>;
};

type ContractChecks = {
  parameterResponse: IsExact<
    ParameterResponse["Parameter"],
    ExpectedExtensionParameter
  >;
  secretResponse: IsExact<SecretResponse, ExpectedSecretResponse>;
  parameterDate: IsExact<Parameter["LastModifiedDate"], Date | undefined>;
  secretDate: IsExact<
    GetSecretValueCommandOutput["CreatedDate"],
    Date | undefined
  >;
  secretBinary: IsExact<
    GetSecretValueCommandOutput["SecretBinary"],
    Uint8Array | undefined
  >;
};

const contractChecks = {
  parameterResponse: true,
  secretResponse: true,
  parameterDate: true,
  secretDate: true,
  secretBinary: true,
} satisfies ContractChecks;

test("Extension wire types match the transformed AWS SDK response types", () => {
  expect(contractChecks).toEqual({
    parameterResponse: true,
    secretResponse: true,
    parameterDate: true,
    secretDate: true,
    secretBinary: true,
  });
});
