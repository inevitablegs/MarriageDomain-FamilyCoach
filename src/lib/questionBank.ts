export type QuestionType = 'MCQ' | 'MSQ' | 'One-line';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type Category =
  | 'Communication'
  | 'Financial'
  | 'Emotional'
  | 'Family'
  | 'Lifestyle'
  | 'Values'
  | 'Life Goals';

export type AssessmentQuestion = {
  id: string;
  sourceQNo: number;
  type: QuestionType;
  category: Category;
  riskLevel: RiskLevel;
  riskWeight: number;
  prompt: string;
  riskDescription: string;
  options?: string[];
};

export const RISK_WEIGHT: Record<RiskLevel, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const riskText: Record<RiskLevel, string> = {
  High: 'Critical mismatch can cause long-term conflict or breakup.',
  Medium: 'Mismatch may create recurring friction.',
  Low: 'Mismatch has minor or manageable impact.',
};

const q = (
  sourceQNo: number,
  type: QuestionType,
  category: Category,
  riskLevel: RiskLevel,
  prompt: string,
  options?: string[]
): AssessmentQuestion => ({
  id: `q${sourceQNo}`,
  sourceQNo,
  type,
  category,
  riskLevel,
  riskWeight: RISK_WEIGHT[riskLevel],
  prompt,
  riskDescription: riskText[riskLevel],
  options,
});

