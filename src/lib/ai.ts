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
- Keep language professional, empathetic, and precise.`;

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
2. Tone: Highly empathetic, authoritative, and sophisticated. Use the tone of a premium, exclusive relationship counselor.
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
- Maximum 5 items per array. Keep language professional and concise.`;

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
- Keep each array to max 5 items.`;

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
- Keep arrays to max 5 items. The weeklyActionPlan MUST have exactly 4 weeks.`;

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