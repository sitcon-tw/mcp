import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import registerSessionTools from "./tools.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const port = process.env.PORT || 3000;

// Init Express
const app = express();
app.use(express.json());

// Init MCP Server
const mcpServer = new McpServer({
    name: "SITCON MCP Server",
    version: "1.0.0",
});
registerSessionTools(mcpServer);

// MCP Endpoint
app.post('/mcp', async (req, res) => {
    try {
        const transport = new StreamableHTTPServerTransport({
            enableJsonResponse: true
        });
        res.on('close', () => transport.close());

        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error("Error handling MCP request:", error);
        res.status(500).send("Internal Server Error");
    }
})

// Health CHeck
app.get('/health', (req, res) => {
    res.send('OK');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});