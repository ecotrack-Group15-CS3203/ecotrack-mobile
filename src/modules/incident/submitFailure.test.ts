import { AxiosError } from "axios";

import { UploadError } from "../../services/uploadError";
import { classifySubmitFailure } from "./submitFailure";

function httpError(status: number, message?: string): AxiosError {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data: message ? { message } : {},
    statusText: "",
    headers: {},
    config: {} as never,
  });
}

describe("classifySubmitFailure", () => {
  it("treats a request that never got a response as blocking", () => {
    const failure = classifySubmitFailure(new AxiosError("Network Error", "ERR_NETWORK"));
    expect(failure.scope).toBe("blocking");
    expect(failure.message).toMatch(/connection/i);
  });

  it("treats a server error as blocking — the next draft would fail the same way", () => {
    expect(classifySubmitFailure(httpError(503)).scope).toBe("blocking");
  });

  it("treats a session that could not be refreshed (401) as blocking", () => {
    expect(classifySubmitFailure(httpError(401)).scope).toBe("blocking");
  });

  it.each([400, 403, 404, 413, 422])("treats a %i as isolated to that one draft", (status) => {
    expect(classifySubmitFailure(httpError(status)).scope).toBe("isolated");
  });

  it("carries the server's own message through for the user", () => {
    expect(classifySubmitFailure(httpError(400, "title must be longer")).message).toBe("title must be longer");
  });

  it("treats an unreachable storage host as blocking", () => {
    // This is exactly the phone-can-reach-the-API-but-not-MinIO case.
    const failure = classifySubmitFailure(new UploadError("Couldn't reach the photo storage server.", null));
    expect(failure.scope).toBe("blocking");
    expect(failure.message).toMatch(/storage/i);
  });

  it("treats a storage 5xx as blocking and a storage 4xx as isolated", () => {
    expect(classifySubmitFailure(new UploadError("down", 503)).scope).toBe("blocking");
    expect(classifySubmitFailure(new UploadError("rejected", 403)).scope).toBe("isolated");
  });

  it("does not throw on a non-error value", () => {
    expect(classifySubmitFailure("boom").scope).toBe("isolated");
  });
});
