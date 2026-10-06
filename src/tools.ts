import { z } from "zod";
import type { ToolDefinition } from "./config.js";
import { extractParameterNames } from "./params.js";

const BODY_METHODS: ReadonlySet<string> = new Set(["POST", "PUT", "PATCH"]);

export interface ToolSchema {
  name: string;
  definition: ToolDefinition;
  parameterNames: string[];
  supportsBody: boolean;
  zodShape: Record<string, z.ZodTypeAny>;
}

export function buildToolSchema(name: string, definition: ToolDefinition): ToolSchema {
  const parameterNames = extractParameterNames(definition.url);
  const supportsBody = BODY_METHODS.has(definition.method);

  const zodShape: Record<string, z.ZodTypeAny> = {};
  for (const paramName of parameterNames) {
    zodShape[paramName] = z.string().describe(`Value for ${paramName}`);
  }
  if (supportsBody) {
    zodShape.BODY = z.record(z.string(), z.any()).optional().describe("JSON request body");
  }

  return { name, definition, parameterNames, supportsBody, zodShape };
}

export function buildToolSchemas(tools: Record<string, ToolDefinition>): ToolSchema[] {
  return Object.entries(tools).map(([name, definition]) => buildToolSchema(name, definition));
}
