// app/api/translate/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text, direction } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key is missing on the server." }, { status: 500 });
    }

    // Custom instructions to make sure the AI acts as a perfect bilingual cultural bridge
    let systemPrompt = "";
    if (direction === 'to-nouchi') {
      systemPrompt = `You are a street-savvy translator in Abidjan, Côte d'Ivoire. 
Your job is to translate Nigerian Pidgin English or Standard English into highly localized, authentic Ivorian Nouchi street slang.
- Keep the output natural, short, and punchy (exactly as spoken on the street).
- Return ONLY the direct translation. Do not write introductory text, explanations, or quotes.
- If standard French works better for the context, you can blend it, but prioritize Nouchi street credibility.`;
    } else {
      systemPrompt = `You are a friendly cultural translator. 
Your job is to translate spoken Ivorian French or Nouchi street slang into natural, easy-to-understand Nigerian Pidgin (preferred) or conversational English.
- Return ONLY the direct translation in Pidgin/English. Do not write notes or explanations.`;
    }

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
          { role: 'user', content: text }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const translation = data.choices[0].message.content.trim();

    return NextResponse.json({ translation });
  } catch (error) {
    console.error("Translation API Error:", error);
    return NextResponse.json({ error: "Failed to process translation" }, { status: 500 });
  }
}