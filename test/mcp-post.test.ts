import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "../src/server.js";

describe("POST with BODY end-to-end", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends the BODY argument as a JSON request body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: 1, name: "Victor" }), { status: 201 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const server = createServer({
      headers: {},
      tools: { CreateCustomer: { method: "POST", url: "https://api.example.com/customers" } },
    });
    const client = new Client({ name: "test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

    const result = await client.callTool({
      name: "CreateCustomer",
      arguments: { BODY: { name: "Victor", email: "victor@example.com" } },
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toEqual([{ type: "text", text: JSON.stringify({ id: 1, name: "Victor" }) }]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.com/customers");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify({ name: "Victor", email: "victor@example.com" }));
  });
});
