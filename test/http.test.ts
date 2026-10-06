import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeRequest } from "../src/http.js";

describe("executeRequest", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("performs a GET request and returns a JSON text body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 123, name: "Victor" }), { status: 200 }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await executeRequest(
      { method: "GET", url: "https://api.example.com/customers/{{ID}}" },
      {},
      { ID: "123" },
      undefined,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/customers/123",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual({
      status: 200,
      ok: true,
      body: JSON.stringify({ id: 123, name: "Victor" }),
    });
  });

  it("returns a plain text body as-is", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("pong", { status: 200 })) as unknown as typeof fetch;

    const result = await executeRequest({ method: "GET", url: "https://api.example.com/ping" }, {}, {}, undefined);

    expect(result).toEqual({ status: 200, ok: true, body: "pong" });
  });

  it("merges configured headers into the request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await executeRequest(
      { method: "GET", url: "https://api.example.com/invoices" },
      { Authorization: "Bearer XXXXXXXX" },
      {},
      undefined,
    );

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({ Authorization: "Bearer XXXXXXXX" });
  });

  it("sends a JSON body with Content-Type for write methods", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 201 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const body = { name: "Victor", email: "victor@example.com" };
    const result = await executeRequest(
      { method: "POST", url: "https://api.example.com/customers" },
      {},
      {},
      body,
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.com/customers");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify(body));
    expect(result.status).toBe(201);
  });

  it("reports non-2xx responses without masking the body", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: "Customer not found" }), { status: 404 })) as unknown as typeof fetch;

    const result = await executeRequest(
      { method: "GET", url: "https://api.example.com/customers/{{ID}}" },
      {},
      { ID: "999" },
      undefined,
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.body).toBe(JSON.stringify({ message: "Customer not found" }));
  });

  it("reports 5xx responses", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("Internal Server Error", { status: 500 })) as unknown as typeof fetch;

    const result = await executeRequest({ method: "GET", url: "https://api.example.com/invoices" }, {}, {}, undefined);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.body).toBe("Internal Server Error");
  });
});
