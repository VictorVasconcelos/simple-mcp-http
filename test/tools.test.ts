import { describe, expect, it } from "vitest";
import { buildToolSchema, buildToolSchemas } from "../src/tools.js";

describe("buildToolSchema", () => {
  it("detects path parameters and builds a matching zod shape", () => {
    const schema = buildToolSchema("FindCustomer", {
      method: "GET",
      url: "https://www.example.com/customers/{{ID}}",
    });

    expect(schema.parameterNames).toEqual(["ID"]);
    expect(Object.keys(schema.zodShape)).toEqual(["ID"]);
    expect(schema.supportsBody).toBe(false);
  });

  it("detects query string parameters", () => {
    const schema = buildToolSchema("FindInvoices", {
      method: "GET",
      url: "https://api.example.com/invoices?status={{STATUS}}&page={{PAGE}}",
    });

    expect(schema.parameterNames).toEqual(["STATUS", "PAGE"]);
    expect(Object.keys(schema.zodShape)).toEqual(["STATUS", "PAGE"]);
  });

  it("adds a BODY parameter for POST/PUT/PATCH", () => {
    for (const method of ["POST", "PUT", "PATCH"] as const) {
      const schema = buildToolSchema("CreateCustomer", {
        method,
        url: "https://api.example.com/customers",
      });
      expect(schema.supportsBody).toBe(true);
      expect(Object.keys(schema.zodShape)).toContain("BODY");
    }
  });

  it("does not add a BODY parameter for GET/DELETE", () => {
    for (const method of ["GET", "DELETE"] as const) {
      const schema = buildToolSchema("DeleteCustomer", {
        method,
        url: "https://api.example.com/customers/{{ID}}",
      });
      expect(schema.supportsBody).toBe(false);
      expect(Object.keys(schema.zodShape)).not.toContain("BODY");
    }
  });
});

describe("buildToolSchemas", () => {
  it("builds one schema per configured tool", () => {
    const schemas = buildToolSchemas({
      FindInvoices: { method: "GET", url: "https://www.example.com/invoices" },
      FindCustomer: { method: "GET", url: "https://www.example.com/customers/{{ID}}" },
    });

    expect(schemas.map((schema) => schema.name)).toEqual(["FindInvoices", "FindCustomer"]);
  });
});
