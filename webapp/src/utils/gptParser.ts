import OpenAI from 'openai';

interface ParsedAutomation {
  title: string;
  sources: string;
  extract: string;
  storeTo: string;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export async function parseAutomationFromText(text: string): Promise<ParsedAutomation> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an automation assistant. Parse user requests into structured automation data.
          
Extract the following information:
1. title: A short descriptive title for the automation (e.g., "Log Job Applications", "Track Tech Articles")
2. sources: The websites to track (e.g., "linkedin.com, jobright.com", "techcrunch.com, hackernews.com")
3. extract: What information to extract (e.g., "title & links", "job title, company, location", "article title, author, date")
4. storeTo: Where to store the data (sheet name or document name, e.g., "articles_log", "job_applications", "tech_news")

Return ONLY a JSON object with these four fields. Be concise and specific.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No response from GPT');
    }

    const parsed = JSON.parse(result);
    
    return {
      title: parsed.title || 'Untitled Automation',
      sources: parsed.sources || 'Not specified',
      extract: parsed.extract || 'Not specified',
      storeTo: parsed.storeTo || 'default_sheet'
    };
  } catch (error) {
    console.error('Error parsing automation:', error);

    return {
      title: 'Parse from Description',
      sources: 'Specify websites to track',
      extract: 'Specify what to extract',
      storeTo: 'Specify storage location'
    };
  }
}

