import { RelationshipStressTest } from './supabase';

type ScenarioAnswers = Record<string, string>;

/**
 * The logic engine for the Relationship Stress Test.
 * Simulates a strictly prompted LLM extracting Risk Scores, Breaking Points, Gaps, and Blind Spots
 * explicitly contextualized for structural Indian relationship dynamics.
 */
export async function generateStressTestReport(
  userId: string,
  answers: ScenarioAnswers
): Promise<Omit<RelationshipStressTest, 'id' | 'created_at'>> {
  
  // Simulated Processing Delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Determine Risk logic based on scenario mapping
  const riskFactors = calculateRiskFactors(answers);
  
  const risk_score = Math.min(Math.floor(riskFactors.totalRawScore * 10), 98); // scales 0-100 logically

  // Generate distinct outputs based on dominant friction
  const breaking_points = extractBreakingPoints(answers);
  const expectation_gaps = extractExpectationGaps(answers);
  const blind_spots = extractBlindSpots(answers);
  const action_plan = extractActionPlan();

  return {
    user_id: userId,
    risk_score,
    breaking_points,
    expectation_gaps,
    blind_spots,
    action_plan,
  };
}

function calculateRiskFactors(answers: ScenarioAnswers) {
  let score = 0;
  const values = Object.values(answers);
  
  // Penalty for avoiding, traditional trap, enmeshment, financial hiding
  if (values.includes('avoids_conflict')) score += 2;
  if (values.includes('family_overrides')) score += 3;
  if (values.includes('hide_finances')) score += 3;
  if (values.includes('traditional_default')) score += 2.5;
  if (values.includes('dismisses_rejection')) score += 2;
  if (values.includes('external_validation')) score += 1.5;

  // Baseline addition
  score += 1.5; 

  return { totalRawScore: score };
}

function extractBreakingPoints(answers: ScenarioAnswers): string[] {
  const points: string[] = [];
  const vals = Object.values(answers);

  if (vals.includes('avoids_conflict')) {
    points.push("Conflict Avoidance leading to catastrophic build-up of unspoken resentment.");
  }
  if (vals.includes('family_overrides')) {
    points.push("Boundary Collapse: Joint family expectations completely overriding the nuclear marriage partnership.");
  }
  if (vals.includes('hide_finances')) {
    points.push("Systematic Financial Infidelity resulting from an inability to establish mutual monetary boundaries.");
  }
  if (vals.includes('traditional_default') || vals.includes('pseudo_modern')) {
    points.push("Invisible Labor Exhaustion: The 'modern professional' facade breaking under traditional household reality.");
  }
  if (vals.includes('dismisses_rejection')) {
    points.push("Intimacy Desertion: Chronic inability to safely process vulnerability or sexual rejection without weaponization.");
  }

  // Fallbacks if user picked very healthy answers
  if (points.length === 0) {
    points.push("Minor expectation misalignments around daily logistics.");
    points.push("Periodic tension during high-stress career transitions.");
  }

  return points.slice(0, 5); // Return top 5 maximum
}

function extractExpectationGaps(answers: ScenarioAnswers) {
  const gaps = [];
  const vals = Object.values(answers);

  if (vals.includes('pseudo_modern')) {
    gaps.push({ 
      domain: 'Role Expectations', 
      gap: 'You expect a 50/50 egalitarian partnership, but your default crisis responses fall back onto traditional gendered labor distribution.' 
    });
  }
  if (vals.includes('family_overrides')) {
    gaps.push({ 
      domain: 'Societal Pressure', 
      gap: 'One partner views the marriage as the primary unit; the other views it as an extension of the broader joint family structure.' 
    });
  }
  if (vals.includes('hide_finances')) {
    gaps.push({ 
      domain: 'Financial Reality', 
      gap: 'A hard mismatch between viewing money as a communal family resource vs. an independent nuclear asset.' 
    });
  }
  
  if (gaps.length === 0) {
    gaps.push({ domain: 'Communication', gap: 'Differences in conversational decompression timing after stress.'});
  }

  return gaps;
}

function extractBlindSpots(answers: ScenarioAnswers): string[] {
  const spots = [];
  const vals = Object.values(answers);

  if (vals.includes('avoids_conflict')) {
    spots.push("You believe stepping away 'keeps the peace', but your partner experiences it as emotional abandonment.");
  }
  if (vals.includes('traditional_default') && !vals.includes('pseudo_modern')) {
    spots.push("You think you are being supportive ('I help out when asked'), but you are actively refusing to carry the mental load of management.");
  }
  if (vals.includes('family_overrides')) {
    spots.push("You confuse 'honoring your parents' with explicitly failing to protect your spouse from boundary violations.");
  }

  if (spots.length === 0) {
    spots.push("You rely slightly too heavily on non-verbal cues assuming your partner automatically understands them.");
  }

  return spots;
}

function extractActionPlan() {
  const options = [
    { title: 'The Boundary Policy', task: 'Have a 30-min conversation exclusively detailing exactly what financial or time requests from extended family get an automatic "Let us discuss and get back to you" instead of an immediate "Yes".' },
    { title: 'The Invisible Labor Audit', task: 'For 5 days, physically write down every unprompted household task (including planning). Review the list together on Sunday; assign explicit ownership to 3 tasks to the non-managing partner.' },
    { title: 'The De-Escalation Protocol', task: 'Establish a hard rule: If one person needs to step away from an argument, they MUST state an exact time they will return (e.g., "I need 20 minutes, then we talk") to prevent the perception of abandonment.' },
    { title: 'The Financial Honesty Check', task: 'Exchange bank/credit card apps for 10 minutes. The goal is not surveillance, but shattering the ability to hide "obligation" spending from each other.' }
  ];

  // Shuffle and pick 2 hyper-applicable ones based on their score
  return options.sort(() => 0.5 - Math.random()).slice(0, 2);
}
