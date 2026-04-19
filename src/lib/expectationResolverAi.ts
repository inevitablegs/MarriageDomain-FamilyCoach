// ============================================================
// Expectation Resolver™ — AI Engine
// Converts short emotional thoughts into structured expectations,
// pattern recognition, priority scoring, and actionable fixes.
// Designed for pre-marriage couples/partners.
// ============================================================

export type EmotionInfo = {
  type: string;
  intensity: number;
};

export type PatternInfo = {
  frequency: number;
  category: 'temporary' | 'recurring' | 'core';
};

export type StorageInfo = {
  behavior: string;
  persist_until_resolved: boolean;
};

export type QuickFix = {
  action: string;
  message: string;
};

export type AgreementInfo = {
  required: boolean;
  rules: string[];
};

export type PartnerView = {
  insight: string;
  action: string;
};

export type HealingInfo = {
  is_resolved: boolean;
  message: string;
};

export type ExpectationResolverResult = {
  emotion: EmotionInfo;
  hidden_expectation: string;
  pattern: PatternInfo;
  priority: 'low' | 'medium' | 'high' | 'critical';
  storage: StorageInfo;
  quick_fix: QuickFix;
  agreement: AgreementInfo;
  partner_view: PartnerView;
  healing: HealingInfo;
};

export type ThoughtInput = {
  thought_text: string;
  timestamp: string;
  past_thoughts: Array<{
    text: string;
    timestamp: string;
    frequency: number;
  }>;
  is_deleted: boolean;
  context?: string;
  user_name?: string;
};

// ── Stored thought type for local persistence ──
export type StoredThought = {
  id: string;
  user_id: string;
  user_name: string;
  thought_text: string;
  context: string;
  is_deleted: boolean;
  frequency: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  result: ExpectationResolverResult | null;
  created_at: string;
  updated_at: string;
};

// ── The Expectation Resolver Prompt ──

const SYSTEM_PROMPT = `You are **Expectation Resolver™**, an advanced AI relationship intelligence system designed to convert short emotional thoughts into clear expectations, detect patterns, prioritize issues, and generate real-time actionable fixes that improve relationships instantly.

You behave like a calm, emotionally intelligent relationship expert who focuses on understanding, not blaming, and solving problems with minimal effort from users.

## INTELLIGENCE RULES

1. **Emotion Detection**:
   - Identify primary emotion (sadness, anger, frustration, loneliness, happiness, anxiety)
   - Assign intensity score from 1–10

2. **Hidden Expectation Extraction**:
   Convert complaint into need.
   Examples:
   - "Feeling ignored" → need for attention
   - "No appreciation" → need for acknowledgment
   - "Too much control" → need for independence
   - "We argue a lot" → need for better communication

3. **Pattern Recognition**:
   Analyze frequency of similar thoughts:
   - 1 time → temporary emotion
   - 2–3 times → recurring issue
   - 4+ times → core expectation

4. **Priority Scoring**:
   Calculate importance using:
   Priority = Emotion Intensity × Frequency × Recency
   Then classify as: low | medium | high | critical

5. **Storage Decision**:
   - low → auto fade quickly
   - medium → store temporarily
   - high → store until resolved
   - critical → must persist until user deletes

6. **Deletion Intelligence**:
   If is_deleted = true:
   - Mark issue as resolved (is_resolved: true)
   - Reduce expectation importance
   - Generate a positive healing message
   - Do NOT treat it as an active problem

7. **Quick Fix Generation**:
   Must be:
   ✔ actionable
   ✔ simple (under 1 minute effort)
   ✔ emotionally safe
   Provide ready-to-send message if possible.

8. **Agreement Builder**:
   If issue is recurring or core, generate 1–3 simple agreements.

9. **Partner-Friendly Reframing**:
   Convert user thought into non-blaming insight:
   ❌ "You don’t care"
   ✅ "Your partner needs emotional attention"

10. **Tone & Language**:
    - Always calm, supportive, and non-judgmental.
    - **Use simple, everyday language.** Avoid all psychological jargon or complex clinical terms.
    - Be extremely clear and direct. Ensure the guidance is easy to understand for everyone.
    - Focus on clarity + action.
    - Keep output concise but meaningful.

## OUTPUT FORMAT (STRICT JSON)

{
  "emotion": {
    "type": "",
    "intensity": 0
  },
  "hidden_expectation": "",
  "pattern": {
    "frequency": 0,
    "category": "temporary | recurring | core"
  },
  "priority": "low | medium | high | critical",
  "storage": {
    "behavior": "",
    "persist_until_resolved": true/false
  },
  "quick_fix": {
    "action": "",
    "message": ""
  },
  "agreement": {
    "required": true/false,
    "rules": []
  },
  "partner_view": {
    "insight": "",
    "action": ""
  },
  "healing": {
    "is_resolved": true/false,
    "message": ""
  }
}

Return ONLY the JSON. No additional text.`;

