import { ParameterHandler, SecretHandler } from "./handlers";

describe("Parameter paths", () => {
  test("Parameter path rendered", () => {
    const handler = new ParameterHandler({ parameterName: "/cdk/temp" });
    expect(handler.path).toBe(
      "/systemsmanager/parameters/get?name=%2Fcdk%2Ftemp",
    );
  });

  test("No-slash Parameter path rendered", () => {
    const handler = new ParameterHandler({ parameterName: "no-forward-slash" });
    expect(handler.path).toBe(
      "/systemsmanager/parameters/get?name=no-forward-slash",
    );
  });

  test("Versioned parameter path rendered", () => {
    const handler = new ParameterHandler({
      parameterName: "/cdk/temp",
      version: 2,
    });
    expect(handler.path).toBe(
      "/systemsmanager/parameters/get?name=%2Fcdk%2Ftemp&version=2",
    );
  });

  test("Secret via Param Store path rendered", () => {
    const handler = new ParameterHandler({
      parameterName: "my-secret",
      fromSecretsManager: true,
    });
    expect(handler.path).toBe(
      "/systemsmanager/parameters/get?name=%2Faws%2Freference%2Fsecretsmanager%2Fmy-secret",
    );
  });

  test("Secret with forward slash prefix via Param Store path rendered", () => {
    const handler = new ParameterHandler({
      parameterName: "/my-secret",
      fromSecretsManager: true,
    });
    expect(handler.path).toBe(
      "/systemsmanager/parameters/get?name=%2Faws%2Freference%2Fsecretsmanager%2Fmy-secret",
    );
  });
});

describe("Secret paths", () => {
  test("Simple path renders correctly.", () => {
    const pr = new SecretHandler({ secretId: "james-bond" });
    expect(pr.path).toBe("/secretsmanager/get?secretId=james-bond");
  });

  test("Versioned path renders correctly.", () => {
    const pr = new SecretHandler({
      secretId: "james-bond",
      versionId: "a55ed8eb-0d14-4c5c-877c-0a94c63709ed",
    });
    expect(pr.path).toBe(
      "/secretsmanager/get?secretId=james-bond&versionId=a55ed8eb-0d14-4c5c-877c-0a94c63709ed",
    );
  });

  test("StageId path renders correctly.", () => {
    const pr = new SecretHandler({
      secretId: "james-bond",
      versionStage: "AWSPREVIOUS",
    });
    expect(pr.path).toBe(
      "/secretsmanager/get?secretId=james-bond&versionStage=AWSPREVIOUS",
    );
  });
});
