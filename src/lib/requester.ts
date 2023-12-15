import http from "http";
import https from "https";

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
  addHeaders(headers: http.OutgoingHttpHeaders): void;

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
    statusMessage: string
  ): Response {
    return new HttpResponse(`${statusCode} ${statusMessage}: ${data}`, true);
  }

  private constructor(
    private data: string,
    public isError: boolean = false
  ) {}

  get text(): string | null {
    return this.isError ? null : this.data;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  get json(): any {
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
    // https://nodejs.org/api/http.html#http_class_http_serverresponse
    const res = await new Promise<http.IncomingMessage>((resolve) => {
      const components = new URL(url);
      const getter = components.protocol.startsWith("https") ? https : http;
      getter.get(url, { headers: this.headers }, resolve);
    });

    return new Promise<string>((resolve, reject) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("error", (err) => reject(err));
      res.on("end", () => resolve(data));
    })
      .then((data) => {
        return res.statusCode === 200
          ? HttpResponse.successResponse(data)
          : HttpResponse.failureResponse(
              data,
              res.statusCode ?? "<?>",
              res.statusMessage ?? "<Unknown Status>"
            );
      })
      .catch((err) =>
        HttpResponse.failureResponse(
          err,
          res.statusCode ?? "<?>",
          "<Rejection>"
        )
      );
  }
}
