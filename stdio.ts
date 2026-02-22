import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerSessionTools } from "./tools.js";

// Create server instance
const server = new McpServer({
    name: "sitcon-2026",
    version: "1.0.0",
});

// Register tools
registerSessionTools(server);

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("SITCON 2026 MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