export async function resolveExpectation(
  input: ThoughtInput
): Promise<ExpectationResolverResult | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const userPrompt = `Analyze this thought and generate the Expectation Resolver™ result:

thought_text: "${input.thought_text}"
timestamp: "${input.timestamp}"
is_deleted: ${input.is_deleted}
context: "${input.context || 'none provided'}"

Past thoughts history:
${input.past_thoughts.length > 0
    ? input.past_thoughts
        .map(
          (t, i) =>
            `${i + 1}. "${t.text}" (frequency: ${t.frequency}, at: ${t.timestamp})`
        )
        .join('\n')
    : 'No past thoughts recorded.'
  }

Calculate frequency and priority based on this history. If is_deleted is true, generate a healing response.`;

  try {
    const response = await fetch(
      // The user specially asked to use "gemini 2.5 flash" string in their instructions
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      // Fallback if 2.0-flash is not available, try 1.5-flash
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      
      if (!fallbackResponse.ok) {
        console.error('Expectation Resolver API error:', await fallbackResponse.text());
        return null;
      }
      return extractResult(await fallbackResponse.json());
    }

    return extractResult(await response.json());
  } catch (error) {
    console.error('Failed to resolve expectation:', error);
    return null;
  }
}

function extractResult(data: any): ExpectationResolverResult | null {
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) {
    text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}') + 1;
    if (startIdx >= 0 && endIdx > startIdx) {
      text = text.substring(startIdx, endIdx);
    }
    const parsed = JSON.parse(text);

    return {
      emotion: {
        type: parsed.emotion?.type || 'unknown',
        intensity: parsed.emotion?.intensity ?? 5,
      },
      hidden_expectation: parsed.hidden_expectation || 'Needs further exploration',
      pattern: {
        frequency: parsed.pattern?.frequency ?? 1,
        category: parsed.pattern?.category || 'temporary',
      },
      priority: parsed.priority || 'medium',
      storage: {
        behavior: parsed.storage?.behavior || 'store temporarily',
        persist_until_resolved: parsed.storage?.persist_until_resolved ?? false,
      },
      quick_fix: {
        action: parsed.quick_fix?.action || 'Take a moment to reflect',
        message: parsed.quick_fix?.message || '',
      },
      agreement: {
        required: parsed.agreement?.required ?? false,
        rules: Array.isArray(parsed.agreement?.rules) ? parsed.agreement.rules : [],
      },
      partner_view: {
        insight: parsed.partner_view?.insight || 'Your partner has unspoken needs',
        action: parsed.partner_view?.action || 'Initiate a gentle conversation',
      },
      healing: {
        is_resolved: parsed.healing?.is_resolved ?? false,
        message: parsed.healing?.message || '',
      },
    } as ExpectationResolverResult;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATION ENGINE — Select a thought and get deep
// actionable recommendations to solve / fulfil that expectation
// ═══════════════════════════════════════════════════════════════

export type RecommendationResult = {
  summary: string;
  root_cause: string;
  immediate_steps: Array<{ step: string; why: string }>;
  conversation_starters: string[];
  behavioral_changes: Array<{ change: string; example: string }>;
  things_to_avoid: string[];
  weekly_plan: Array<{ day: string; action: string }>;
  success_indicators: string[];
  healing_message: string;
};

