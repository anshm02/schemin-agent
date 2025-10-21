import OpenAI from 'openai';

export interface ParsedAutomation {
  title: string;
  sources: string;
  extract: string;
  storeTo: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationResult {
  needsMoreInfo: boolean;
  assistantResponse?: string;
  automation?: ParsedAutomation;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export async function handleConversation(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<ConversationResult> {
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a helpful automation assistant. Help users create automations by gathering three required pieces of information:
1. SOURCES: Which websites to track (e.g., "linkedin.com, indeed.com")
2. EXTRACT: What information to extract (e.g., "job title, company, location")
3. STORE TO: Where to save the data (e.g., "job_applications")

If the user provides all three details, respond with a JSON object:
{"complete": true, "title": "...", "sources": "...", "extract": "...", "storeTo": "..."}

If any details are missing, ask politely and briefly for the missing information. Be conversational and natural. 
Respond with: {"complete": false, "message": "your question here"}

Keep your questions short and friendly.`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: userMessage
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No response from GPT');
    }

    const parsed = JSON.parse(result);

    if (parsed.complete) {
      return {
        needsMoreInfo: false,
        automation: {
          title: parsed.title || 'Automation',
          sources: parsed.sources || '',
          extract: parsed.extract || '',
          storeTo: parsed.storeTo || ''
        }
      };
    } else {
      return {
        needsMoreInfo: true,
        assistantResponse: parsed.message || 'What would you like to automate?'
      };
    }
  } catch (error) {
    console.error('Error in conversation:', error);
    return {
      needsMoreInfo: true,
      assistantResponse: 'Could you describe what you want to automate?'
    };
  }
}

