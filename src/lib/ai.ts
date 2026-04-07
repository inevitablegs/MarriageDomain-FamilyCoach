// ============================================================
// NEW TYPES FOR SOLUTION-ORIENTED OUTPUTS
// ============================================================

export type SolutionReport = {
  insight: string;
  mainProblems: string[];
  stepByStepActions: string[];
  futurePrecautions: string[];
  recommendedActions: string[];
};

// ============================================================
// ORIGINAL TYPES (kept for compatibility)
// ============================================================

export type AssessmentData = {
  values_score: number;
  lifestyle_score: number;
  communication_score: number;
  total_score: number;
  relationship_status: string;
};

export type RedFlagData = {
  high_severity: number;
  medium_severity: number;
  low_severity: number;
  categories: string[];
};

export type HealthData = {
  emotional_score: number;
  communication_score: number;
  intimacy_score: number;
  conflict_score: number;
  overall_score: number;
};

export type GeminiRelationshipInput = {
  finalScore: number;
  categoryScores: Record<string, number>;
  riskFlags: string[];
  mismatches: string[];
  keyTextAnswers: string[];
};

export type PreMarriageAnalysisResult = {
  redFlagPercentage: number;
  personalityTraits: { trait: string; type: 'positive' | 'negative' }[];
  analysisExplanation: string;
  // NEW fields for solution
  insight: string;
  mainProblems: string[];
  stepByStepActions: string[];
  futurePrecautions: string[];
  recommendedActions: string[];
};

// ============================================================
// 1. getAIRecommendations – returns SolutionReport
// ============================================================

export async function getAIRecommendations(
  assessmentData?: AssessmentData,
  redFlagData?: RedFlagData,
  healthData?: HealthData
): Promise<SolutionReport> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return {
      insight: "Your relationship data is incomplete for a full AI analysis.",
      mainProblems: ["Missing assessment scores or red flag data"],
      stepByStepActions: [
        "Complete the Compatibility Quiz to get baseline scores",
        "Log any observed red flags using the Red Flag Tracker",
        "Use the Health Tracker weekly to monitor changes"
      ],
      futurePrecautions: [
        "Avoid making major decisions without full data",
        "Watch for patterns of avoidance or conflict escalation"
      ],
      recommendedActions: [
        "Book a Decision Clarity Session to interpret your situation",
        "Start a daily 10-minute check‑in with your partner"
      ]
    };
  }

  const systemPrompt = `You are an elite relationship counselor and clinical psychologist.

Your task is to analyze the provided relationship metrics and produce a **solution‑oriented clinical report**.

Output MUST be valid JSON matching this exact structure:
{
  "insight": "One powerful sentence summarizing the core dynamic.",
  "mainProblems": ["Problem 1", "Problem 2", "Problem 3 (max 5)"],
  "stepByStepActions": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ...", "Step 5: ..."],
  "futurePrecautions": ["If this pattern continues, watch for ...", "Avoid ...", "Consider ..."],
  "recommendedActions": ["Priority 1: ...", "Priority 2: ...", "Priority 3: ..."]
}

Guidelines:
- All content must be directly derived from the provided data.
- If high‑severity red flags exist (high_severity > 0), at least one future precaution MUST advise professional intervention or pausing major decisions.
- Step‑by‑step actions must be daily or weekly behavioral changes, not vague advice.
- Keep language VERY SIMPLE, easy to understand, and empathetic. Do NOT use complex psychological jargon or big words. Explain things like you are talking to a normal person.`;

  const userDataRaw = {
    ...(assessmentData && { compatibilityAssessment: assessmentData }),
    ...(redFlagData && { redFlagRisk: redFlagData }),
    ...(healthData && { healthTrackerMetrics: healthData })
  };

  const userPrompt = `Generate a solution report based on this user's current relationship data (scores are out of 100):
${JSON.stringify(userDataRaw, null, 2)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);
        if (parsed.insight && Array.isArray(parsed.mainProblems)) {
          return {
            insight: parsed.insight,
            mainProblems: parsed.mainProblems.slice(0, 5),
            stepByStepActions: parsed.stepByStepActions.slice(0, 5),
            futurePrecautions: parsed.futurePrecautions.slice(0, 5),
            recommendedActions: parsed.recommendedActions.slice(0, 5),
          };
        }
      }
    }
  } catch (error) {
    console.error("Failed to generate AI recommendations:", error);
  }

  // Fallback
  return {
    insight: "Unable to generate a full AI analysis at this time.",
    mainProblems: ["Data processing error or incomplete information"],
    stepByStepActions: [
      "Review your relationship scores manually",
      "Discuss the results with a trusted friend or counselor"
    ],
    futurePrecautions: ["Avoid rushed decisions", "Seek professional guidance if conflicts persist"],
    recommendedActions: ["Contact support for help", "Try the pre‑marriage behavior analysis tool"]
  };
}

// ============================================================
// 2. generatePersonalizedInsights – unchanged (kept as short paragraph)
// ============================================================

export async function generatePersonalizedInsights(
  userProfile: {
    relationship_status: string;
    has_assessments: boolean;
    has_red_flags: boolean;
  }
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    const { relationship_status, has_assessments, has_red_flags } = userProfile;
    if (!has_assessments) {
      return `Welcome! As someone who is ${relationship_status}, we recommend starting with our free Compatibility Quiz to understand your relationship dynamics better.`;
    }
    if (has_red_flags && relationship_status !== 'married') {
      return `We've detected some concerns in your relationship. Before making a lifelong commitment, it's crucial to address these issues. Consider booking a professional session.`;
    }
    if (relationship_status === 'married') {
      return `Marriage is a journey that requires continuous effort. Regular health check-ins and open communication are key to long-term happiness. Keep tracking your progress!`;
    }
    if (relationship_status === 'engaged') {
      return `Congratulations on your engagement! This is the perfect time to heighten your foundation through pre-marriage preparation programs and deep conversations.`;
    }
    return `Understanding your relationship dynamics is the first step. Continue using our tools to build a strong, healthy partnership.`;
  }

  const systemPrompt = `You are an elite relationship coach and psychological profiler. A user is viewing their relationship dashboard. You will receive a brief JSON summary of their profile status.
