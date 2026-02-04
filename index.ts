import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAgendaTools } from "./tools.js";

// Create server instance
const server = new McpServer({
    name: "sitcon-2026-agenda",
    version: "1.0.0",
});

// Register tools
registerAgendaTools(server);

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("SITCON 2026 Agenda MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
