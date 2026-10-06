import { describe, expect, it } from "vitest";
import { applyParameters, extractParameterNames } from "../src/params.js";

describe("extractParameterNames", () => {
  it("detects a single path parameter", () => {
    expect(extractParameterNames("https://api.example.com/customers/{{ID}}")).toEqual(["ID"]);
  });

  it("detects multiple path parameters", () => {
    expect(extractParameterNames("https://api.example.com/customers/{{ID}}/{{SUB_ID}}")).toEqual([
      "ID",
      "SUB_ID",
    ]);
  });

  it("detects query string parameters", () => {
    expect(
      extractParameterNames("https://api.example.com/invoices?status={{STATUS}}&page={{PAGE}}"),
    ).toEqual(["STATUS", "PAGE"]);
  });

  it("returns an empty array when there are no parameters", () => {
    expect(extractParameterNames("https://api.example.com/invoices")).toEqual([]);
  });

  it("deduplicates repeated parameters", () => {
    expect(extractParameterNames("https://api.example.com/{{ID}}/related/{{ID}}")).toEqual(["ID"]);
  });
});

describe("applyParameters", () => {
  it("substitutes a path parameter", () => {
    expect(
      applyParameters("https://api.example.com/customers/{{ID}}", { ID: "123" }),
    ).toBe("https://api.example.com/customers/123");
  });

  it("substitutes query string parameters", () => {
    expect(
      applyParameters("https://api.example.com/invoices?status={{STATUS}}&page={{PAGE}}", {
        STATUS: "PAID",
        PAGE: "2",
      }),
    ).toBe("https://api.example.com/invoices?status=PAID&page=2");
  });

  it("URL encodes parameter values", () => {
    expect(
      applyParameters("https://api.example.com/search?q={{QUERY}}", { QUERY: "a b/c" }),
    ).toBe("https://api.example.com/search?q=a%20b%2Fc");
  });

  it("throws when a required parameter is missing", () => {
    expect(() => applyParameters("https://api.example.com/customers/{{ID}}", {})).toThrow(
      /Missing required parameter: ID/,
    );
  });
});
