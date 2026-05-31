/**
 * Generate smart reply suggestions based on message content
 * Uses keyword analysis to suggest contextually relevant responses
 */

const suggestionPatterns = [
  {
    keywords: ['how are you', 'how have you been', "what's up", 'how you doing', 'whats new'],
    suggestions: ['I\'m doing great!', 'All good, thanks!', 'Pretty well, thanks for asking!']
  },
  {
    keywords: ['thank', 'thanks', 'thankyou', 'appreciate'],
    suggestions: ['You\'re welcome!', 'Happy to help!', 'Anytime!']
  },
  {
    keywords: ['sorry', 'apologies', 'apologize'],
    suggestions: ['No worries!', 'All good!', 'Don\'t mention it!']
  },
  {
    keywords: ['okay', 'ok', 'alright', 'sure', 'agree', 'yes'],
    suggestions: ['Great!', 'Perfect!', 'Sounds good!']
  },
  {
    keywords: ['no', 'nope', 'don\'t think so', 'disagree'],
    suggestions: ['Got it', 'No problem', 'Understand']
  },
  {
    keywords: ['when', 'what time', 'schedule', 'meeting'],
    suggestions: ['What time works for you?', 'Let me check my schedule', 'How about tomorrow?']
  },
  {
    keywords: ['where', 'location', 'place', 'address'],
    suggestions: ['Where exactly?', 'Can you send the address?', 'I\'ll be there soon']
  },
  {
    keywords: ['question mark', '?', 'need help', 'can you', 'would you', 'could you'],
    suggestions: ['Sure, happy to help!', 'Let me check', 'I can help with that']
  },
  {
    keywords: ['hello', 'hi', 'hey', 'what\'s up', 'hiya'],
    suggestions: ['Hey! How are you?', 'Hi there!', 'What\'s up!']
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'talk later', 'take care'],
    suggestions: ['See you later!', 'Take care!', 'Talk soon!']
  }
];

const defaultSuggestions = [
  'Sounds good!',
  'Sure!',
  'Let me check'
];

/**
 * Generate 3 smart reply suggestions for a given message
 * @param {string} messageText - The received message text
 * @returns {string[]} Array of 3 suggested replies
 */
export const generateSmartReplies = (messageText) => {
  if (!messageText || messageText.trim().length === 0) {
    return defaultSuggestions;
  }

  const lowerText = messageText.toLowerCase();

  // Find matching pattern
  for (const pattern of suggestionPatterns) {
    const hasKeyword = pattern.keywords.some(keyword => lowerText.includes(keyword));
    if (hasKeyword) {
      // Shuffle suggestions and return 3
      const shuffled = [...pattern.suggestions].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    }
  }

  // If no pattern matches, return default suggestions
  return defaultSuggestions;
};

/**
 * Check if message is a question
 * @param {string} messageText - Message text to check
 * @returns {boolean} True if message appears to be a question
 */
export const isQuestion = (messageText) => {
  if (!messageText) return false;
  return messageText.trim().endsWith('?');
};
