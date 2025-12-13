import { FastifyPluginAsync } from "fastify";
import {
  appendMessage,
  createChat,
  getChatMessages,
  listChats,
  ProjectPlan,
  ProjectPlanDeliverable,
  ProjectPlanWorkstream,
} from "../../domain/chat-store";
import { llmProvider } from "../../services/llm";

const chatRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const chats = listChats(request.userId);
    reply.send(chats);
  });

  fastify.post("/", async (request, reply) => {
    const body = (request.body as { name?: string }) || {};
    const chat = createChat(request.userId, body.name);
    reply.code(201).send(chat);
  });

  fastify.get("/:chatId/messages", async (request, reply) => {
    const { chatId } = request.params as { chatId: string };
    const messages = getChatMessages(request.userId, chatId);
    if (!messages) {
      reply.notFound("Chat not found");
      return;
    }
    reply.send(messages);
  });

  fastify.post("/:chatId/messages", async (request, reply) => {
    const { chatId } = request.params as { chatId: string };
    const body = (request.body as { content?: string }) || {};
    const content = body.content?.trim();
    if (!content) {
      reply.badRequest("Message content is required");
      return;
    }

    const userMessage = appendMessage(request.userId, chatId, "user", content);
    if (!userMessage) {
      reply.notFound("Chat not found");
      return;
    }

    try {
      const history = getChatMessages(request.userId, chatId) || [];
      const lower = content.toLowerCase();
      let assistantContent: string;
      let plan: ProjectPlan | undefined;

      if (lower.includes("project plan")) {
        const generated = await generatePlanFromLlm(content);
        plan = generated.plan ?? buildMockPlan();
        assistantContent = generated.messageText;
      } else {
        assistantContent = await llmProvider.generate(
          history.map((m) => ({ role: m.role, content: m.content }))
        );
      }

      const assistantMessage = appendMessage(
        request.userId,
        chatId,
        "assistant",
        assistantContent,
        plan
      );
      reply.send({ userMessage, assistantMessage });
    } catch (err) {
      reply.internalServerError(
        err instanceof Error ? err.message : "LLM error"
      );
    }
  });
};

export default chatRoutes;

function buildMockPlan(): ProjectPlan {
  return {
    workstreams: [
      {
        id: "A",
        title: "Enablement Strategy & Foundation",
        description:
          "Define purpose, scope, and initial structure with leadership alignment.",
        deliverables: [
          {
            id: "A1",
            title: "Enablement Charter",
            description:
              "Mission, vision, scope, and objectives for the enablement function.",
          },
          {
            id: "A2",
            title: "Success Metrics & Measurement Plan",
            description:
              "KPIs to track effectiveness and onboarding outcomes; measurement approach.",
          },
          {
            id: "A3",
            title: "Leadership Alignment & Sponsorship",
            description:
              "Stakeholder commitments and resourcing for the enablement initiative.",
          },
        ],
      },
      {
        id: "B",
        title: "Current State Analysis & Needs Assessment",
        description:
          "Identify gaps in skills, content, and processes across teams.",
        deliverables: [
          {
            id: "B1",
            title: "Stakeholder Interviews",
            description: "Structured interviews to capture pain points.",
          },
          {
            id: "B2",
            title: "Skills/Process Gap Report",
            description: "Summary of gaps and prioritized needs.",
          },
        ],
      },
      {
        id: "C",
        title: "Enablement Function & Program Development",
        description:
          "Design programs, content, and cadences to address prioritized needs.",
        deliverables: [
          {
            id: "C1",
            title: "Curriculum & Content Plan",
            description: "Sequenced modules with owners and formats.",
          },
          {
            id: "C2",
            title: "Pilot & Feedback Loop",
            description: "Run pilot, gather feedback, iterate content.",
          },
        ],
      },
      {
        id: "D",
        title: "Impact Measurement & Continuous Improvement",
        description:
          "Track outcomes, refine programs, and report to leadership.",
        deliverables: [
          {
            id: "D1",
            title: "Reporting Dashboard",
            description: "KPIs with targets and trends for stakeholders.",
          },
          {
            id: "D2",
            title: "Quarterly Review",
            description:
              "Review outcomes, adjust roadmap, and refresh content.",
          },
        ],
      },
    ],
  };
}

async function generatePlanFromLlm(
  userContent: string
): Promise<{ plan?: ProjectPlan; messageText: string }> {
  const prompt = [
    "You are a planner. Generate a concise project plan as JSON only. No prose.",
    "Return strictly a JSON object: { \"workstreams\": [ { \"id\": \"A\", \"title\": \"...\", \"description\": \"...\", \"deliverables\": [ { \"id\": \"A1\", \"title\": \"...\", \"description\": \"...\" } ] } ] }",
    "Rules: 3-6 workstreams; each 2-4 deliverables; ids letter + number; keep descriptions short (1 sentence).",
    `User request: ${userContent}`,
  ].join("\n");

  try {
    const raw = await llmProvider.generate([{ role: "user", content: prompt }]);
    const plan = parsePlan(raw);
    if (plan) {
      return {
        plan,
        messageText: "Here is your project plan: {{PLAN}}",
      };
    }
  } catch (err) {
    // fall through to mock
  }

  return {
    plan: undefined,
    messageText:
      "Here is your project plan: {{PLAN}} Let me know if you want any changes.",
  };
}

function parsePlan(text: string): ProjectPlan | undefined {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return undefined;

  try {
    const data = JSON.parse(match[0]) as {
      workstreams?: ProjectPlanWorkstream[];
    };
    if (!Array.isArray(data.workstreams)) return undefined;
    const workstreams = data.workstreams
      .map(normalizeWorkstream)
      .filter(Boolean) as ProjectPlanWorkstream[];
    if (workstreams.length === 0) return undefined;
    return { workstreams };
  } catch (err) {
    return undefined;
  }
}

function normalizeWorkstream(
  ws: any,
  idx: number
): ProjectPlanWorkstream | undefined {
  if (!ws) return undefined;
  const id =
    typeof ws.id === "string" && ws.id.trim()
      ? ws.id.trim()
      : String.fromCharCode(65 + idx);
  const title = typeof ws.title === "string" ? ws.title.trim() : "";
  const description =
    typeof ws.description === "string" ? ws.description.trim() : "";
  if (!title) return undefined;

  const deliverables =
    Array.isArray(ws.deliverables) && ws.deliverables.length > 0
      ? ws.deliverables
          .map((d: any, dIdx: number) => normalizeDeliverable(d, id, dIdx))
          .filter(Boolean)
      : [];

  return {
    id,
    title,
    description,
    deliverables: deliverables as ProjectPlanDeliverable[],
  };
}

function normalizeDeliverable(
  d: any,
  wsId: string,
  idx: number
): ProjectPlanDeliverable | undefined {
  if (!d) return undefined;
  const id =
    typeof d.id === "string" && d.id.trim()
      ? d.id.trim()
      : `${wsId}${idx + 1}`;
  const title = typeof d.title === "string" ? d.title.trim() : "";
  const description =
    typeof d.description === "string" ? d.description.trim() : "";
  if (!title) return undefined;
  return {
    id,
    title,
    description,
  };
}
