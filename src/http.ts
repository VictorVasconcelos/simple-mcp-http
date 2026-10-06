import type { ToolDefinition } from "./config.js";
import { applyParameters } from "./params.js";

export interface HttpResult {
  status: number;
  ok: boolean;
  body: string;
}

export async function executeRequest(
  definition: ToolDefinition,
  headers: Record<string, string>,
  params: Record<string, string>,
  body: unknown,
): Promise<HttpResult> {
  const url = applyParameters(definition.url, params);
  const requestHeaders: Record<string, string> = { ...headers };

  let requestBody: string | undefined;
  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method: definition.method,
    headers: requestHeaders,
    body: requestBody,
  });

  const text = await response.text();

  return {
    status: response.status,
    ok: response.ok,
    body: text,
  };
}