export const QUESTION_BANK: AssessmentQuestion[] = [
  q(1, 'One-line', 'Life Goals', 'Low', 'What are your top 3 life priorities in the next 5 years?'),
  q(2, 'MCQ', 'Communication', 'Low', 'How do you react when someone disagrees with you?', ['Calm discussion', 'Avoid', 'Argue', 'Get defensive']),
  q(3, 'MCQ', 'Financial', 'Medium', 'Which financial habit best describes you?', ['Saver', 'Balanced', 'Spender', 'No planning']),
  q(4, 'MSQ', 'Values', 'Low', 'Select what matters most in a partner.', ['Respect', 'Loyalty', 'Attraction', 'Status', 'Money']),
  q(5, 'MCQ', 'Emotional', 'High', 'How do you handle stress in relationship contexts?', ['Talk', 'Withdraw', 'Work harder', 'Get irritated']),
  q(6, 'One-line', 'Values', 'Medium', 'What are your non-negotiables in a relationship?'),
  q(7, 'MCQ', 'Family', 'Low', 'Do you prefer joint or nuclear family living after marriage?', ['Joint', 'Nuclear', 'Flexible', 'Undecided']),
  q(8, 'MCQ', 'Values', 'Low', 'How important is religion in your daily life decisions?', ['Very', 'Moderate', 'Low', 'None']),
  q(9, 'MSQ', 'Emotional', 'Medium', 'How do you show and receive love?', ['Words', 'Time', 'Gifts', 'Support', 'Physical']),
  q(10, 'MCQ', 'Emotional', 'High', 'How do you handle failure?', ['Reflect', 'Blame', 'Ignore', 'Overthink']),
  q(11, 'One-line', 'Values', 'Low', 'What does respect mean to you in a relationship?'),
  q(12, 'MCQ', 'Communication', 'Medium', 'How often do you expect communication?', ['Constant', 'Daily', 'Occasional', 'Minimal']),
  q(13, 'MCQ', 'Financial', 'Low', 'Do you discuss money openly with your partner?', ['Yes', 'Sometimes', 'Rarely', 'No']),
  q(14, 'One-line', 'Life Goals', 'Low', 'What are your core career goals?'),
  q(15, 'MCQ', 'Communication', 'High', 'How do you react to criticism from your partner?', ['Accept', 'Defend', 'Ignore', 'Attack']),
  q(16, 'MSQ', 'Communication', 'Low', 'Select your conflict style.', ['Avoid', 'Discuss', 'Fight', 'Delay']),
  q(17, 'MCQ', 'Lifestyle', 'Low', 'How important is personal space to you?', ['High', 'Medium', 'Low', 'None']),
  q(18, 'One-line', 'Lifestyle', 'Medium', 'What habits of yours might annoy a partner?'),
  q(19, 'One-line', 'Values', 'Low', 'How do you define loyalty?'),
  q(20, 'MCQ', 'Family', 'High', 'Do you expect your partner to change after marriage?', ['Yes', 'No', 'Maybe', 'Depends']),
  q(21, 'MCQ', 'Emotional', 'Medium', 'How do you handle anger?', ['Control', 'Express', 'Suppress', 'Explode']),
  q(22, 'MCQ', 'Family', 'Low', 'What role should parents play in couple decisions?', ['High', 'Medium', 'Low', 'None']),
  q(23, 'MSQ', 'Values', 'Low', 'Select your relationship deal-breakers.', ['Dishonesty', 'Addiction', 'Disrespect', 'Control']),
  q(24, 'One-line', 'Lifestyle', 'Medium', 'How do you like to spend your free time?'),
  q(25, 'MCQ', 'Life Goals', 'High', 'Do you prioritize career or family when both conflict?', ['Career', 'Family', 'Balance', 'Unsure']),
  q(26, 'MCQ', 'Values', 'Low', 'How do you make important decisions?', ['Logical', 'Emotional', 'Mixed', 'Impulsive']),
  q(27, 'MCQ', 'Lifestyle', 'Medium', 'How important is social life for you?', ['High', 'Medium', 'Low', 'None']),
  q(28, 'MCQ', 'Values', 'Low', 'Do you believe in strict gender roles?', ['Strongly', 'Moderate', 'Low', 'None']),
  q(29, 'MCQ', 'Communication', 'Low', 'How do you express frustration?', ['Talk', 'Silent', 'Anger', 'Ignore']),
  q(30, 'One-line', 'Emotional', 'High', 'What is your biggest fear in marriage?'),
  q(31, 'MCQ', 'Emotional', 'Low', 'Do you forgive easily?', ['Yes', 'Sometimes', 'Rarely', 'No']),
  q(32, 'MCQ', 'Emotional', 'Low', 'How do you handle jealousy?', ['Communicate', 'Ignore', 'React', 'Control']),
  q(33, 'MSQ', 'Life Goals', 'Medium', 'Select important life goals for your future.', ['Wealth', 'Family', 'Travel', 'Growth']),
  q(34, 'MCQ', 'Values', 'Low', 'Do you value independence in marriage?', ['High', 'Medium', 'Low', 'None']),
  q(35, 'MCQ', 'Communication', 'High', 'How do you respond under pressure?', ['Calm', 'Stress', 'Avoid', 'Aggressive']),
  q(36, 'One-line', 'Values', 'Medium', 'What does commitment mean to you?'),
  q(37, 'MCQ', 'Financial', 'Low', 'Do you plan finances regularly?', ['Yes', 'Sometimes', 'Rarely', 'No']),
  q(38, 'MCQ', 'Lifestyle', 'Low', 'How do you manage your time?', ['Structured', 'Flexible', 'Chaotic', 'Random']),
  q(39, 'MSQ', 'Lifestyle', 'Medium', 'Select stress triggers that affect you most.', ['Money', 'Work', 'Family', 'Expectations']),
  q(40, 'One-line', 'Communication', 'High', 'How do you support your partner emotionally?'),
  q(41, 'MCQ', 'Values', 'Low', 'Do you believe love alone is enough for marriage?', ['Yes', 'No', 'Maybe', 'Depends']),
  q(42, 'MCQ', 'Emotional', 'Medium', 'How do you react to your partner’s success?', ['Happy', 'Neutral', 'Jealous', 'Competitive']),
  q(43, 'One-line', 'Values', 'Low', 'What does trust mean to you?'),
  q(44, 'MCQ', 'Communication', 'Low', 'Do you handle conflicts immediately?', ['Yes', 'Later', 'Avoid', 'Depends']),
  q(45, 'MCQ', 'Values', 'High', 'How important is honesty in difficult situations?', ['Very', 'Medium', 'Low', 'None']),
  q(46, 'One-line', 'Life Goals', 'Low', 'What expectations do you have from your partner?'),
  q(47, 'MCQ', 'Lifestyle', 'Low', 'Do you adapt easily to new circumstances?', ['Yes', 'Sometimes', 'Rarely', 'No']),
  q(48, 'MCQ', 'Emotional', 'Medium', 'How do you deal with major changes in life?', ['Accept', 'Resist', 'Fear', 'Ignore']),
  q(49, 'MSQ', 'Emotional', 'Low', 'Select your emotional needs in a relationship.', ['Support', 'Validation', 'Space', 'Attention']),
  q(50, 'One-line', 'Family', 'High', 'What is your long-term vision of marriage?'),
];

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const selectSessionQuestionSet = (): string[] => {
  const mcq = shuffle(QUESTION_BANK.filter((qst) => qst.type === 'MCQ')).slice(0, 8);
  const msq = shuffle(QUESTION_BANK.filter((qst) => qst.type === 'MSQ')).slice(0, 5);
  const oneLine = shuffle(QUESTION_BANK.filter((qst) => qst.type === 'One-line')).slice(0, 2);

  return shuffle([...mcq, ...msq, ...oneLine]).map((qst) => qst.id);
};

export const getQuestionsByIds = (ids: string[]): AssessmentQuestion[] => {
  const byId = new Map(QUESTION_BANK.map((question) => [question.id, question]));
  return ids.map((id) => byId.get(id)).filter((question): question is AssessmentQuestion => Boolean(question));
};

export const defaultQuestionSet = (): AssessmentQuestion[] => {
  const preset = ['q5', 'q10', 'q15', 'q20', 'q25', 'q30', 'q35', 'q45', 'q3', 'q12', 'q9', 'q16', 'q33', 'q39', 'q50'];
  return getQuestionsByIds(preset);
};
