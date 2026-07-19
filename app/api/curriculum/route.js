// app/api/curriculum/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { scenario } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing on the server." }, { status: 500 });
    }

    const systemPrompt = `You are an expert bilingual linguist specialized in Abidjan street slang (Nouchi) and West African Pidgin English.
Generate exactly 4 distinct, highly practical survival phrases for the scenario category: "${scenario}".
For each phrase, you MUST provide:
1. "id": A unique integer from 1 to 4.
2. "nouchi": The authentic street slang spoken in Abidjan.
3. "pidgin": The corresponding natural Nigerian Pidgin translation.
4. "french": The standard, formal French translation (starting with "Formal: ").
5. "situation": Exactly "${scenario}".

You MUST return the output as a strict JSON structure containing a key named "phrases" which holds the array. Do not include markdown blocks like \`\`\`json. Format exactly like this:
{
  "phrases": [
    { "id": 1, "nouchi": "...", "pidgin": "...", "french": "Formal: ...", "situation": "${scenario}" }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Give me 4 survival items for ${scenario}` }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" } // Force standard JSON object from GPT
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI Error Block:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const rawContent = data.choices[0].message.content.trim();
    const parsedData = JSON.parse(rawContent);
    
    // Safety unpacking: Find the array regardless of what key the model chose
    let finalArray = [];
    if (Array.isArray(parsedData)) {
      finalArray = parsedData;
    } else if (parsedData.phrases && Array.isArray(parsedData.phrases)) {
      finalArray = parsedData.phrases;
    } else {
      // Find any first array inside the returned object keys
      const keys = Object.keys(parsedData);
      for (const key of keys) {
        if (Array.isArray(parsedData[key])) {
          finalArray = parsedData[key];
          break;
        }
      }
    }

    // Double-check we actually have a valid array to send back
    if (!Array.isArray(finalArray) || finalArray.length === 0) {
      throw new Error("AI returned JSON, but couldn't parse out a valid array.");
    }

    return NextResponse.json({ phrases: finalArray });

  } catch (error) {
    console.error("Curriculum Route Handler Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate learning material", 
      details: error.message,
      phrases: [] // Safe fallback structure
    }, { status: 500 });
  }
}