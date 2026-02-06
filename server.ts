import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import fastify from "fastify";
import { Sessions, streamableHttp } from "fastify-mcp";
import registerSessionTools from "./tools.js";

const app = fastify();

// Register the MCP plugin
app.register(streamableHttp, {
    stateful: true,
    mcpEndpoint: '/mcp',
    createServer: () => {
        const mcpServer = new McpServer({
            name: "sitcon-2026",
            version: "1.0.0",
        });

        // register shared agenda tools
        registerSessionTools(mcpServer);

        return mcpServer.server as any;
    },
    sessions: new Sessions<StreamableHTTPServerTransport>() as any,
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.listen({
    port: port,
    host: "0.0.0.0",
})
    .then(() => {
        console.log(`Server is running on http://localhost:${port}/mcp`);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
