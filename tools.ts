import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Load agenda
const agendaPath = path.resolve("./agenda.json");
let agendaData: {
    sessions: Session[];
    speakers: Speaker[];
    session_types: SessionType[];
    rooms: Room[];
    tags: Tag[];
} = { sessions: [], speakers: [], session_types: [], rooms: [], tags: [] };

try {
    const fileContent = fs.readFileSync(agendaPath, "utf-8");
    agendaData = JSON.parse(fileContent);
} catch (error) {
    console.error("Error loading agenda.json:", error);
}

// Type definitions
export interface Speaker {
    id: string;
    avatar: string;
    zh: {
        name: string;
        bio: string;
    };
    en: {
        name: string;
        bio: string;
    };
}

export interface SessionType {
    id: string;
    zh: {
        name: string;
        description: string;
    };
    en: {
        name: string;
        description: string;
    };
}

export interface Room {
    id: string;
    zh: {
        name: string;
        description: string;
    };
    en: {
        name: string;
        description: string;
    };
}

export interface Tag {
    id: string;
    zh: {
        name: string;
        description: string;
    };
    en: {
        name: string;
        description: string;
    };
}

export interface Session {
    id: string;
    type: string;
    room: string;
    broadcast: string[] | null;
    start: string;
    end: string;
    qa: string | null;
    slide: string | null;
    co_write: string | null;
    record: string | null;
    live: string | null;
    language: string | null;
    uri: string | null;
    zh: {
        title: string;
        description: string;
    };
    en: {
        title: string;
        description: string;
    };
    speakers: string[];
    tags: string[];
}


// Helper function for searching agenda
export const searchAgenda = (query: string) => {
    const lowerQuery = query.toLowerCase();

    if (!agendaData.sessions || !Array.isArray(agendaData.sessions)) {
        return [];
    }

    return agendaData.sessions.filter((session: Session) => {
        const zhTitle = session.zh?.title?.toLowerCase() || "";
        const zhDesc = session.zh?.description?.toLowerCase() || "";
        const enTitle = session.en?.title?.toLowerCase() || "";
        const enDesc = session.en?.description?.toLowerCase() || "";
        const tags = session.tags ? session.tags.join(" ").toLowerCase() : "";

        return zhTitle.includes(lowerQuery) ||
            zhDesc.includes(lowerQuery) ||
            enTitle.includes(lowerQuery) ||
            enDesc.includes(lowerQuery) ||
            tags.includes(lowerQuery);
    }).map((session: Session) => ({
        id: session.id,
        title: session.zh?.title || session.en?.title,
        description: session.zh?.description || session.en?.description,
        start: session.start,
        end: session.end,
        room: session.room,
        speakers: session.speakers,
        tags: session.tags
    }));
};

export function registerAgendaTools(server: McpServer) {
    server.tool(
        "search_agenda",
        "Search for sessions in the SITCON 2026 agenda by title, description, or tags.",
        {
            query: z.string().describe("The search keyword to filter sessions."),
        },
        async ({ query }) => {
            const results = searchAgenda(query);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(results, null, 2),
                    },
                ],
            };
        }
    );
}

export default registerAgendaTools;