Your objective: Write a highly personalized, professional, and insightful introductory paragraph (2 to 3 sentences) that speaks directly to the user about their current relationship journey. 

Guidelines:
1. Narrative Flow: Rather than dryly stating facts, weave their status into an encouraging or cautionary narrative. 
2. Tone: Highly empathetic, clear, and very easy to understand. Do NOT use complex words or academic psychology jargon. Speak plainly and simply like a caring friend.
3. Action-Oriented Context: 
   - If they have no assessments, warmly guide them to begin self-discovery.
   - If they have red flags, introduce a tone of serious reflection without causing panic, emphasizing the need for professional clarity before further commitment.
   - If they are married or engaged and doing well, reinforce the concept of continuous maintenance and growth.
4. Output format: Return pure text. No greetings like "Hello User", just the singular insight paragraph directly addressed to them. Provide nothing else.`;

  const userPrompt = `Profile Status:
${JSON.stringify(userProfile, null, 2)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }
  } catch (error) {
    console.error("Failed to generate personalized insights:", error);
  }

  return `Understanding your relationship dynamics is the first step. Continue using our tools to build a strong, healthy partnership.`;
}

// ============================================================
// 3. generateRelationshipAnalysisWithGemini – returns SolutionReport
// ============================================================

const relationshipSystemPrompt = `You are a highly analytical relationship assessment expert.

Your role is to produce a **clinical solution report** based on the user's assessment data. Do not comfort or generalize. Be direct and evidence‑based.

Output must be valid JSON with exactly these fields:
{
  "insight": "string (max 30 words)",
  "mainProblems": ["string", "string", ...],
  "stepByStepActions": ["string", "string", ...],
  "futurePrecautions": ["string", "string", ...],
  "recommendedActions": ["string", "string", ...]
}

Rules:
- Every claim must be backed by the provided scores, risk flags, mismatches, or text answers.
- If a serious mismatch or high risk is present, the future precautions must include "Consider postponing major life decisions" or "Seek couples therapy".
- Step‑by‑step actions must be concrete and measurable (e.g., "Every evening, each partner shares one appreciation and one concern").
- Maximum 5 items per array. Keep language VERY SIMPLE, easy to understand, and avoid complex psychological words.`;

const buildRelationshipUserPrompt = (input: GeminiRelationshipInput): string => {
  const categoryLines = Object.entries(input.categoryScores)
    .map(([key, value]) => `- ${key}: ${value}%`)
    .join('\n');

  const risks = input.riskFlags.length > 0 ? input.riskFlags.join('; ') : 'None identified';
  const mismatches = input.mismatches.length > 0 ? input.mismatches.join('; ') : 'No major mismatch recorded';
  const textAnswers = input.keyTextAnswers.length > 0 ? input.keyTextAnswers.join('\n') : 'No one-line answers captured';

  return `Analyze the following relationship assessment data.

### 1. FINAL SCORE
${input.finalScore}%

### 2. CATEGORY SCORES
${categoryLines}

### 3. RISK FLAGS
${risks}

### 4. KEY MISMATCHES
${mismatches}

### 5. TEXT RESPONSES (IMPORTANT CONTEXT)
${textAnswers}

---

Generate a solution report following the JSON structure specified in the system instruction.`;
};

