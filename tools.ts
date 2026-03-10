import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Fetch sessions from Github
const sessionUrl = "https://sitcon.org/2026/sessions.json";
const teamUrl = "https://raw.githubusercontent.com/sitcon-tw/2026/refs/heads/main/src/data/team.json";
const fetchSessions = async () => {
	const response = await fetch(sessionUrl);
	const data = await response.json();
	return data;
};

const fetchTeam = async () => {
	const response = await fetch(teamUrl);
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

let teamData: TeamMember[] = [];
try {
	teamData = await fetchTeam();
} catch (error) {
	console.error("Error fetching team:", error);
}

// Type definitions
export interface TeamRole {
	name: string;
	role: string;
}

export interface TeamMember {
	name: string;
	description: string;
	teams: TeamRole[];
	link?: string;
	mode?: string;
	color?: string;
}

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

// Function for searching sessions
export const searchSessions = (query: string) => {
	const lowerQuery = query.toLowerCase();

	if (!sessionData.sessions || !Array.isArray(sessionData.sessions)) {
		return [];
	}

	return sessionData.sessions
		.filter((session: Session) => {
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
				return zhName.includes(lowerQuery) || enName.includes(lowerQuery) || zhBio.includes(lowerQuery) || enBio.includes(lowerQuery);
			});

			return zhTitle.includes(lowerQuery) || zhDesc.includes(lowerQuery) || enTitle.includes(lowerQuery) || enDesc.includes(lowerQuery) || tags.includes(lowerQuery) || speakerMatches;
		})
		.map((session: Session) => ({
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

export const getSpeaker = (id: string) => {
	if (!sessionData.speakers || !Array.isArray(sessionData.speakers)) {
		return null;
	}
	return sessionData.speakers.find(s => s.id === id) || null;
};

export const getSpeakerByName = (name: string) => {
	if (!sessionData.speakers || !Array.isArray(sessionData.speakers)) {
		return [];
	}
	const lowerName = name.toLowerCase();
	return sessionData.speakers.filter(s => (s.zh?.name?.toLowerCase() || "").includes(lowerName) || (s.en?.name?.toLowerCase() || "").includes(lowerName));
};

export const searchMemberByTeam = (teamName: string, role?: string) => {
	if (!teamData || !Array.isArray(teamData)) return [];
	const lowerTeam = teamName.toLowerCase();
	const lowerRole = role?.toLowerCase();

	return teamData.filter(member => {
		return member.teams.some(t => {
			const matchTeam = t.name.toLowerCase().includes(lowerTeam);
			const matchRole = lowerRole ? t.role.toLowerCase().includes(lowerRole) : true;
			return matchTeam && matchRole;
		});
	});
};

export const searchMemberByName = (name: string) => {
	if (!teamData || !Array.isArray(teamData)) return [];
	const lowerName = name.toLowerCase();
	return teamData.filter(member => member.name.toLowerCase().includes(lowerName));
};

export const searchMemberByDescriptionAndLink = (query: string) => {
	if (!teamData || !Array.isArray(teamData)) return [];
	const lowerQuery = query.toLowerCase();
	return teamData.filter(member => {
		const matchDesc = member.description?.toLowerCase().includes(lowerQuery) || false;
		const matchLink = member.link?.toLowerCase().includes(lowerQuery) || false;
		return matchDesc || matchLink;
	});
};

export const genSessionShareUrlSingle = (sessionId: string) => {
	return `https://sitcon.org/2026/agenda/${sessionId}`;
};

export const genSessionShareUrlMulti = (sessionIds: string[], n = "我") => {
	const cleanedIds = sessionIds.map(id => id.trim()).filter(Boolean);
	const query = encodeURIComponent(cleanedIds.join(","));
	const displayName = encodeURIComponent(n);
	return `https://sitcon.org/2026/agenda/?q=${query}&n=${displayName}`;
};

export function registerSessionTools(server: McpServer) {
	server.tool(
		"search_sessions",
		"Search for sessions in the SITCON 2026 sessions by title, description, tags, or speakers.",
		{
			query: z.string().describe("The search keyword to filter sessions.")
		},
		async ({ query }) => {
			const results = searchSessions(query);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(results, null, 2),
						query: query
					}
				]
			};
		}
	);
	server.tool(
		"gen_session_share_url",
		"Generate a shareable URL for a specific session.",
		{
			sessionId: z.string().describe("The ID of the session to generate a shareable URL for.")
		},
		async ({ sessionId }) => {
			const url = genSessionShareUrlSingle(sessionId);
			return {
				content: [
					{
						type: "text",
						text: url,
						query: sessionId
					}
				]
			};
		}
	);

	server.tool(
		"gen_session_share_url_multi",
		"Generate a shareable URL for multiple sessions.",
		{
			sessionIds: z.array(z.string()).min(1).describe("The list of session IDs to include in the share URL."),
			n: z.string().optional().describe("The name shown in the share URL. Defaults to 我.")
		},
		async ({ sessionIds, n }) => {
			const url = genSessionShareUrlMulti(sessionIds, n ?? "我");
			return {
				content: [
					{
						type: "text",
						text: url,
						query: JSON.stringify({ sessionIds, n: n ?? "我" })
					}
				]
			};
		}
	);

	server.tool(
		"search_speaker_by_id",
		"Search for a speaker by their ID.",
		{
			query: z.string().describe("The speaker ID to search for.")
		},
		async ({ query }) => {
			const speaker = getSpeaker(query);
			if (!speaker) {
				return {
					content: [
						{
							type: "text",
							text: `Speaker with ID "${query}" not found.`
						}
					],
					isError: true
				};
			}
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(speaker, null, 2)
					}
				]
			};
		}
	);

	server.tool(
		"search_speaker_by_name",
		"Search for a speaker by their name.",
		{
			query: z.string().describe("The speaker name to search for.")
		},
		async ({ query }) => {
			const speakers = getSpeakerByName(query);
			if (speakers.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: `Speaker with name "${query}" not found.`
						}
					],
					isError: true
				};
			}
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(speakers, null, 2)
					}
				]
			};
		}
	);

	server.tool(
		"search_member_by_team",
		"Search for a team member by their team name and optionally role.",
		{
			teamName: z.string().describe("The team name to search for."),
			role: z.string().optional().describe("The optional role to filter by.")
		},
		async ({ teamName, role }) => {
			const members = searchMemberByTeam(teamName, role);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(members, null, 2)
					}
				]
			};
		}
	);

	server.tool(
		"search_member_by_name",
		"Search for a team member by their name.",
		{
			name: z.string().describe("The name to search for.")
		},
		async ({ name }) => {
			const members = searchMemberByName(name);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(members, null, 2)
					}
				]
			};
		}
	);

	server.tool(
		"search_member_by_description_and_link",
		"Search for a team member by their description or link.",
		{
			query: z.string().describe("The keyword to search in description or link.")
		},
		async ({ query }) => {
			const members = searchMemberByDescriptionAndLink(query);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(members, null, 2)
					}
				]
			};
		}
	);

	server.tool("get_code_of_conduct", "Get the SITCON Code of Conduct (CoC) policies and guidelines.", {}, async () => {
		const cocContent = `SITCON Code of Conduct

SITCON 冀望打造屬於學生自己的舞台，而我們也致力於為社群中的每位成員提供更友善、開放的環境。我們相信每位參與社群活動的夥伴都值得被尊重，而我們會盡力提供最安全的環境，讓參與 SITCON 盛會的每位朋友能夠認識個體間的差異、在社群中相互扶助、並鼓勵每個人揮灑屬於自己生命的色彩。

因此，若有幸能在 SITCON 社群與您見面，無論您是以與會者、贊助商、工作人員、或是講者的身分參加活動，我們都希望您遵守以下的行為準則：
- 尊重每一位參與者，將對方的感受放在心上。
- 避免使用帶有侮辱、歧視、或具有潛在騷擾意涵的文字、言語及肢體動作。
- 多關心周遭的社群夥伴，適度詢問對方是否需要協助。
- 當遭遇危險、或發現事情不對勁時，適時尋求工作人員的支援與協助。
- 在活動裡多交朋友，珍惜彼此相聚的時光！

以下的行為是不被社群所容忍的：
- 歧視行為，包含針對性別、性向、種族、外貌、宗教、年齡、身體狀況或個人身分的挑釁、冒犯、錯稱或差別待遇。
- 騷擾行為，包含性騷擾、造成當事人反感的綽號或肢體接觸，以及任何形式的言語或肢體霸凌。
- 公開發表、展示或放映含有侮辱、歧視、仇恨、暴力、或是性暗示的言論或影像。
- 無故干擾議程或活動的正常進行，無視工作人員或與會者的制止。
- 干擾、攻擊活動場地網路，未經同意蒐集或散佈個人資料。
- 其他違反法律的行為。

為了確保每位參與者的安全，我們將恪守以上規則。違反行為準則的參與者，我們將採取必要且合理的手段予以介入，包含但不限於將參與者請離現場、自相關名冊除名或列為不受歡迎對象，或在必要時移送警察機關法辦。若您或他人遇到了以上情況、或是有任何其他顧慮，都請立即尋求 SITCON 工作人員的協助。

我們誠摯地邀請來到 SITCON 的朋友一同履行以上承諾，將 SITCON 打造為更友善、更溫暖的所在；讓每一位參與者，都能在社群的交流中共同成長、在人與人的互動中找到自信——而這正是我們所珍惜的、屬於學生社群的真正精神。

詳細請參考：https://sitcon.org/code-of-conduct/`;

		return {
			content: [
				{
					type: "text",
					text: cocContent
				}
			]
		};
	});

	server.tool("get_theme", "Get the SITCON 2026 Theme and its concept.", {}, async () => {
		const themeContent = `SITCON 2026 年會主題：Jam the Chaos

時代的劇本已被打破，劃一的旋律變得七零八落在這混沌的時代，平衡能否被我們重新尋回？

身處 2026，作為資訊人與學生的我們，正身在時代變革的風口浪尖。AI 的崛起挑戰了傳統的開發模式，定義資訊人價值的技術壁壘正逐漸崩塌。當創造的權力民主化，個體技術不再能作為我們的護城河時，「協作」成了我們最重要的課題。我們正迎向一場尋求與 AI、同儕、跨域夥伴協奏平衡的盛大混沌。但，如果「亂」不是阻礙，而是新平衡的起點呢？

在即興音樂的 Jam Session 中，演奏不再有指揮，當 Jam 的節拍對不上，就讓我們一起創造新的節拍。當 Jam 的合聲不完美，這正是我們這個世代，兼容並蓄、豪邁不羈、百家爭鳴的聲音。

在 SITCON 2026，我們邀請你一起加入這場 Jam。讓我們駕馭混沌，在紛亂中找到節奏，在協作中尋求共鳴。

詳細請參考：https://sitcon.org/2026/`;

		return {
			content: [
				{
					type: "text",
					text: themeContent
				}
			]
		};
	});

	server.tool("get_sitcon_info", "Get the introduction and spirit of SITCON (Students' Information Technology Conference).", {}, async () => {
		const sitconInfo = `SITCON 學生計算機年會 | Students' Information Technology Conference

以學生為本、由學生自發舉辦，SITCON 學生計算機年會不只是學生「學以致用、教學相長」的實際展現，更冀望所有對資訊有興趣的學生，能夠在年會裏齊聚一堂，彼此激盪、傳承、啟發。

詳細請參考：https://sitcon.org/`;

		return {
			content: [
				{
					type: "text",
					text: sitconInfo
				}
			]
		};
	});
}

export default registerSessionTools;
