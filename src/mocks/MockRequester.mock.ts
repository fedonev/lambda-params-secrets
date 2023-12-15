import { OutgoingHttpHeaders } from "http";
import { type Requester, type Response, HttpResponse } from "../lib/requester";
import {
  testResponsesSnapshot as snapshot,
  type TestResponse,
} from "../../data";

/**
 * Make mock requests to the Extension.
 *
 * Uses the mock responses from `./src/responses/responses.mock.jsion`
 */
export class MockRequester implements Requester {
  headers: OutgoingHttpHeaders;

  addHeaders(headers: OutgoingHttpHeaders): void {
    this.headers = headers;
  }

  get(url: string): Promise<Response> {
    return new Promise((resolve, reject) => {
      const { pathname, searchParams } = new URL(url);
      searchParams.sort();
      const resource = pathname + "?" + searchParams.toString();

      const testResponse = (snapshot as Record<string, TestResponse>)?.[
        resource
      ]?.response;

      if (!testResponse) {
        reject(
          HttpResponse.failureResponse(
            `Cannot find ${resource} in the test responses.`,
            0,
            "<unknown>",
          ),
        );
      }

      // simulate an error if the test result is an error
      "error" in testResponse
        ? resolve(
            HttpResponse.failureResponse(
              testResponse.error.replace("400 Bad Request: ", ""), // test responses already have the statusCode and status Message
              400,
              "Bad Request",
            ),
          )
        : resolve(HttpResponse.successResponse(JSON.stringify(testResponse)));
    });
  }
}