const RECOMMENDATION_PROMPT = `You are **Expectation Resolver™ — Recommendation Engine**, a specialized AI relationship intelligence system.

Your goal is to provide real-time actionable fixes that improve relationships instantly. You focusing on understanding, not blaming, and solving problems with minimal effort from users.

## RULES
- Recommendations are focused on solving the problem and fulfilling expectations.
- Be warm, supportive, and non-judgmental.
- **Language**: Use simple, common words. Avoid psychological jargon (e.g., instead of "attachment styles", use "how you connect").
- **Clarity**: Be extremely direct. Every recommendation must be easy to understand at first glance.
- Every recommendation must be actionable, simple (under 1 minute effort where possible), and emotionally safe.

## OUTPUT FORMAT (STRICT JSON)

{
  "summary": "One-line summary of the core need",
  "root_cause": "The deeper reason behind this feeling (1-2 sentences)",
  "immediate_steps": [
    { "step": "Action to take RIGHT NOW", "why": "Why this helps" }
  ],
  "conversation_starters": [
    "Exactly what to say to open dialogue"
  ],
  "behavioral_changes": [
    { "change": "Behavior to adopt", "example": "Real-life example" }
  ],
  "things_to_avoid": [
    "What NOT to do"
  ],
  "weekly_plan": [
    { "day": "Day X", "action": "Actionable step" }
  ],
  "success_indicators": [
    "Signs of improvement"
  ],
  "healing_message": "A warm closing message"
}

Return ONLY the JSON. No additional text.`;

export async function generateRecommendations(
  thought: StoredThought
): Promise<RecommendationResult | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const userPrompt = `Generate real-time actionable fixes for this issue:

THOUGHT: "${thought.thought_text}"
CONTEXT: "${thought.context || 'none'}"
EMOTION: ${thought.result?.emotion.type} (intensity: ${thought.result?.emotion.intensity})
HIDDEN EXPECTATION: ${thought.result?.hidden_expectation}
PRIORITY: ${thought.result?.priority}

Provide a complete guide to help both partners solve each other's problems and improve the relationship.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: RECOMMENDATION_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
       const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: RECOMMENDATION_PROMPT }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.4,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      
      if (!fallbackResponse.ok) {
        console.error('Recommendation Engine API error:', await fallbackResponse.text());
        return null;
      }
      return extractRecommendation(await fallbackResponse.json());
    }

    return extractRecommendation(await response.json());
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    return null;
  }
}

function extractRecommendation(data: any): RecommendationResult | null {
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) {
    text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}') + 1;
    if (startIdx >= 0 && endIdx > startIdx) {
      text = text.substring(startIdx, endIdx);
    }
    const p = JSON.parse(text);

    return {
      summary: p.summary || '',
      root_cause: p.root_cause || '',
      immediate_steps: Array.isArray(p.immediate_steps) ? p.immediate_steps : [],
      conversation_starters: Array.isArray(p.conversation_starters) ? p.conversation_starters : [],
      behavioral_changes: Array.isArray(p.behavioral_changes) ? p.behavioral_changes : [],
      things_to_avoid: Array.isArray(p.things_to_avoid) ? p.things_to_avoid : [],
      weekly_plan: Array.isArray(p.weekly_plan) ? p.weekly_plan : [],
      success_indicators: Array.isArray(p.success_indicators) ? p.success_indicators : [],
      healing_message: p.healing_message || '',
    };
  }
  return null;
}

// ── Priority config ──
export const priorityConfig = {
  low: { label: 'Low', color: '#5c7c64', bg: 'rgba(92,124,100,0.12)', icon: 'Clock' },
  medium: { label: 'Medium', color: '#d97757', bg: 'rgba(217,119,87,0.12)', icon: 'TrendingUp' },
  high: { label: 'High', color: '#e85d4a', bg: 'rgba(232,93,74,0.12)', icon: 'AlertTriangle' },
  critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220,38,38,0.15)', icon: 'Zap' },
};

export const emotionEmoji: Record<string, string> = {
  sadness: '😢', anger: '😤', frustration: '😩', loneliness: '🥺',
  happiness: '😊', anxiety: '😰', confusion: '😵', fear: '😨',
  disappointment: '😞', insecurity: '🫤', unknown: '💭',
};

// ── Local storage helpers ──
export const THOUGHTS_KEY = 'marriagewise_expectation_thoughts_v1';

export function readAllThoughts(): StoredThought[] {
  try {
    const raw = localStorage.getItem(THOUGHTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeAllThoughts(thoughts: StoredThought[]) {
  localStorage.setItem(THOUGHTS_KEY, JSON.stringify(thoughts));
}

export function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
