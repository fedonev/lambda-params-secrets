import http from "http";
import https from "https";

type HeadersInit = NonNullable<RequestInit["headers"]>;

/**
 * Requesters return this.
 */
export interface Response {
  /**
   * The text response.  `null` in case of a request error.
   */
  text: string | null;
  /**
   * `JSON.parses` the results.  `null` in cases of request or parsing errors.
   */
  json: any | null /* eslint-disable-line @typescript-eslint/no-explicit-any */;
  /**
   * Error if the request failed or  `null` if it succeeded.
   */
  error: string | null;
}

/**
 * Requesters make the requests and return a responses.
 */
export interface Requester {
  /**
   * Set the request headers
   * @param headers request headers
   */
  addHeaders(headers: http.OutgoingHttpHeaders | HeadersInit): void;

  /**
   * GET the Parameter or Secret
   * @param url the localhost url endpoint for the Parameter or Secret
   */
  get(url: string): Promise<Response>;
}

/**
 * A Response implementor
 */
export class HttpResponse implements Response {
  /**
   * Construct a Response for a successful request
   * @param data the response
   * @returns a success response where `error: null`
   */
  static successResponse(data: string): Response {
    return new HttpResponse(data);
  }
  /**
   * Construct a Response for a failed request
   * @param data the response
   * @param statusCode the HTTP status code
   * @param statusMessage the HTTP status message
   * @returns a failed response where `text: null` and `json: null`
   */
  static failureResponse(
    data: string,
    statusCode: number | string,
    statusMessage: string,
  ): Response {
    return new HttpResponse(`${statusCode} ${statusMessage} - ${data}`, true);
  }

  private constructor(
    private data: string,
    public isError: boolean = false,
  ) {}

  get text(): string | null {
    return this.isError ? null : this.data;
  }

  get json() {
    try {
      if (this.isError) return null;
      return JSON.parse(this.data);
    } catch {
      return null;
    }
  }

  get error(): string | null {
    return this.isError ? this.data : null;
  }
}

/**
 * A bare-bones HTTP GET client.
 *
 * Implementation: NodeJS core `http` library.
 */
export class HttpRequester implements Requester {
  public headers: http.OutgoingHttpHeaders;

  constructor(headers?: http.OutgoingHttpHeaders) {
    this.headers = {
      "User-Agent": "Other",
      ...headers,
    };
  }

  addHeaders(headers: http.OutgoingHttpHeaders): void {
    this.headers = headers;
  }

  async get(url: string): Promise<Response> {
    // https://developer.mozilla.org/en-US/docs/Web/API/fetch
    let res: http.IncomingMessage | undefined;

    try {
      const response = await new Promise<http.IncomingMessage>(
        (resolve, reject) => {
          const components = new URL(url);
          const getter = components.protocol.startsWith("https") ? https : http;
          const request = getter.get(url, { headers: this.headers }, resolve);
          request.on("error", reject);
        },
      );
      res = response;

      const data = await new Promise<string>((resolve, reject) => {
        let body = "";
        response.on("data", (chunk) => (body += chunk));
        response.on("error", reject);
        response.on("end", () => resolve(body));
      });

      return response.statusCode === 200
        ? HttpResponse.successResponse(data)
        : HttpResponse.failureResponse(
            data,
            response.statusCode ?? "<?>",
            response.statusMessage ?? "<Unknown Status>",
          );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown Server Error";
      return HttpResponse.failureResponse(
        message,
        res?.statusCode ?? "503",
        res ? "<Rejection>" : "Server Error",
      );
    }
  }
}

/**
 * A Native Fetch GET client.
 *
 * Implementation: NodeJS `fetch` library.
 * Requires NoeJS 18 or higher.
 */
export class FetchRequester implements Requester {
  public headers: HeadersInit;

  constructor(headers?: HeadersInit) {
    this.headers = {
      "User-Agent": "Other",
      ...headers,
    };
  }

  addHeaders(headers: HeadersInit): void {
    this.headers = headers;
  }

  /*global fetch*/
  async get(url: string): Promise<Response> {
    try {
      const res = await fetch(url, { headers: this.headers });

      if (res.ok) {
        const text = await res.text();
        const json = JSON.parse(text);
        return {
          text,
          json,
          error: null,
        };
      } else {
        return HttpResponse.failureResponse(
          "Response is not OK",
          res.status,
          res.statusText,
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown Server Error";
      return HttpResponse.failureResponse(message, "503", "Server Error");
    }
  }
}
