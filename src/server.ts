import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "./config.js";
import { executeRequest } from "./http.js";
import { buildToolSchemas, type ToolSchema } from "./tools.js";

function registerTool(server: McpServer, schema: ToolSchema, headers: Record<string, string>): void {
  server.registerTool(
    schema.name,
    {
      description: `${schema.definition.method} ${schema.definition.url}`,
      inputSchema: schema.zodShape,
    },
    async (args) => {
      const input = args as Record<string, unknown>;
      const params: Record<string, string> = {};
      for (const paramName of schema.parameterNames) {
        params[paramName] = String(input[paramName]);
      }
      const body = schema.supportsBody ? input.BODY : undefined;

      try {
        const result = await executeRequest(schema.definition, headers, params, body);
        if (!result.ok) {
          return {
            isError: true,
            content: [{ type: "text", text: `HTTP ${result.status}: ${result.body}` }],
          };
        }
        return { content: [{ type: "text", text: result.body }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { isError: true, content: [{ type: "text", text: message }] };
      }
    },
  );
}

export function createServer(config: AppConfig): McpServer {
  const server = new McpServer({ name: "simple-mcp-http", version: "1.0.0" });

  for (const schema of buildToolSchemas(config.tools)) {
    registerTool(server, schema, config.headers);
  }

  return server;
}
