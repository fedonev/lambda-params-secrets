/**
 npx ts-node scripts/fetchExtensionArns.ts
 */
import path from "path";
import { strict as assert } from "assert/strict";
import fs from "fs/promises";
import { HttpRequester } from "../src/lib/requester";
import { ExtensionArn } from "../data/types";

(async () => {
  const arnSets: Record<string, Set<ExtensionArn>> = {};

  const requester = new HttpRequester();

  const res = await requester.get(
    "https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html"
  );

  if (!res.text) throw new Error("No respoonse text!");

  const arnPattern =
    /arn:[a-z-]*:lambda:(?<region>[a-z0-9-]*):(?<account>[0-9]{12}):layer:AWS-Parameters-and-Secrets-Lambda-Extension-?(?<arch>\w*)?:(?<version>[0-9]*)/gs;

  for (const row of res.text.matchAll(/<tr>.*<\/tr>/gs)) {
    for (const arn of row[0].matchAll(arnPattern)) {
      const { region, account, version } = arn.groups ?? {};
      if (!region || !account || !version)
        throw new Error(`Cannot parse the ARN: ${arn}`);

      arnSets[region] ??= new Set<ExtensionArn>();

      const arch = arn.groups?.arch;

      const architecture = arch?.length
        ? arch[0].toLocaleLowerCase() + arch.substring(1)
        : "x86_64";

      arnSets[region].add({
        layerArn: arn[0],
        account,
        region,
        architecture,
        version: parseInt(version, 10),
      });
    }
  }

  const arns: Record<string, Array<ExtensionArn>> = {};

  Object.entries(arnSets).forEach(([k, v]) => {
    arns[k] = Array.from(v).sort(
      (a, b) => b.architecture.localeCompare(a.architecture) // sort in descending order
    );
  });

  assert(
    Object.keys(arns).length >= 27,
    "The number of regions with extension ARNs has not declined."
  );
  assert(
    Object.values(arns).flat(1).length >= 37,
    "The number of Extension ARNs has not declined."
  );

  await fs.writeFile(
    path.join(__dirname, "../data/aws-layer-arns.json"),
    JSON.stringify(arns, null, "  ") + "\n"
  );
})();
