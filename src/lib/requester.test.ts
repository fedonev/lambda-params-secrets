import http from "http";
import { EventEmitter } from "events";
import { HttpRequester, HttpResponse, type Requester } from "./requester";
import { Client } from "../Client";
import { ParameterHandler, SecretHandler } from "./handlers";

describe("Requester failures", () => {
  afterEach(() => jest.restoreAllMocks());

  test("HttpRequester still parses successful responses", async () => {
    const request = new EventEmitter();
    const incoming = Object.assign(new EventEmitter(), {
      statusCode: 200,
      statusMessage: "OK",
    }) as unknown as http.IncomingMessage;
    jest.spyOn(http, "get").mockImplementation(((_url, _options, callback) => {
      callback?.(incoming);
      setImmediate(() => {
        incoming.emit("data", '{"Parameter":');
        incoming.emit("data", '{"Value":"test"}}');
        incoming.emit("end");
      });
      return request as unknown as http.ClientRequest;
    }) as typeof http.get);
    const requester = new HttpRequester();

    const response = requester.get("http://localhost:2773/test");

    await expect(response).resolves.toMatchObject({
      text: '{"Parameter":{"Value":"test"}}',
      json: { Parameter: { Value: "test" } },
      error: null,
    });
  });

  test("HttpRequester returns an error response for connection errors", async () => {
    const request = new EventEmitter();
    jest
      .spyOn(http, "get")
      .mockReturnValue(request as unknown as http.ClientRequest);
    const requester = new HttpRequester();

    const response = requester.get("http://localhost:2773/test");
    request.emit("error", new Error("connection refused"));

    await expect(response).resolves.toMatchObject({
      text: null,
      json: null,
      error: "503 Server Error - connection refused",
    });
  });

  test("Client converts malformed success responses to an error", async () => {
    const requester: Requester = {
      addHeaders: jest.fn(),
      get: jest
        .fn()
        .mockResolvedValue(HttpResponse.successResponse("not-json")),
    };
    const client = new Client({ token: "test", requester });

    await expect(client.parameterResponse("test")).resolves.toEqual({
      error: "Invalid JSON response from extension.",
    });
    await expect(client.stringParameter("test")).resolves.toBeNull();
  });

  test("response guards reject null", () => {
    expect(ParameterHandler.isParameterResponse(null)).toBe(false);
    expect(SecretHandler.isSecretResponse(null)).toBe(false);
  });
});
