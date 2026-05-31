import { ENV } from "./env.js";

const ANTHROPIC_API_KEY = ENV.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export const generateAIReply = async (messageText, senderName) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not configured, returning default message");
      return `Thanks for the message! I'm currently away, but I'll get back to you soon.`;
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 150,
        system: `You are a friendly and helpful chat assistant. Keep responses brief, natural, and conversational (max 1-2 sentences). Don't use emojis. Respond as if you're the chat recipient, not an AI.`,
        messages: [
          {
            role: "user",
            content: `${senderName} sent: "${messageText}"\n\nRespond naturally and briefly as if you received this message from them.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Anthropic API error:", error);
      return `Thanks for reaching out! I'll respond soon.`;
    }

    const data = await response.json();
    const reply =
      data.content[0].text || `Thanks for the message!`;
    return reply;
  } catch (error) {
    console.error("Error generating AI reply:", error);
    return `Thanks for the message! I'll get back to you soon.`;
  }
};
