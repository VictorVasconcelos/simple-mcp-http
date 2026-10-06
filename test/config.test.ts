import { describe, expect, it } from "vitest";
import { loadConfig, parseHeaders, parseTools } from "../src/config.js";

describe("parseHeaders", () => {
  it("returns an empty object when HEADERS is not set", () => {
    expect(parseHeaders(undefined)).toEqual({});
    expect(parseHeaders("")).toEqual({});
  });

  it("parses the JSON format", () => {
    expect(parseHeaders('{"Authorization":"Bearer XXXXXXXX","X-Tenant-ID":"123"}')).toEqual({
      Authorization: "Bearer XXXXXXXX",
      "X-Tenant-ID": "123",
    });
  });

  it("rejects malformed JSON", () => {
    expect(() => parseHeaders("{invalid")).toThrow(/Invalid HEADERS/);
  });

  it("rejects a non-object JSON value", () => {
    expect(() => parseHeaders("[1,2,3]")).toThrow(/Invalid HEADERS: expected a JSON object/);
  });

  it("rejects entries that are not plain K:V JSON", () => {
    expect(() => parseHeaders("Authorization:Bearer XXXXXXXX")).toThrow(/Invalid HEADERS/);
  });
});

describe("parseTools", () => {
  it("throws when TOOLS is missing or empty", () => {
    expect(() => parseTools(undefined)).toThrow(/TOOLS is required/);
    expect(() => parseTools("")).toThrow(/TOOLS is required/);
    expect(() => parseTools("   ")).toThrow(/TOOLS is required/);
  });

  it("parses the JSON format", () => {
    const raw = JSON.stringify({
      FindInvoices: { method: "GET", url: "https://www.example.com/invoices" },
      FindCustomer: { method: "GET", url: "https://www.example.com/customers/{{ID}}" },
    });
    expect(parseTools(raw)).toEqual({
      FindInvoices: { method: "GET", url: "https://www.example.com/invoices" },
      FindCustomer: { method: "GET", url: "https://www.example.com/customers/{{ID}}" },
    });
  });

  it("normalizes HTTP methods to upper case", () => {
    const raw = JSON.stringify({
      FindInvoices: { method: "get", url: "https://www.example.com/invoices" },
    });
    expect(parseTools(raw)).toEqual({
      FindInvoices: { method: "GET", url: "https://www.example.com/invoices" },
    });
  });

  it("rejects an invalid HTTP method", () => {
    const raw = JSON.stringify({
      FindInvoices: { method: "FOO", url: "https://www.example.com/invoices" },
    });
    expect(() => parseTools(raw)).toThrow(/Invalid tool definition/);
  });

  it("rejects a non-JSON definition", () => {
    expect(() => parseTools("NotAValidDefinition")).toThrow(/Invalid TOOLS: malformed JSON/);
  });

  it("rejects malformed TOOLS JSON", () => {
    expect(() => parseTools("{invalid")).toThrow(/Invalid TOOLS/);
  });

  it("rejects a JSON tool definition missing method or url", () => {
    expect(() => parseTools(JSON.stringify({ FindCustomer: { url: "https://x.com" } }))).toThrow(
      /Invalid tool definition: FindCustomer/,
    );
  });
});

describe("loadConfig", () => {
  it("builds config from an environment-like object", () => {
    const config = loadConfig({
      HEADERS: '{"Authorization":"Bearer XXXXXXXX"}',
      TOOLS: '{"FindInvoices":{"method":"GET","url":"https://www.example.com/invoices"}}',
    } as NodeJS.ProcessEnv);

    expect(config.headers).toEqual({ Authorization: "Bearer XXXXXXXX" });
    expect(config.tools).toEqual({
      FindInvoices: { method: "GET", url: "https://www.example.com/invoices" },
    });
  });
});
