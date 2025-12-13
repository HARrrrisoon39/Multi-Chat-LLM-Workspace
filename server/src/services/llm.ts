export type LlmMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface LlmProvider {
  generate(messages: LlmMessage[]): Promise<string>;
}

class MockProvider implements LlmProvider {
  async generate(messages: LlmMessage[]): Promise<string> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const prompt = lastUser?.content || "How can I help?";
    return `Mock response: ${prompt}`;
  }
}

class GeminiProvider implements LlmProvider {
  constructor(
    private apiKey: string,
    private model: string = "gemini-1.5-flash-latest"
  ) {}

  async generate(messages: LlmMessage[]): Promise<string> {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Gemini error ${response.status} ${response.statusText}: ${errText}`
      );
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
    if (!text) {
      throw new Error("Gemini returned an empty response");
    }
    return text;
  }
}

class OpenAiProvider implements LlmProvider {
  constructor(private apiKey: string, private model: string = "gpt-4o-mini") {}

  async generate(messages: LlmMessage[]): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `OpenAI error ${response.status} ${response.statusText}: ${errText}`
      );
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty response");
    }
    return content.trim();
  }
}

function createProvider(): LlmProvider {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const geminiModel =
      process.env.GEMINI_MODEL || "gemini-2.5-flash";
    // eslint-disable-next-line no-console
    console.info("[LLM] Using Gemini provider:", geminiModel);
    return new GeminiProvider(geminiKey, geminiModel);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    // eslint-disable-next-line no-console
    console.info("[LLM] Using OpenAI provider:", model);
    return new OpenAiProvider(apiKey, model);
  }
  // eslint-disable-next-line no-console
  console.warn("[LLM] OPENAI_API_KEY not set. Using mock provider.");
  return new MockProvider();
}

const baseProvider = createProvider();
const fallbackProvider = new MockProvider();

export const llmProvider: LlmProvider = {
  async generate(messages: LlmMessage[]): Promise<string> {
    try {
      return await baseProvider.generate(messages);
    } catch (err) {
      // Graceful fallback to mock when primary provider fails (e.g., quota issues).
      // eslint-disable-next-line no-console
      console.warn(
        "[LLM] Base provider failed, falling back to mock:",
        err instanceof Error ? err.message : err
      );
      return await fallbackProvider.generate(messages);
    }
  },
};