export async function generateRelationshipAnalysisWithGemini(
  input: GeminiRelationshipInput
): Promise<SolutionReport | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: relationshipSystemPrompt }] },
          contents: [{ parts: [{ text: buildRelationshipUserPrompt(input) }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      if (parsed.insight && Array.isArray(parsed.mainProblems)) {
        return {
          insight: parsed.insight,
          mainProblems: parsed.mainProblems.slice(0, 5),
          stepByStepActions: parsed.stepByStepActions.slice(0, 5),
          futurePrecautions: parsed.futurePrecautions.slice(0, 5),
          recommendedActions: parsed.recommendedActions.slice(0, 5),
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// 4. scoreOneLineSimilarityWithGemini – unchanged
// ============================================================

export async function scoreOneLineSimilarityWithGemini(
  answerA: string,
  answerB: string
): Promise<number | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: 'Score semantic similarity between two relationship answers. Return only one numeric value: 1 for same meaning, 0.5 for related meaning, 0 for different meaning. Output must be exactly one of: 1, 0.5, 0.',
              },
            ],
          },
          contents: [{ parts: [{ text: `Answer A: ${answerA}\nAnswer B: ${answerB}` }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 10 },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    if (text === '1') return 1;
    if (text === '0.5') return 0.5;
    if (text === '0') return 0;
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// 5. analyzePreMarriageBehaviorWithGemini – extended with solution fields
// ============================================================

export async function analyzePreMarriageBehaviorWithGemini(
  behaviorText: string,
  incidentText: string
): Promise<PreMarriageAnalysisResult | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are an expert behavioral psychologist analyzing pre‑marriage behavior.

Output a JSON object with this structure:
{
  "redFlagPercentage": number (0-100),
  "personalityTraits": [{"trait": string, "type": "positive" | "negative"}],
  "analysisExplanation": string (detailed paragraph),
  "insight": string (one‑sentence core takeaway),
  "mainProblems": [string],
  "stepByStepActions": [string],
  "futurePrecautions": [string],
  "recommendedActions": [string]
}

Guidelines:
- Be critical and objective. If redFlagPercentage > 60, at least one future precaution MUST explicitly advise professional evaluation before engagement/marriage.
- Step‑by‑step actions must be concrete behaviors the user can practice (e.g., "Set a boundary by stating: When you raise your voice, I will leave the room").
- Keep each array to max 5 items.
- Keep language VERY SIMPLE, easy to understand, and avoid complex psychological words. Explain like you're talking to a friend.`;

  const userPrompt = `Analyze the following inputs:
General Behavior: ${behaviorText}
Recent Incident: ${incidentText}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      // Ensure all required fields exist
      return {
        redFlagPercentage: parsed.redFlagPercentage ?? 50,
        personalityTraits: Array.isArray(parsed.personalityTraits) ? parsed.personalityTraits : [],
        analysisExplanation: parsed.analysisExplanation ?? "Analysis unavailable.",
        insight: parsed.insight ?? "Review the behavior patterns carefully.",
        mainProblems: Array.isArray(parsed.mainProblems) ? parsed.mainProblems.slice(0, 5) : [],
        stepByStepActions: Array.isArray(parsed.stepByStepActions) ? parsed.stepByStepActions.slice(0, 5) : [],
        futurePrecautions: Array.isArray(parsed.futurePrecautions) ? parsed.futurePrecautions.slice(0, 5) : [],
        recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions.slice(0, 5) : [],
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to analyze pre-marriage behavior:", error);
    return null;
  }
}

// ============================================================
// 6. analyzeConflictWithGemini – Conflict Resolution AI
// ============================================================

export type ConflictResolutionReport = {
  conflictType: string;
  severityLevel: 'critical' | 'moderate' | 'mild';
  rootCauseAnalysis: string;
  partnerARole: string;
  partnerBRole: string;
  deEscalationScript: string[];
  repairTriggers: string[];
  weeklyActionPlan: { week: number; goal: string; actions: string[] }[];
  warningSignals: string[];
  insight: string;
};

export async function analyzeConflictWithGemini(
  whatHappened: string,
  userReaction: string,
  partnerReaction: string,
  trigger: string,
  frequency: string,
  intensity: string
): Promise<ConflictResolutionReport | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are an elite, Gottman-informed couples conflict resolution therapist.

Your task is to dissect a specific relationship conflict and produce a highly structured, clinical resolution plan. You are not generic. You pinpoint exact behaviors and provide word-for-word scripts.

Output a JSON object matching this EXACT structure:
{
  "conflictType": "string (e.g., Power Struggle, Emotional Withdrawal, Core Value Clash)",
  "severityLevel": "critical" | "moderate" | "mild",
  "rootCauseAnalysis": "string (2-3 clinical sentences explaining the underlying unmet needs)",
  "partnerARole": "string (What the user is doing in the dynamic)",
  "partnerBRole": "string (What the partner is doing in the dynamic)",
  "deEscalationScript": ["string (exact phrase to say mid-argument)"],
  "repairTriggers": ["string (things to say/do AFTER the fight to reconnect)"],
  "weeklyActionPlan": [
    { "week": 1, "goal": "string", "actions": ["string"] },
    { "week": 2, "goal": "string", "actions": ["string"] },
    { "week": 3, "goal": "string", "actions": ["string"] },
    { "week": 4, "goal": "string", "actions": ["string"] }
  ],
  "warningSignals": ["string (signs that require professional therapy)"],
  "insight": "string (one-line clinical takeaway)"
}

Guidelines:
- Analyze the user's vs partner's reaction to diagnose the 'dance' (e.g., pursue-withdraw).
- "deEscalationScript" must be 4-5 exact, copy-paste phrases using "I" statements.
- Keep arrays to max 5 items. The weeklyActionPlan MUST have exactly 4 weeks.
- Use VERY SIMPLE English. Do not use complex psychological terms, jargon, or academic words. Explain the conflict like you're talking to a friend.`;

  const userPrompt = `Analyze the following conflict scenario:
1. Trigger: ${trigger}
2. What Happened: ${whatHappened}
3. User's Reaction: ${userReaction}
4. Partner's Reaction: ${partnerReaction}
5. Frequency: ${frequency}
6. Emotional Intensity: ${intensity}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API Error:', await response.text());
      return null;
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      try {
        text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}') + 1;
        if (startIdx >= 0 && endIdx > startIdx) {
          text = text.substring(startIdx, endIdx);
        }
        const parsed = JSON.parse(text);
        return {
          conflictType: parsed.conflictType || 'Communication Breakdown',
          severityLevel: parsed.severityLevel || 'moderate',
          rootCauseAnalysis: parsed.rootCauseAnalysis || 'Unable to determine root cause.',
          partnerARole: parsed.partnerARole || 'Reaction pattern not clearly stated.',
          partnerBRole: parsed.partnerBRole || 'Reaction pattern not clearly stated.',
          deEscalationScript: Array.isArray(parsed.deEscalationScript) ? parsed.deEscalationScript.slice(0, 5) : [],
          repairTriggers: Array.isArray(parsed.repairTriggers) ? parsed.repairTriggers.slice(0, 5) : [],
          weeklyActionPlan: Array.isArray(parsed.weeklyActionPlan) ? parsed.weeklyActionPlan.slice(0, 4) : [],
          warningSignals: Array.isArray(parsed.warningSignals) ? parsed.warningSignals.slice(0, 5) : [],
          insight: parsed.insight || 'Focus on active listening and pause before reacting.',
        } as ConflictResolutionReport;
      } catch (e) {
        console.error("JSON parse failed in analyzeConflict. Raw text:", text, "Error:", e);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to analyze conflict:", error);
    return null;
  }
}

// ============================================================
// 7. Couple Pulse – Hybrid Scoring Pipeline
//    Phase 1: Local math scoring from ratings/toggles
//    Phase 2: AI similarity checking between partner answers
//    Phase 3: AI narrative synthesis (Gemini)
// ============================================================

// ── Types ────────────────────────────────────────────────────────

export type PulsePartnerResponses = {
  // Stage 1: Connection
  connection_rating: number;       // 1–10
  valued_action: string;
  intentional_time: boolean;
  emotional_highlight: string;     // best emotional moment this week
  // Stage 2: Responsibility
  tasks_handled: string;
  workload_fair: boolean;
  workload_explanation: string;
  partner_effort_acknowledgment: string; // what you appreciate about partner's effort
  // Stage 3: Trust
  insecurity_triggers: string;
  boundaries_crossed: boolean;
  boundaries_explanation: string;
  hidden_anything: boolean;
  // Stage 4: Emotional Intimacy
  intimacy_rating: number;         // 1–10
  vulnerability_shared: boolean;
  felt_heard: boolean;
  wish_partner_knew: string;       // "I wish my partner knew…"
  // Stage 5: Growth & Appreciation
  gratitude_message: string;       // direct message of appreciation
  improvement_suggestion: string;  // something partner could do better
  growing_together: boolean;
  relationship_goal: string;       // goal for next week
};

export type SimilarityPair = {
  label: string;
  partnerA: string;
  partnerB: string;
  score: number;  // 0 | 0.5 | 1
};

export type PillarScore = {
  name: string;
  localScore: number;        // 0–100 from math
  alignmentScore: number;    // 0–100 from similarity
  finalScore: number;        // weighted combo
  status: 'strong' | 'stable' | 'needs-attention' | 'critical';
};

export type PulseCheckReport = {
  // Per-pillar scores
  pillars: PillarScore[];
  // Aggregate scores
  connection_score: number;
  responsibility_score: number;
  trust_score: number;
  intimacy_score: number;
  growth_score: number;
  overall_pulse: number;
  // Responsibility balance
  responsibility_balance: {
    partner_a_percent: number;
    partner_b_percent: number;
    imbalance_detected: boolean;
  };
  // Partner alignment
  alignment_score: number;       // 0–100 overall alignment
  similarity_pairs: SimilarityPair[];
  discrepancies: string[];       // human-readable discrepancy warnings
  // AI narrative output
  top_issues: string[];
  positive_behaviors: string[];
  weekly_actions: string[];
  emotional_summary: string;     // 2–3 sentence emotional narrative
  insight: string;               // one-liner core takeaway
  love_note_suggestion: string;  // a suggested message to send to partner
};

// ── Phase 1: Local Math Scoring ──────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function computeLocalConnectionScore(a: PulsePartnerResponses, b: PulsePartnerResponses): number {
  const avgRating = ((a.connection_rating + b.connection_rating) / 2) * 10; // 0-100
  const timePenalty = (!a.intentional_time && !b.intentional_time) ? -15 : (!a.intentional_time || !b.intentional_time) ? -7 : 0;
  const valuedBonus = (a.valued_action.trim().length > 10 && b.valued_action.trim().length > 10) ? 5 : 0;
  const highlightBonus = (a.emotional_highlight.trim().length > 10 && b.emotional_highlight.trim().length > 10) ? 5 : 0;
  return clamp(avgRating + timePenalty + valuedBonus + highlightBonus);
}

function computeLocalResponsibilityScore(a: PulsePartnerResponses, b: PulsePartnerResponses): { score: number; aPercent: number; bPercent: number; imbalance: boolean } {
  let score = 70; // baseline
  const bothFair = a.workload_fair && b.workload_fair;
  const neitherFair = !a.workload_fair && !b.workload_fair;
  const oneFair = a.workload_fair !== b.workload_fair;

  if (bothFair) score += 20;
  else if (neitherFair) score -= 25;
  else if (oneFair) score -= 15;

  const ackBonus = (a.partner_effort_acknowledgment.trim().length > 10 && b.partner_effort_acknowledgment.trim().length > 10) ? 10 : 0;
  score += ackBonus;

  // Estimate contribution split (rough heuristic from text length + fairness)
  const aLen = a.tasks_handled.trim().length;
  const bLen = b.tasks_handled.trim().length;
  const total = aLen + bLen || 1;
  let aPercent = clamp(Math.round((aLen / total) * 100));
  let bPercent = 100 - aPercent;

  // Adjust if one partner says unfair
  if (!a.workload_fair && b.workload_fair) { aPercent = Math.min(aPercent + 10, 100); bPercent = 100 - aPercent; }
  if (!b.workload_fair && a.workload_fair) { bPercent = Math.min(bPercent + 10, 100); aPercent = 100 - bPercent; }

  const imbalance = Math.abs(aPercent - bPercent) > 20;
  if (imbalance) score -= 10;

  return { score: clamp(score), aPercent, bPercent, imbalance };
}

function computeLocalTrustScore(a: PulsePartnerResponses, b: PulsePartnerResponses): number {
  let score = 85; // high baseline (trust is precious)
  if (a.hidden_anything) score -= 20;
  if (b.hidden_anything) score -= 20;
  if (a.boundaries_crossed) score -= 15;
  if (b.boundaries_crossed) score -= 15;
  if (a.insecurity_triggers.trim().length > 20) score -= 5;
  if (b.insecurity_triggers.trim().length > 20) score -= 5;
  // Bonus for both feeling secure
  if (a.insecurity_triggers.trim().toLowerCase() === 'nothing' || a.insecurity_triggers.trim().length < 5) score += 5;
  if (b.insecurity_triggers.trim().toLowerCase() === 'nothing' || b.insecurity_triggers.trim().length < 5) score += 5;
  return clamp(score);
}

function computeLocalIntimacyScore(a: PulsePartnerResponses, b: PulsePartnerResponses): number {
  const avgRating = ((a.intimacy_rating + b.intimacy_rating) / 2) * 10;
  let modifier = 0;
  if (a.vulnerability_shared && b.vulnerability_shared) modifier += 10;
  else if (!a.vulnerability_shared && !b.vulnerability_shared) modifier -= 10;
  if (a.felt_heard && b.felt_heard) modifier += 10;
  else if (!a.felt_heard && !b.felt_heard) modifier -= 15;
  else modifier -= 5; // one felt heard, other didn't — discrepancy
  const wishBonus = (a.wish_partner_knew.trim().length > 10 && b.wish_partner_knew.trim().length > 10) ? 5 : 0;
  return clamp(avgRating + modifier + wishBonus);
}

function computeLocalGrowthScore(a: PulsePartnerResponses, b: PulsePartnerResponses): number {
  let score = 60;
  if (a.growing_together && b.growing_together) score += 25;
  else if (!a.growing_together && !b.growing_together) score -= 20;
  else score -= 10;
  const gratitudeBonus = (a.gratitude_message.trim().length > 15 && b.gratitude_message.trim().length > 15) ? 10 : 0;
  const goalBonus = (a.relationship_goal.trim().length > 10 && b.relationship_goal.trim().length > 10) ? 5 : 0;
  return clamp(score + gratitudeBonus + goalBonus);
}

function detectLocalDiscrepancies(a: PulsePartnerResponses, b: PulsePartnerResponses, aName: string, bName: string): string[] {
  const d: string[] = [];
  const ratingDiff = Math.abs(a.connection_rating - b.connection_rating);
  if (ratingDiff >= 3) d.push(`Connection gap: ${aName} rated ${a.connection_rating}/10, ${bName} rated ${b.connection_rating}/10 — a ${ratingDiff}-point difference signals misaligned feelings.`);
  if (a.workload_fair !== b.workload_fair) d.push(`Workload disagreement: One partner feels the split is fair, the other doesn't. This unspoken tension builds resentment over time.`);
  if (a.hidden_anything !== b.hidden_anything) d.push(`Honesty gap: One partner admitted hiding something while the other didn't. Secrets, even small ones, erode trust gradually.`);
  if (a.felt_heard !== b.felt_heard) d.push(`Listening imbalance: One partner felt heard while the other didn't. Feeling unheard is one of the deepest emotional wounds in a relationship.`);
  if (a.growing_together !== b.growing_together) d.push(`Growth misalignment: One partner feels you're growing together, the other doesn't. This points to unspoken disappointments about the relationship's direction.`);
  const intimacyDiff = Math.abs(a.intimacy_rating - b.intimacy_rating);
  if (intimacyDiff >= 3) d.push(`Emotional intimacy gap: ${intimacyDiff}-point difference in closeness ratings. One partner feels significantly more distant than the other.`);
  return d;
}

// ── Phase 2: AI Similarity Checking ──────────────────────────────

async function runSimilarityChecks(
  a: PulsePartnerResponses,
  b: PulsePartnerResponses
): Promise<SimilarityPair[]> {
  const pairs: { label: string; aText: string; bText: string }[] = [
    { label: 'Feeling Valued', aText: a.valued_action, bText: b.valued_action },
    { label: 'Emotional Highlight', aText: a.emotional_highlight, bText: b.emotional_highlight },
    { label: 'Tasks Handled', aText: a.tasks_handled, bText: b.tasks_handled },
    { label: 'Workload Reasoning', aText: a.workload_explanation, bText: b.workload_explanation },
    { label: 'Insecurity Triggers', aText: a.insecurity_triggers, bText: b.insecurity_triggers },
    { label: 'Wish Partner Knew', aText: a.wish_partner_knew, bText: b.wish_partner_knew },
    { label: 'Gratitude Message', aText: a.gratitude_message, bText: b.gratitude_message },
    { label: 'Improvement Ideas', aText: a.improvement_suggestion, bText: b.improvement_suggestion },
  ];

  const results: SimilarityPair[] = [];

  for (const pair of pairs) {
    if (pair.aText.trim().length < 3 || pair.bText.trim().length < 3) {
      results.push({ label: pair.label, partnerA: pair.aText, partnerB: pair.bText, score: 0.5 });
      continue;
    }
    const score = await scoreOneLineSimilarityWithGemini(pair.aText, pair.bText);
    results.push({
      label: pair.label,
      partnerA: pair.aText,
      partnerB: pair.bText,
      score: score ?? 0.5,
    });
  }

  return results;
}

// ── Phase 3: AI Narrative Synthesis ──────────────────────────────

async function generatePulseNarrative(
  aName: string,
  bName: string,
  a: PulsePartnerResponses,
  b: PulsePartnerResponses,
  localScores: { connection: number; responsibility: number; trust: number; intimacy: number; growth: number; overall: number },
  alignment: number,
  discrepancies: string[],
  similarityPairs: SimilarityPair[]
): Promise<{
  top_issues: string[];
  positive_behaviors: string[];
  weekly_actions: string[];
  emotional_summary: string;
  insight: string;
  love_note_suggestion: string;
  responsibility_balance: { partner_a_percent: number; partner_b_percent: number; imbalance_detected: boolean };
} | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const simSummary = similarityPairs
    .map(p => `- ${p.label}: ${p.score === 1 ? 'ALIGNED' : p.score === 0.5 ? 'PARTIALLY ALIGNED' : 'MISALIGNED'} (A: "${p.partnerA.slice(0, 80)}" / B: "${p.partnerB.slice(0, 80)}")`)
    .join('\n');

  const systemPrompt = `You are an emotionally intelligent couples therapist who writes with warmth, clarity, and depth.

You will receive:
1. Both partners' raw responses across 5 relationship pillars
2. Pre-calculated local scores (already computed by the system)
3. AI-detected answer similarity/alignment between partners
4. System-detected discrepancies

Your job is ONLY to synthesize the NARRATIVE — the emotional story, issues, positives, and actions. The numeric scores are already done.

Output MUST be valid JSON with this EXACT structure:
{
  "top_issues": ["string", "string", "string"] (max 4 — be specific, reference actual answers, explain WHY it matters emotionally),
  "positive_behaviors": ["string", "string", "string"] (max 4 — celebrate specific things they did well this week),
  "weekly_actions": ["string", "string", "string"] (exactly 3 — concrete daily/weekly behavioral changes with EXACT scripts like "Say: I noticed you did X today, thank you"),
  "emotional_summary": "string (2-3 sentences — a warm, human narrative about the emotional state of this couple THIS WEEK. Reference their actual words. This should feel like a therapist speaking from the heart.)",
  "insight": "string (one powerful, memorable sentence that captures the couple's core dynamic this week)",
  "love_note_suggestion": "string (a short, heartfelt message one partner could send to the other — use their actual words/context to make it personal)",
  "responsibility_balance": {
    "partner_a_percent": number,
    "partner_b_percent": number,
    "imbalance_detected": boolean
  }
}

CRITICAL GUIDELINES:
- Reference ACTUAL answers from the partners. Quote them. Be specific, not generic.
- If discrepancies exist, the top_issues MUST address them directly.
- If hidden_anything is true for either partner, this MUST appear in top_issues with empathy (not judgment).
- weekly_actions must include exact SCRIPTS — word-for-word things to say or do.
- emotional_summary should feel like a therapist speaking with genuine care, not a report.
- Keep language VERY SIMPLE, warm, and human. No jargon.`;

  const userPrompt = `Here is the complete pulse check data:

### ${aName}'s Responses:
- Connection: ${a.connection_rating}/10 | Intentional time: ${a.intentional_time ? 'Yes' : 'No'}
- Felt valued: "${a.valued_action}"
- Emotional highlight: "${a.emotional_highlight}"
- Tasks handled: "${a.tasks_handled}" | Fair workload: ${a.workload_fair ? 'Yes' : 'No'} — "${a.workload_explanation}"
- Acknowledges partner's effort: "${a.partner_effort_acknowledgment}"
- Insecurity: "${a.insecurity_triggers}" | Boundaries crossed: ${a.boundaries_crossed ? 'Yes' : 'No'} "${a.boundaries_explanation}" | Hid something: ${a.hidden_anything ? 'Yes' : 'No'}
- Emotional closeness: ${a.intimacy_rating}/10 | Shared vulnerability: ${a.vulnerability_shared ? 'Yes' : 'No'} | Felt heard: ${a.felt_heard ? 'Yes' : 'No'}
- Wishes partner knew: "${a.wish_partner_knew}"
- Gratitude: "${a.gratitude_message}" | Improvement: "${a.improvement_suggestion}"
- Growing together: ${a.growing_together ? 'Yes' : 'No'} | Goal: "${a.relationship_goal}"

### ${bName}'s Responses:
- Connection: ${b.connection_rating}/10 | Intentional time: ${b.intentional_time ? 'Yes' : 'No'}
- Felt valued: "${b.valued_action}"
- Emotional highlight: "${b.emotional_highlight}"
- Tasks handled: "${b.tasks_handled}" | Fair workload: ${b.workload_fair ? 'Yes' : 'No'} — "${b.workload_explanation}"
- Acknowledges partner's effort: "${b.partner_effort_acknowledgment}"
- Insecurity: "${b.insecurity_triggers}" | Boundaries crossed: ${b.boundaries_crossed ? 'Yes' : 'No'} "${b.boundaries_explanation}" | Hid something: ${b.hidden_anything ? 'Yes' : 'No'}
- Emotional closeness: ${b.intimacy_rating}/10 | Shared vulnerability: ${b.vulnerability_shared ? 'Yes' : 'No'} | Felt heard: ${b.felt_heard ? 'Yes' : 'No'}
- Wishes partner knew: "${b.wish_partner_knew}"
- Gratitude: "${b.gratitude_message}" | Improvement: "${b.improvement_suggestion}"
- Growing together: ${b.growing_together ? 'Yes' : 'No'} | Goal: "${b.relationship_goal}"

### Pre-Computed Scores:
- Connection: ${localScores.connection}% | Responsibility: ${localScores.responsibility}% | Trust: ${localScores.trust}%
- Emotional Intimacy: ${localScores.intimacy}% | Growth: ${localScores.growth}% | Overall: ${localScores.overall}%
- Partner Alignment Score: ${alignment}%

### Answer Similarity Analysis:
${simSummary}

### Detected Discrepancies:
${discrepancies.length > 0 ? discrepancies.join('\n') : 'None detected.'}

Generate the narrative synthesis JSON now.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini Pulse Narrative Error:', await response.text());
      return null;
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const s = text.indexOf('{');
      const e = text.lastIndexOf('}') + 1;
      if (s >= 0 && e > s) text = text.substring(s, e);
      const p = JSON.parse(text);
      return {
        top_issues: Array.isArray(p.top_issues) ? p.top_issues.slice(0, 4) : [],
        positive_behaviors: Array.isArray(p.positive_behaviors) ? p.positive_behaviors.slice(0, 4) : [],
        weekly_actions: Array.isArray(p.weekly_actions) ? p.weekly_actions.slice(0, 3) : [],
        emotional_summary: p.emotional_summary || '',
        insight: p.insight || '',
        love_note_suggestion: p.love_note_suggestion || '',
        responsibility_balance: {
          partner_a_percent: clamp(p.responsibility_balance?.partner_a_percent ?? 50),
          partner_b_percent: clamp(p.responsibility_balance?.partner_b_percent ?? 50),
          imbalance_detected: p.responsibility_balance?.imbalance_detected ?? false,
        },
      };
    }
    return null;
  } catch (error) {
    console.error("Pulse narrative synthesis failed:", error);
    return null;
  }
}

// ── Orchestrator: Full Pipeline ──────────────────────────────────

function pillarStatus(score: number): 'strong' | 'stable' | 'needs-attention' | 'critical' {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'stable';
  if (score >= 40) return 'needs-attention';
  return 'critical';
}

export type PulseProgressCallback = (phase: string, detail: string) => void;

export async function runCouplePulsePipeline(
  aName: string,
  bName: string,
  a: PulsePartnerResponses,
  b: PulsePartnerResponses,
  onProgress?: PulseProgressCallback
): Promise<PulseCheckReport | null> {
  try {
    // ── Phase 1: Local scoring ──
    onProgress?.('scoring', 'Computing relationship scores from your answers…');
    const conn = computeLocalConnectionScore(a, b);
    const resp = computeLocalResponsibilityScore(a, b);
    const trust = computeLocalTrustScore(a, b);
    const intimacy = computeLocalIntimacyScore(a, b);
    const growth = computeLocalGrowthScore(a, b);
    const discrepancies = detectLocalDiscrepancies(a, b, aName, bName);

    // ── Phase 2: AI similarity ──
    onProgress?.('similarity', 'Comparing partner answers for alignment…');
    const simPairs = await runSimilarityChecks(a, b);
    const avgSim = simPairs.reduce((sum, p) => sum + p.score, 0) / (simPairs.length || 1);
    const alignmentScore = clamp(Math.round(avgSim * 100));

    // Blend alignment into pillar scores (30% alignment weight)
    const blend = (local: number): number => clamp(Math.round(local * 0.7 + alignmentScore * 0.3));
    const connFinal = blend(conn);
    const respFinal = blend(resp.score);
    const trustFinal = blend(trust);
    const intimacyFinal = blend(intimacy);
    const growthFinal = blend(growth);
    const overallPulse = clamp(Math.round((connFinal + respFinal + trustFinal + intimacyFinal + growthFinal) / 5));

    // ── Phase 3: AI narrative synthesis ──
    onProgress?.('narrative', 'Gemini is writing your emotional pulse report…');
    const narrative = await generatePulseNarrative(
      aName, bName, a, b,
      { connection: connFinal, responsibility: respFinal, trust: trustFinal, intimacy: intimacyFinal, growth: growthFinal, overall: overallPulse },
      alignmentScore,
      discrepancies,
      simPairs
    );

    const pillars: PillarScore[] = [
      { name: 'Connection', localScore: conn, alignmentScore, finalScore: connFinal, status: pillarStatus(connFinal) },
      { name: 'Responsibility', localScore: resp.score, alignmentScore, finalScore: respFinal, status: pillarStatus(respFinal) },
      { name: 'Trust', localScore: trust, alignmentScore, finalScore: trustFinal, status: pillarStatus(trustFinal) },
      { name: 'Emotional Intimacy', localScore: intimacy, alignmentScore, finalScore: intimacyFinal, status: pillarStatus(intimacyFinal) },
      { name: 'Growth', localScore: growth, alignmentScore, finalScore: growthFinal, status: pillarStatus(growthFinal) },
    ];

    return {
      pillars,
      connection_score: connFinal,
      responsibility_score: respFinal,
      trust_score: trustFinal,
      intimacy_score: intimacyFinal,
      growth_score: growthFinal,
      overall_pulse: overallPulse,
      responsibility_balance: narrative?.responsibility_balance ?? { partner_a_percent: resp.aPercent, partner_b_percent: resp.bPercent, imbalance_detected: resp.imbalance },
      alignment_score: alignmentScore,
      similarity_pairs: simPairs,
      discrepancies,
      top_issues: narrative?.top_issues ?? (discrepancies.length > 0 ? discrepancies.slice(0, 3) : ['No major issues detected this week.']),
      positive_behaviors: narrative?.positive_behaviors ?? ['Partners completed the pulse check together — that itself shows commitment.'],
      weekly_actions: narrative?.weekly_actions ?? ['Have a 10-minute check-in every evening this week.', 'Express one specific appreciation to your partner each day.', 'Schedule one intentional quality-time activity together.'],
      emotional_summary: narrative?.emotional_summary ?? 'Your relationship shows a mix of strengths and growth areas this week. Continue building on the positive moments.',
      insight: narrative?.insight ?? 'Reviewing your relationship together is already a sign of care.',
      love_note_suggestion: narrative?.love_note_suggestion ?? `"I appreciate you doing this pulse check with me. It shows we're both invested in us."`,
    };
  } catch (error) {
    console.error("Couple Pulse pipeline failed:", error);
    return null;
  }
}