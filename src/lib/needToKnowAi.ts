import { GoogleGenAI } from '@google/genai';
import { NEED_TO_KNOW_CATEGORIES } from './needToKnowContent';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Create the client
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export type ChatMessageDto = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Sends a query to the real Gemini AI model contextually bound to the extensive hardcoded text.
 * Maintains conversation flow by appending previous history.
 */
export async function askLiveGeminiQuestion(
  categoryId: string, 
  history: ChatMessageDto[], 
  newQuery: string
): Promise<string> {
  
  const categoryContext = NEED_TO_KNOW_CATEGORIES.find(c => c.id === categoryId);
  if (!categoryContext) throw new Error("Invalid category context");

  if (!ai) {
    // Fallback if no API key is present in environment
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `**System Notice:** \`VITE_GEMINI_API_KEY\` is missing in your environment. \n\n*Simulated AI:* I understand you are asking about ${categoryContext.title}. Connect a valid Gemini key to enable live historical chat. The query was: "${newQuery}"`;
  }

  // Construct rigorous system prompt
  const systemPrompt = `You are a clinical, deeply insightful relationship analyst focusing on the severe and hidden structural dangers of specifically Indian pre-marriage arrangements.
Your ONLY goal is to protect the user from walking into relational failure blindly. You NEVER provide generic advice like "communicate better." You provide operational, behavioral insight and harsh reality checks.

Your absolute Ground Truth Knowledge Base for this conversation is the following text. You MUST align your answers with the philosophy and severity outlined in this text:

<GROUND_TRUTH>
${categoryContext.extensiveContent}
</GROUND_TRUTH>

Instructions:
1. Answer the user's latest query directly and clearly.
2. If they ask how to handle something, give them a specific, actionable behavioral script or test.
3. Keep it under 200 words. Format cleanly using markdown (bolding key concepts).
4. Do NOT hallucinate capabilities outside of being a harsh relationship analyst.`;

  // Format history for the API
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: newQuery }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
      }
    });

    return response.text || "No response generated. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Attempt fallback to Groq if VITE_GROQ_API_KEY is available
    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (groqApiKey) {
      try {
        console.warn("Gemini failing, redirecting to Groq Llama-3.3-70b-versatile fallback...");
        
        const groqMessages = [
          { role: 'system', content: systemPrompt },
          ...history.map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: newQuery }
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.4
          })
        });

        if (!groqRes.ok) {
           throw new Error(`Groq HTTP ${groqRes.status}`);
        }

        const groqData = await groqRes.json();
        return groqData.choices?.[0]?.message?.content || "AI generation failed on fallback.";
      } catch (fallbackError) {
        console.error("Groq API Fallback Error:", fallbackError);
        return `**Error reaching AI Systems:** Gemini failed due to demand, and Groq fallback also failed. Please try again later.`;
      }
    }

    return `**Error reaching AI Interface:** ${error instanceof Error ? error.message : 'Unknown network failure.'}`;
  }
}
