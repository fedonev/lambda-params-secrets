import fs from "fs/promises";

/**
 * Run before local npm publish
 * Move the non-ts files needed for the npm package into the package directory
 */
(async (): Promise<void> => {
  const pkgPath = "./dist/";

  const copies = ["README.md", "LICENSE"].map((f) =>
    fs.copyFile(f, pkgPath + f)
  );

  await Promise.all(copies);

  const pkg = await fs
    .readFile("package.json", "utf-8")
    .then((s) => JSON.parse(s));

  delete pkg["devDependencies"];
  delete pkg["scripts"];

  const json = JSON.stringify(pkg);

  await fs.writeFile(pkgPath + "package.json", json);
})();
