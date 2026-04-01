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

export async function getAIRecommendations(
  assessmentData?: AssessmentData,
  redFlagData?: RedFlagData,
  healthData?: HealthData
): Promise<string[]> {
  const recommendations: string[] = [];

  if (assessmentData) {
    if (assessmentData.total_score < 50) {
      recommendations.push('Consider booking a 1:1 Decision Clarity Session to address compatibility concerns');
      recommendations.push('Focus on improving communication and understanding core values differences');
    } else if (assessmentData.total_score < 75) {
      recommendations.push('Work on strengthening areas with lower scores through targeted discussions');
      recommendations.push('Consider the Pre-Marriage Readiness Program for comprehensive preparation');
    } else {
      recommendations.push('Your compatibility looks strong! Continue nurturing your relationship');
      recommendations.push('Consider taking the advanced assessment for deeper insights');
    }

    if (assessmentData.values_score < 60) {
      recommendations.push('Values alignment is crucial - have deep conversations about life goals and beliefs');
    }

    if (assessmentData.communication_score < 60) {
      recommendations.push('Improve communication skills through structured couple discussions');
    }

    if (assessmentData.lifestyle_score < 60) {
      recommendations.push('Discuss daily routines, social needs, and expectations about future lifestyle');
    }
  }

  if (redFlagData) {
    if (redFlagData.high_severity > 0) {
      recommendations.push('URGENT: High severity red flags detected - seek professional guidance immediately');
      recommendations.push('Consider postponing major commitments until these issues are addressed');
    }

    if (redFlagData.medium_severity >= 3) {
      recommendations.push('Multiple medium-severity concerns detected - book a Red Flag Deep Analysis');
      recommendations.push('Have honest conversations about these patterns and behaviors');
    }

    if (redFlagData.categories.includes('Emotional Control')) {
      recommendations.push('Emotional regulation issues require professional help - consider therapy or counseling');
    }

    if (redFlagData.categories.includes('Honesty')) {
      recommendations.push('Trust is foundational - address honesty concerns before proceeding');
    }
  }

  if (healthData) {
    if (healthData.overall_score < 50) {
      recommendations.push('Your relationship health needs attention - consider Crisis Recovery Plan');
      recommendations.push('Focus on rebuilding emotional connection and communication');
    } else if (healthData.overall_score < 70) {
      recommendations.push('Moderate health - work on specific areas through targeted programs');
      recommendations.push('Regular check-ins and couple activities can help improve connection');
    } else {
      recommendations.push('Great relationship health! Maintain momentum through ongoing care');
    }

    if (healthData.emotional_score < 60) {
      recommendations.push('Rebuild emotional intimacy through vulnerability exercises and quality time');
    }

    if (healthData.communication_score < 60) {
      recommendations.push('Enroll in Conflict Resolution Program to improve communication patterns');
    }

    if (healthData.intimacy_score < 60) {
      recommendations.push('Consider Emotional Intimacy Rebuild program for deeper connection');
    }

    if (healthData.conflict_score < 60) {
      recommendations.push('Learn constructive conflict resolution techniques through coaching');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep monitoring your relationship health regularly');
    recommendations.push('Explore our services to continue strengthening your bond');
  }

  return recommendations.slice(0, 5);
}

export async function generatePersonalizedInsights(
  userProfile: {
    relationship_status: string;
    has_assessments: boolean;
    has_red_flags: boolean;
  }
): Promise<string> {
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
    return `Congratulations on your engagement! This is the perfect time to strengthen your foundation through pre-marriage preparation programs and deep conversations.`;
  }

  return `Understanding your relationship dynamics is the first step. Continue using our tools to build a strong, healthy partnership.`;
}
