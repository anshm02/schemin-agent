import fetch from 'node-fetch';

export class Phi3Service {
    private readonly phi3Endpoint = 'http://127.0.0.1:11434/api/generate';  
  async classifyIntent(content: string, automationTitle: string, automationExtract: string): Promise<boolean> {
    const prompt = `You are an intent classifier. Determine if the following web page content is relevant to the user's automation intent.

Automation Intent: "${automationTitle}"
Fields to Extract: "${automationExtract}"

Web Page Content:
${content.substring(0, 4000)}

Respond with ONLY "YES" if this page contains information relevant to the automation intent, or "NO" if it does not.`;

    console.log('\n=== INTENT CLASSIFICATION ===');
    console.log('Automation Title:', automationTitle);
    console.log('Content Length:', content.length);
    console.log('Content Preview:', content.substring(0, 200), '...');

    try {
      const response = await fetch(this.phi3Endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5:0.5b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 10
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Model API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const answer = data.response.trim().toUpperCase();
      
      console.log('Model Response:', answer);
      console.log('Is Relevant:', answer.startsWith('YES'));
      console.log('============================\n');
      
      return answer.startsWith('YES');
    } catch (error) {
      console.error('Intent classification error:', error);
      throw error;
    }
  }

  async extractFields(content: string, fieldsToExtract: string): Promise<Record<string, string>> {
    const prompt = `Extract the following fields from the web page content. Return ONLY a valid JSON object with the extracted values.

Fields to Extract: ${fieldsToExtract}

Web Page Content:
${content.substring(0, 6000)}

Return a JSON object with the field names as keys and extracted values. If a field is not found, set its value to empty string. Example format:
{"field1": "value1", "field2": "value2"}`;

    console.log('\n=== FIELD EXTRACTION ===');
    console.log('Fields to Extract:', fieldsToExtract);
    console.log('Content Length:', content.length);

    try {
      const response = await fetch(this.phi3Endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5:0.5b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: 500
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Model API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const responseText = data.response.trim();
      
      console.log('Model Response:', responseText);
      
      const jsonMatch = responseText.match(/\{[^}]+\}/);
      let parsed: Record<string, string>;
      
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(responseText);
      }
      
      for (const key in parsed) {
        if (!parsed[key] || parsed[key].trim() === '') {
          parsed[key] = 'Not detected';
        }
      }
      
      console.log('Extracted Fields:', parsed);
      console.log('=======================\n');
      return parsed;
    } catch (error) {
      console.error('Field extraction error:', error);
      throw error;
    }
  }

  async mapToSheetHeaders(extractedData: Record<string, string>, sheetHeaders: string[]): Promise<string[]> {
    if (sheetHeaders.length === 0) {
      return [];
    }

    const prompt = `You are a data mapping assistant. Map the extracted data to the sheet column headers.

Sheet Column Headers: ${JSON.stringify(sheetHeaders)}

Extracted Data: ${JSON.stringify(extractedData)}

For each column header, find the most relevant value from the extracted data. If no relevant value exists, use "Not detected".

Return a JSON array of values in the EXACT order of the sheet headers. Example:
["value1", "value2", "Not detected", "value3"]`;

    console.log('\n=== MAPPING TO SHEET HEADERS ===');
    console.log('Sheet Headers:', sheetHeaders);
    console.log('Extracted Data:', extractedData);

    try {
      const response = await fetch(this.phi3Endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5:0.5b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 200
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Model API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const responseText = data.response.trim();
      
      console.log('Model Response:', responseText);
      
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const mapped = JSON.parse(jsonMatch[0]);
        console.log('Mapped Values:', mapped);
        console.log('================================\n');
        return mapped;
      }
      
      const parsed = JSON.parse(responseText);
      console.log('Mapped Values:', parsed);
      console.log('================================\n');
      return parsed;
    } catch (error) {
      console.error('Sheet mapping error:', error);
      return sheetHeaders.map(() => 'Not detected');
    }
  }
}

export const phi3Service = new Phi3Service();

