import { ENV } from "./env.js";

/* ─────────────────────────────────────────────────────────────────────────
   FREE rule-based AI reply generator
   Works without any API key.
   If ANTHROPIC_API_KEY is set → uses Claude for smarter replies.
───────────────────────────────────────────────────────────────────────── */

// Local keyword patterns (free, no API)
const PATTERNS = [
  { kw: ["hello", "hi", "hey", "hii", "helo", "namaste", "namaskar", "ram ram"],
    replies: ["Hey! How are you?", "Hi there! 😊", "Hello! What's up?", "Heyy! Kya haal hai?"] },

  { kw: ["how are you", "kaise ho", "kaisa hai", "how r u", "howdy"],
    replies: ["I'm doing great, thanks! 😊", "All good! You?", "Mast hoon bhai! Tu batao?", "Pretty well, thanks for asking!"] },

  { kw: ["thank", "thanks", "shukriya", "dhanyavaad", "ty", "thx"],
    replies: ["You're welcome! 🙏", "Happy to help!", "Anytime!", "No problem at all!"] },

  { kw: ["sorry", "maafi", "pardon", "apologies"],
    replies: ["No worries! 😊", "All good!", "Don't mention it!", "It's fine!"] },

  { kw: ["bye", "goodbye", "alvida", "see you", "later", "cya", "ttyl"],
    replies: ["Bye! Take care! 👋", "See you soon!", "Talk later!", "Take care!"] },

  { kw: ["ok", "okay", "sure", "alright", "theek", "thik", "done", "haan", "han"],
    replies: ["Great! 👍", "Perfect!", "Sounds good!", "Cool!"] },

  { kw: ["when", "kab", "what time", "kitne baje", "schedule", "time"],
    replies: ["What time works for you?", "Let me check my schedule", "How about tomorrow?", "Tell me when you're free"] },

  { kw: ["where", "kahan", "location", "address", "jagah"],
    replies: ["Where exactly?", "Can you send the location?", "I'll be there soon!", "Drop me the address"] },

  { kw: ["why", "kyu", "kyun", "reason", "because"],
    replies: ["Good question!", "Let me explain...", "I'll tell you!", "Hmm, because..."] },

  { kw: ["love you", "love u", "i love", "pyaar", "pyar"],
    replies: ["❤️", "Aww! 😊", "Love you too! ❤️", "😍"] },

  { kw: ["food", "khana", "eat", "lunch", "dinner", "breakfast", "hungry"],
    replies: ["Let's eat! 🍽️", "I'm hungry too!", "What do you want to eat?", "Pizza? 🍕"] },

  { kw: ["work", "office", "job", "kaam", "busy"],
    replies: ["Stay strong! 💪", "You got this!", "Take a break if needed", "Hard work pays off!"] },

  { kw: ["sleep", "so ja", "neend", "tired", "thaka"],
    replies: ["Good night! 🌙", "Rest well!", "Sleep tight!", "Sweet dreams 😴"] },

  { kw: ["good morning", "subah", "morning", "gm"],
    replies: ["Good morning! ☀️", "Rise and shine!", "Morning! 😊", "Have a great day!"] },

  { kw: ["good night", "raat", "night", "gn"],
    replies: ["Good night! 🌙", "Sweet dreams!", "Sleep well!", "Night night! 😴"] },

  { kw: ["happy", "khush", "great", "amazing", "awesome", "fantastic"],
    replies: ["That's wonderful! 😊", "So happy for you!", "Amazing news!", "Yayy! 🎉"] },

  { kw: ["sad", "dukhi", "upset", "cry", "unhappy"],
    replies: ["It'll be okay! 🤗", "I'm here for you", "Cheer up! 😊", "Don't worry, things get better!"] },

  { kw: ["help", "madad", "problem", "issue", "stuck"],
    replies: ["I'll help you!", "What's the problem?", "Tell me more", "Let's figure it out together!"] },

  { kw: ["?"],
    replies: ["Great question!", "Let me think...", "Hmm, not sure!", "Tell me more?"] },
];

const DEFAULT_REPLIES = [
  "Got it! 👍",
  "Hmm, interesting!",
  "Tell me more!",
  "I see what you mean!",
  "That makes sense!",
  "Okay! 😊",
];

function localReply(text) {
  const lower = text.toLowerCase();
  for (const { kw, replies } of PATTERNS) {
    if (kw.some(k => lower.includes(k))) {
      return replies[Math.floor(Math.random() * replies.length)];
    }
  }
  return DEFAULT_REPLIES[Math.floor(Math.random() * DEFAULT_REPLIES.length)];
}

/* ─────────────────────────────────────────────────────────────────────────
   Main export — uses Claude if key is set, else uses local rule engine
───────────────────────────────────────────────────────────────────────── */
export const generateAIReply = async (messageText, senderName) => {
  // ── Try Anthropic if key exists ────────────────────────────────────────
  if (ENV.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key":          ENV.ANTHROPIC_API_KEY,
          "anthropic-version":  "2023-06-01",
          "content-type":       "application/json",
        },
        body: JSON.stringify({
          model:      "claude-haiku-4-5-20251001",  // cheapest + fastest model
          max_tokens: 100,
          system: "You are a casual chat assistant. Reply in 1 short sentence. Be friendly and natural. Match the language (Hindi/English/Hinglish) of the message.",
          messages: [{
            role: "user",
            content: `${senderName} sent: "${messageText}"\nReply briefly and naturally.`,
          }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.content?.[0]?.text || localReply(messageText);
      }
    } catch (e) {
      console.warn("[AI] Anthropic failed, using local fallback:", e.message);
    }
  }

  // ── Free local fallback ────────────────────────────────────────────────
  return localReply(messageText);
};
