import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "../src/server.js";

async function connect(config: Parameters<typeof createServer>[0]) {
  const server = createServer(config);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

  return { server, client };
}

describe("MCP tool registration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("registers exactly the tools declared in TOOLS", async () => {
    const { client } = await connect({
      headers: {},
      tools: {
        FindInvoices: { method: "GET", url: "https://www.example.com/invoices" },
        FindCustomer: { method: "GET", url: "https://www.example.com/customers/{{ID}}" },
      },
    });

    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(["FindCustomer", "FindInvoices"]);
  });

  it("exposes an input schema with the detected parameters", async () => {
    const { client } = await connect({
      headers: {},
      tools: {
        FindCustomer: { method: "GET", url: "https://www.example.com/customers/{{ID}}" },
      },
    });

    const { tools } = await client.listTools();
    const findCustomer = tools.find((tool) => tool.name === "FindCustomer");

    expect(findCustomer?.inputSchema.properties).toHaveProperty("ID");
    expect(findCustomer?.inputSchema.required).toContain("ID");
  });

  it("does not register a tool that is absent from the configuration", async () => {
    const { client } = await connect({
      headers: {},
      tools: {
        FindInvoices: { method: "GET", url: "https://www.example.com/invoices" },
      },
    });

    const { tools } = await client.listTools();
    expect(tools.some((tool) => tool.name === "FindCustomer")).toBe(false);
  });

  it("executes the HTTP request and returns the raw response body", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: "123", name: "Victor" }), { status: 200 })) as unknown as typeof fetch;

    const { client } = await connect({
      headers: { Authorization: "Bearer XXXXXXXX" },
      tools: {
        FindCustomer: { method: "GET", url: "https://api.example.com/customers/{{ID}}" },
      },
    });

    const result = await client.callTool({ name: "FindCustomer", arguments: { ID: "123" } });

    expect(result.isError).toBeFalsy();
    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify({ id: "123", name: "Victor" }) },
    ]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.example.com/customers/123",
      expect.objectContaining({ headers: { Authorization: "Bearer XXXXXXXX" } }),
    );
  });

  it("surfaces HTTP errors as a tool error without masking the body", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: "Customer not found" }), { status: 404 })) as unknown as typeof fetch;

    const { client } = await connect({
      headers: {},
      tools: {
        FindCustomer: { method: "GET", url: "https://api.example.com/customers/{{ID}}" },
      },
    });

    const result = await client.callTool({ name: "FindCustomer", arguments: { ID: "999" } });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: `HTTP 404: ${JSON.stringify({ message: "Customer not found" })}` },
    ]);
  });
});
