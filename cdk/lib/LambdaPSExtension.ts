import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { layerArns, type ExtensionArn } from "../../data";

/**
 * Components of the Layer ARN.
 */
export interface LayerArnComponents {
  /**
   * The region of the AWS-managed extension layer ARN.
   *
   * @default
   * - The `scope` Construct's region.
   */
  layerRegion?: string;
  /**
   * The Lambda architecture the Layer will run on.
   *
   * @default
   * lambda.Architecture.X86_64
   */
  architecture?: lambda.Architecture;
}

export interface LambdaExtensionProps {
  /**
   * Requires a complete layer ARN or a region be known at synth-time.
   */
  layerArn: string | LayerArnComponents;
}

/**
 * The Parameters-and-Secrets-Lambda-Extension Layer for the stack's region and a lambda architecture.
 * Throws an error if the scope is in an unhandled region.
 * The AWS docs have a table of [extension ARNs by region](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html#ps-integration-lambda-extensions-add)
 */
export class LambdaPSExtension
  extends Construct
  implements lambda.ILayerVersion
{
  readonly #layer: lambda.ILayerVersion;

  constructor(scope: Construct, id: string, props?: LambdaExtensionProps) {
    super(scope, id);

    const layerArn =
      typeof props?.layerArn === "string"
        ? props.layerArn
        : this.tryLookupArn(props?.layerArn);

    if (!layerArn) {
      cdk.Annotations.of(scope).addError(
        "Cannot determine the Extension Layer ARN.",
      );
    } else {
      this.#layer = lambda.LayerVersion.fromLayerVersionArn(
        scope,
        "ManagedLayer",
        layerArn,
      );
    }
  }

  /**
   * Try to lookup the Layer ARN from the map saved from the AWS documentation.
   * @param components default {}
   * @returns an ARN or null if unsuccessful
   */
  tryLookupArn(components: LayerArnComponents = {}): string | null {
    const region = components.layerRegion ?? cdk.Stack.of(this).region;
    if (!region || cdk.Token.isUnresolved(region)) return null;

    const regionArns = (layerArns as Record<string, Array<ExtensionArn>>)?.[
      region
    ];
    if (!regionArns?.length) return null;

    return components.architecture
      ? regionArns.find(
          (el) => el.architecture === components.architecture?.name,
        )?.layerArn ?? null
      : regionArns.find(
          (el) => el.architecture === cdk.aws_lambda.Architecture.X86_64.name,
        )?.layerArn ?? null;
  }

  /**
   * Implement ILayerVersion
   */

  get layerVersionArn(): string {
    return this.#layer.layerVersionArn;
  }

  get env(): cdk.ResourceEnvironment {
    return this.#layer.env;
  }

  get stack(): cdk.Stack {
    return cdk.Stack.of(this);
  }

  addPermission(id: string, permission: lambda.LayerVersionPermission): void {
    this.#layer.addPermission(id, permission);
  }

  applyRemovalPolicy(policy: cdk.RemovalPolicy): void {
    this.#layer.applyRemovalPolicy(policy);
  }
}
