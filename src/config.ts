export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

const HTTP_METHOD_SET: ReadonlySet<string> = new Set(HTTP_METHODS);

function isHttpMethod(value: string): value is HttpMethod {
  return HTTP_METHOD_SET.has(value);
}

export interface ToolDefinition {
  method: HttpMethod;
  url: string;
}

export interface AppConfig {
  headers: Record<string, string>;
  tools: Record<string, ToolDefinition>;
}

export function parseHeaders(raw: string | undefined): Record<string, string> {
  if (raw === undefined || raw.trim() === "") {
    return {};
  }

  const trimmed = raw.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Invalid HEADERS: malformed JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid HEADERS: expected a JSON object");
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== "string") {
      throw new Error(`Invalid HEADERS: value for "${key}" must be a string`);
    }
    headers[key] = value;
  }
  return headers;
}

export function parseTools(raw: string | undefined): Record<string, ToolDefinition> {
  if (raw === undefined || raw.trim() === "") {
    throw new Error("TOOLS is required and cannot be empty");
  }

  const tools = parseToolsJson(raw.trim());

  if (Object.keys(tools).length === 0) {
    throw new Error("TOOLS is required and cannot be empty");
  }

  return tools;
}

function parseToolsJson(raw: string): Record<string, ToolDefinition> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid TOOLS: malformed JSON");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid TOOLS: expected a JSON object");
  }

  const tools: Record<string, ToolDefinition> = {};
  for (const [name, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== "object" || value === null) {
      throw new Error(`Invalid tool definition: ${name}`);
    }

    const { method, url } = value as Record<string, unknown>;
    if (typeof method !== "string" || typeof url !== "string") {
      throw new Error(`Invalid tool definition: ${name}`);
    }

    const normalizedMethod = method.toUpperCase();
    if (!isHttpMethod(normalizedMethod)) {
      throw new Error(`Invalid tool definition: ${name}`);
    }

    tools[name] = { method: normalizedMethod, url };
  }

  return tools;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    headers: parseHeaders(env.HEADERS),
    tools: parseTools(env.TOOLS),
  };
}
