import { ParameterHandler, SecretHandler } from "./lib/handlers";
import { MockRequester } from "./mocks/MockRequester.mock";
import { Client } from "./Client";

/**
 * Test the Client using test responses in a mock requester..
 *
 * MockRequestor uses the responses from `src/responses/responses.mock.json`.
 */
describe("Client returns the expected mock requests.", () => {
  const client = new Client({
    token: "my-dummy-token",
    requester: new MockRequester(),
  });

  describe("Parameters", () => {
    test("String parameter value returns.", async () => {
      const res = await client.stringParameter(
        "/lambda-ext-test-param/dummy-string",
      );
      expect(res).toBe("my-string-param-value");
    });

    test("Return the Extension response object, not just the value.", async () => {
      const res = await client.parameterResponse(
        "/lambda-ext-test-param/dummy-string",
      );

      const isHappyResponse = ParameterHandler.isParameterResponse(res);

      expect(isHappyResponse).toBe(true);

      if (isHappyResponse) {
        expect(res?.Parameter?.Value).toBe("my-string-param-value");
        expect(res?.Parameter?.Type).toBe("String");
        expect(res?.Parameter?.DataType).toBe("text");
      }
    });

    test("stringListParameter returns an array of strings.", async () => {
      const res = await client.stringListParameter(
        "/lambda-ext-test-param/dummy-string-list",
      );
      expect(Array.isArray(res)).toBeTruthy();
      expect(res?.every((el) => typeof el === "string")).toBe(true);
    });

    test("secureString returns the decrypted value by default.", async () => {
      const res = await client.secureStringParameter(
        "/lambda-ext-test-param/dummy-secure-string",
      );
      expect(res).toMatch(/^my-secure-string-value.*/);
    });

    test("secureString can optionally return the encrypted value.", async () => {
      const res = await client.secureStringParameter(
        "/lambda-ext-test-param/dummy-secure-string",
        {
          version: 1, // N.B. including a version ensures key uniqueness, lets the MockRequester look up the right entry in the mock responses
          withDecryption: false,
        },
      );
      expect(res?.length).toBeGreaterThan(200);
    });

    test("An unknown or unauthorized parameter names return null.", async () => {
      expect(await client.stringParameter("does-not-exist")).toBe(null);
    });

    test("An unknown parameter name request returns an error response.", async () => {
      expect(await client.parameterResponse("does-not-exist")).toEqual({
        error:
          "400 Bad Request: an unexpected error occurred while executing request",
      });
    });
  });

  describe("Secrets", () => {
    test("stringSecret returns the decrypted Secret.", async () => {
      const res = await client.stringSecret("dummy-string-secret");
      expect(res).toBe("an-insecure-string-secret-value");
    });

    test("Return the Extension response object, not just the value", async () => {
      const res = await client.secretResponse("dummy-string-secret");

      const isHappyResponse = SecretHandler.isSecretResponse(res);

      expect(isHappyResponse).toBe(true);

      if (isHappyResponse) {
        expect(res?.SecretString).toBe("an-insecure-string-secret-value");
        expect(res?.SecretBinary).toBe(null);
        expect(res?.VersionStages).toEqual(
          expect.arrayContaining(["AWSCURRENT"]),
        );
      }
    });

    test("binarySecret returns a serialized Buffer.", async () => {
      const res = await client.binarySecret("dummy-binary-secret", {
        versionStage: "AWSPREVIOUS",
      });
      expect(res instanceof Buffer).toBe(true);
      expect(res?.toString("utf-8")).toBe(
        "a string secret value to be saved as binary",
      );
    });

    test("Secrets with Unknown stage labels return null", async () => {
      expect(
        await client.stringSecret("dummy-string-secret", {
          versionStage: "DOESNOTEXIST",
        }),
      ).toBe(null);
    });
  });
});
