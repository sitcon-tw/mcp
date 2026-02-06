import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Fetch sessions from Github
const sessionUrl = "https://sitcon.org/2026/sessions.json";
const fetchSessions = async () => {
    const response = await fetch(sessionUrl);
    const data = await response.json();
    return data;
};

let sessionData: {
    sessions: Session[];
    speakers: Speaker[];
    session_types: SessionType[];
    rooms: Room[];
    tags: Tag[];
} = { sessions: [], speakers: [], session_types: [], rooms: [], tags: [] };

try {
    sessionData = await fetchSessions();
} catch (error) {
    console.error("Error fetching sessions:", error);
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


// Helper function for searching sessions
export const searchSessions = (query: string) => {
    const lowerQuery = query.toLowerCase();

    if (!sessionData.sessions || !Array.isArray(sessionData.sessions)) {
        return [];
    }

    return sessionData.sessions.filter((session: Session) => {
        const zhTitle = session.zh?.title?.toLowerCase() || "";
        const zhDesc = session.zh?.description?.toLowerCase() || "";
        const enTitle = session.en?.title?.toLowerCase() || "";
        const enDesc = session.en?.description?.toLowerCase() || "";
        const tags = session.tags ? session.tags.join(" ").toLowerCase() : "";

        const speakerMatches = session.speakers.some(speakerId => {
            const speaker = sessionData.speakers.find(s => s.id === speakerId);
            if (!speaker) return false;
            const zhName = speaker.zh?.name?.toLowerCase() || "";
            const enName = speaker.en?.name?.toLowerCase() || "";
            const zhBio = speaker.zh?.bio?.toLowerCase() || "";
            const enBio = speaker.en?.bio?.toLowerCase() || "";
            return zhName.includes(lowerQuery) ||
                enName.includes(lowerQuery) ||
                zhBio.includes(lowerQuery) ||
                enBio.includes(lowerQuery);
        });

        return zhTitle.includes(lowerQuery) ||
            zhDesc.includes(lowerQuery) ||
            enTitle.includes(lowerQuery) ||
            enDesc.includes(lowerQuery) ||
            tags.includes(lowerQuery) ||
            speakerMatches;
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

export const genSessionShareUrl = (sessionId: string) => {
    return `https://sitcon.org/2026/agenda/${sessionId}`;
};

export function registerSessionTools(server: McpServer) {
    server.tool(
        "search_sessions",
        "Search for sessions in the SITCON 2026 sessions by title, description, tags, or speakers.",
        {
            query: z.string().describe("The search keyword to filter sessions."),
        },
        async ({ query }) => {
            const results = searchSessions(query);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(results, null, 2),
                        query: query,
                    },
                ],
            };
        }
    );
    server.tool(
        "gen_session_share_url",
        "Generate a shareable URL for a specific session.",
        {
            sessionId: z.string().describe("The ID of the session to generate a shareable URL for."),
        },
        async ({ sessionId }) => {
            const url = genSessionShareUrl(sessionId);
            return {
                content: [
                    {
                        type: "text",
                        text: url,
                        query: sessionId,
                    },
                ],
            };
        }
    );
}

export default registerSessionTools;
