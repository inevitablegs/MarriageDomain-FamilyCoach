// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionType = 'MCQ' | 'MSQ' | 'One-line';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type AssessmentMode = 'before' | 'after';
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
  mode: AssessmentMode;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const riskText: Record<RiskLevel, string> = {
  High: 'Critical mismatch can cause long-term conflict.',
  Medium: 'Mismatch may create recurring friction.',
  Low: 'Mismatch has minor or manageable impact.',
};

/** Maps Q.No to a sensible Category for each question. */
const BEFORE_CATEGORIES: Record<number, Category> = {
  1: 'Values',      // Religious/spiritual practices
  2: 'Family',      // Living arrangement / extended family
  3: 'Communication', // Check-in conversations
  4: 'Financial',   // Financial philosophy
  5: 'Emotional',   // Handling failure
  6: 'Emotional',   // Partner's success
  7: 'Life Goals',  // Career vs. family
  8: 'Values',      // Decision-making style
  9: 'Values',      // Gender roles
  10: 'Emotional',  // Forgiveness
  11: 'Emotional',  // Jealousy
  12: 'Lifestyle',  // Alone time
  13: 'Lifestyle',  // Time management
  14: 'Values',     // Is love enough?
  15: 'Values',     // Personality change after marriage
  16: 'Life Goals', // Stance on children
  17: 'Lifestyle',  // Social life
  18: 'Emotional',  // Behavior under pressure
  19: 'Lifestyle',  // Adapting to change
  20: 'Values',     // White lies / honesty
  21: 'Communication', // Expressing anger
  22: 'Family',     // In-law influence
  23: 'Communication', // Handling criticism
  24: 'Communication', // Conflict resolution timing
  25: 'Emotional',  // Love languages
  26: 'Values',     // Deal-breakers
  27: 'Emotional',  // Stress triggers
  28: 'Values',     // Core values in partner
  29: 'Lifestyle',  // Free time
  30: 'Values',     // Admired traits
  31: 'Communication', // Communication methods
  32: 'Lifestyle',  // Household tasks
  33: 'Financial',  // Financial goals
  34: 'Lifestyle',  // Vacation style
  35: 'Emotional',  // Emotional needs
  36: 'Communication', // Behaviors in disagreement
  37: 'Lifestyle',  // Friend boundaries
  38: 'Lifestyle',  // Health/wellness habits
  39: 'Emotional',  // Support when sad
  40: 'Family',     // Parenting roles
  41: 'Values',     // Cultural traditions
  42: 'Life Goals', // Long-term aspirations
  43: 'Values',     // Non-negotiables (one-line)
  44: 'Life Goals', // Career goals (one-line)
  45: 'Lifestyle',  // Annoying habit (one-line)
  46: 'Values',     // Defining loyalty (one-line)
  47: 'Emotional',  // Biggest fear (one-line)
  48: 'Emotional',  // Supporting partner in crisis (one-line)
  49: 'Values',     // Trust definition (one-line)
  50: 'Values',     // Vision of successful marriage (one-line)
};

const AFTER_CATEGORIES: Record<number, Category> = {
  1: 'Communication', // Partner hears you
  2: 'Communication', // Recurring arguments
  3: 'Emotional',     // Emotional connection
  4: 'Financial',     // Financial management
  5: 'Emotional',     // Feeling appreciated
  6: 'Lifestyle',     // Quality time
  7: 'Values',        // Trust in partner
  8: 'Communication', // Small issues escalating
  9: 'Lifestyle',     // Division of labor
  10: 'Communication', // Feeling respected
  11: 'Life Goals',   // Discussing future goals
  12: 'Emotional',    // Physical intimacy
  13: 'Emotional',    // Emotional safety
  14: 'Emotional',    // Feeling lonely with partner
  15: 'Life Goals',   // Personal growth
  16: 'Lifestyle',    // Laughing / having fun
  17: 'Emotional',    // Marital stability
  18: 'Life Goals',   // Goal alignment
  19: 'Emotional',    // Partnership vs competition
  20: 'Financial',    // Resolving financial disagreements
  21: 'Communication', // Criticizing each other
  22: 'Emotional',    // Emotional disconnect
  23: 'Lifestyle',    // Individual habits causing friction
  24: 'Values',       // Would choose partner again?
  25: 'Communication', // Conflict resolution tactics
  26: 'Emotional',    // Showing love
  27: 'Lifestyle',    // Shared interests
  28: 'Emotional',    // Current stressors
  29: 'Financial',    // Joint income allocation
  30: 'Family',       // Parenting challenges
  31: 'Communication', // Growth areas as couple
  32: 'Communication', // Partner support in crisis
  33: 'Communication', // Avoided topics
  34: 'Lifestyle',    // Ideal date night
  35: 'Emotional',    // Emotional distance triggers
  36: 'Family',       // Maintaining family boundaries
  37: 'Lifestyle',    // Daily routines
  38: 'Communication', // Communication when apart
  39: 'Values',       // Shared spiritual activities
  40: 'Emotional',    // Celebrating achievements
  41: 'Lifestyle',    // Travel preferences
  42: 'Lifestyle',    // Household management tools
  43: 'Emotional',    // Emotional bond (one-line)
  44: 'Communication', // Biggest friction point (one-line)
  45: 'Values',       // Most valued trait (one-line)
  46: 'Life Goals',   // Shared 10-year vision (one-line)
  47: 'Values',       // How definition of marriage changed (one-line)
  48: 'Communication', // Change to daily dynamic (one-line)
  49: 'Lifestyle',    // Favourite married memory (one-line)
  50: 'Communication', // Message for partner today (one-line)
};

const makeQ = (
  mode: AssessmentMode,
  no: number,
  type: QuestionType,
  riskLevel: RiskLevel,
  prompt: string,
  options?: string[]
): AssessmentQuestion => {
  const categoryMap = mode === 'before' ? BEFORE_CATEGORIES : AFTER_CATEGORIES;
  return {
    id: `${mode}-q${no}`,
    sourceQNo: no,
    mode,
    type,
    category: categoryMap[no] ?? 'Values',
    riskLevel,
    riskWeight: RISK_WEIGHT[riskLevel],
    prompt,
    riskDescription: riskText[riskLevel],
    options,
  };
};

// ─── Before Marriage Questions (50) ──────────────────────────────────────────

export const BEFORE_QUESTION_BANK: AssessmentQuestion[] = [
  makeQ('before', 1, 'MCQ', 'Low', 'How central do you want religious or spiritual practices to be in your daily life together?', ['Very High - Daily practice', 'Moderate - Weekly/Holidays', 'Low - Occasional', 'None - Secular lifestyle']),
  makeQ('before', 2, 'MCQ', 'Low', 'What is your ideal living arrangement regarding extended family?', ['Joint family (parents/siblings)', 'Nuclear family (just us)', 'Living close but separate', 'Flexible/Depends on need']),
  makeQ('before', 3, 'MCQ', 'Medium', 'How often do you expect us to have check-in conversations about our relationship?', ['Daily', 'Weekly', 'Monthly', 'Only when issues arise']),
  makeQ('before', 4, 'MCQ', 'Medium', 'Which statement best describes your personal financial philosophy?', ['Strict saver for the future', 'Balanced: save some, spend some', 'Enjoy life now (Spender)', 'No formal planning']),
  makeQ('before', 5, 'MCQ', 'High', 'How do you typically react when you face a personal or professional failure?', ['Self-reflect and try again', 'Look for someone to blame', 'Ignore it and move on', 'Get stuck in overthinking']),
  makeQ('before', 6, 'MCQ', 'Medium', 'How do you view your partner\'s professional success compared to your own?', ['Genuine pride and support', 'Neutral as long as I\'m okay', 'Occasional jealousy', 'Competitive drive to beat them']),
  makeQ('before', 7, 'MCQ', 'High', 'If career and family needs clash, which one generally takes precedence for you?', ['Always Career', 'Always Family', 'Strive for 50/50 balance', 'Depends on the phase of life']),
  makeQ('before', 8, 'MCQ', 'Low', 'What is your primary style of making big life decisions?', ['Logical and data-driven', 'Intuitive and emotional', 'Collaboration and consensus', 'Impulsive and fast']),
  makeQ('before', 9, 'MCQ', 'Low', 'How do you view traditional gender roles in a household?', ['Strongly traditional', 'Moderately traditional', 'Equal/Fluid roles', 'Gender is irrelevant to chores']),
  makeQ('before', 10, 'MCQ', 'Low', 'How easily do you forgive a partner after a significant disagreement?', ['Very easily - let go fast', 'After a sincere apology', 'Rarely - I tend to hold grudges', 'Depends on the severity']),
  makeQ('before', 11, 'MCQ', 'Low', 'How do you handle feelings of jealousy in a relationship?', ['Direct and calm communication', 'Passive-aggressive behavior', 'Suppress and ignore it', 'Attempt to control partner']),
  makeQ('before', 12, 'MCQ', 'Low', 'How much \'alone time\' or personal space do you need each week?', ['High - I need lots of solo time', 'Moderate - A few hours', 'Low - I prefer being together', 'None - I hate being alone']),
  makeQ('before', 13, 'MCQ', 'Low', 'How would you describe your time management style?', ['Highly structured/Scheduled', 'Flexible but organized', 'Go with the flow/Chaotic', 'Always running late']),
  makeQ('before', 14, 'MCQ', 'Low', 'In your view, is love enough to sustain a marriage?', ['Yes, love conquers all', 'No, compatibility is more vital', 'Maybe, but only with effort', 'Depends on the couple']),
  makeQ('before', 15, 'MCQ', 'High', 'Do you believe a person should change their core personality after marriage?', ['Yes, for the partner', 'No, stay exactly the same', 'Only minor habits should change', 'Growth is expected, not change']),
  makeQ('before', 16, 'MCQ', 'High', 'What is your stance on having children in the future?', ['Definitely want children', 'Probably, but not sure when', 'Leaning towards child-free', 'Undecided/Neutral']),
  makeQ('before', 17, 'MCQ', 'Medium', 'How important is maintaining a busy social life outside the marriage?', ['Very important', 'Moderately important', 'Relationship is my priority', 'I am a homebody']),
  makeQ('before', 18, 'MCQ', 'High', 'How do you typically behave when under extreme pressure?', ['Stay calm and focused', 'Become visibly stressed', 'Shut down and avoid tasks', 'Become aggressive or short']),
  makeQ('before', 19, 'MCQ', 'Low', 'How well do you adapt to major life changes (e.g., relocation)?', ['Very easily', 'With some effort', 'I struggle significantly', 'I resist change entirely']),
  makeQ('before', 20, 'MCQ', 'High', 'How much honesty do you expect regarding small \'white lies\'?', ['100% honesty always', 'Small lies are okay to save face', 'Honesty only on big things', 'Privacy over honesty']),
  makeQ('before', 21, 'MCQ', 'Medium', 'How do you typically express anger?', ['Controlled explanation', 'Raising my voice', 'Silent treatment', 'Immediate explosion']),
  makeQ('before', 22, 'MCQ', 'Low', 'How much influence should in-laws have on our domestic decisions?', ['High - respect elders', 'Moderate - consult them', 'Low - just informational', 'None - our life only']),
  makeQ('before', 23, 'MCQ', 'High', 'How do you respond when someone gives you constructive criticism?', ['Listen and reflect', 'Immediately get defensive', 'Ignore it/Dismiss it', 'Counter-attack']),
  makeQ('before', 24, 'MCQ', 'Low', 'When a conflict happens, when do you prefer to resolve it?', ['Immediately/Never sleep angry', 'A few hours later', 'The next day after sleeping', 'Whenever it comes up again']),
  makeQ('before', 25, 'MSQ', 'Medium', 'Which of these are your primary \'Love Languages\'? (Select all that apply)', ['Words of Affirmation', 'Quality Time', 'Receiving Gifts', 'Acts of Service', 'Physical Touch']),
  makeQ('before', 26, 'MSQ', 'Low', 'Which of the following are absolute deal-breakers for you? (Select all that apply)', ['Dishonesty', 'Addiction Issues', 'Financial Irresponsibility', 'Lack of Ambition', 'Incompatibility with family']),
  makeQ('before', 27, 'MSQ', 'Medium', 'What are your most common stress triggers? (Select all that apply)', ['Financial instability', 'Workplace pressure', 'Family interference', 'Lack of sleep/health', 'Messy environment']),
  makeQ('before', 28, 'MSQ', 'Low', 'Which core values do you seek in a long-term partner? (Select all that apply)', ['Loyalty', 'Ambition', 'Compassion', 'Intellect', 'Humor']),
  makeQ('before', 29, 'MSQ', 'Medium', 'How do you prefer to spend your free time? (Select all that apply)', ['Socializing/Partying', 'Outdoor activities/Sports', 'Quiet time/Reading', 'Travel/Exploring', 'Gaming/Movies']),
  makeQ('before', 30, 'MSQ', 'Low', 'What traits do you admire most in your partner? (Select all that apply)', ['Reliability', 'Spontaneity', 'Emotional intelligence', 'Physical attractiveness', 'Financial stability']),
  makeQ('before', 31, 'MSQ', 'Low', 'Which communication methods do you prefer during the day? (Select all that apply)', ['Texting frequently', 'Phone calls', 'Video chats', 'Evening catch-up only', 'Checking in only for emergencies']),
  makeQ('before', 32, 'MSQ', 'Low', 'Which household tasks are you willing to take full responsibility for? (Select all that apply)', ['Cooking', 'Cleaning', 'Finances/Bills', 'Grocery/Errands', 'Home Repairs']),
  makeQ('before', 33, 'MSQ', 'Medium', 'Which financial goals are most important to you? (Select all that apply)', ['Buying a home', 'Retiring early', 'Traveling the world', 'Luxury lifestyle', 'Emergency fund security']),
  makeQ('before', 34, 'MSQ', 'Low', 'What is your ideal vacation style? (Select all that apply)', ['Relaxing at a beach/resort', 'Adventure/Hiking', 'City tours/History', 'Visiting family', 'Luxury/Shopping']),
  makeQ('before', 35, 'MSQ', 'Low', 'Which emotional needs are most critical for you to feel secure? (Select all that apply)', ['Consistent validation', 'Autonomy/Space', 'Shared vulnerability', 'Protection/Safety', 'Intellectual stimulation']),
  makeQ('before', 36, 'MSQ', 'Low', 'When we disagree, which behaviors do you tend to use? (Select all that apply)', ['Active listening', 'Withdrawing emotionally', 'Using sarcasm', 'Focusing on solutions', 'Revisiting old issues']),
  makeQ('before', 37, 'MSQ', 'Low', 'What boundaries do you value regarding friends? (Select all that apply)', ['Individual nights out', 'No secrets about friends', 'Shared friend group', 'Opposite-sex friendship limits', 'Family-only weekends']),
  makeQ('before', 38, 'MSQ', 'Low', 'Which health/wellness habits are important to you? (Select all that apply)', ['Daily exercise', 'Healthy eating', 'Mental health/Therapy', 'Regular sleep schedule', 'Avoiding toxic habits']),
  makeQ('before', 39, 'MSQ', 'High', 'How do you prefer to be supported when sad? (Select all that apply)', ['Physical touch/Hugs', 'Practical advice', 'Being left alone', 'Listening without judgment', 'Distraction/Fun']),
  makeQ('before', 40, 'MSQ', 'Medium', 'Which parenting roles appeal most to you? (Select all that apply)', ['Disciplinarian', 'Emotional nurturer', 'Provider', 'Playmate/Fun parent', 'Teacher/Guide']),
  makeQ('before', 41, 'MSQ', 'Low', 'Which cultural or family traditions must be kept? (Select all that apply)', ['Religious festivals', 'Annual family reunions', 'Specific food traditions', 'Naming conventions', 'Holiday rituals']),
  makeQ('before', 42, 'MSQ', 'Medium', 'What are your top long-term life aspirations? (Select all that apply)', ['Professional peak', 'Parental success', 'Financial freedom', 'Social impact/Charity', 'Creative fulfillment']),
  makeQ('before', 43, 'One-line', 'Medium', 'What are your top 3 non-negotiables in a partner?'),
  makeQ('before', 44, 'One-line', 'Low', 'Describe your career goals for the next 5 years.'),
  makeQ('before', 45, 'One-line', 'Medium', 'What is one habit of yours that might annoy a future partner?'),
  makeQ('before', 46, 'One-line', 'Low', 'How do you personally define loyalty in a relationship?'),
  makeQ('before', 47, 'One-line', 'High', 'What is your biggest fear regarding getting married?'),
  makeQ('before', 48, 'One-line', 'High', 'How do you typically support a partner during a crisis?'),
  makeQ('before', 49, 'One-line', 'Low', 'What does \'trust\' mean to you in practical, everyday terms?'),
  makeQ('before', 50, 'One-line', 'High', 'What is your overall vision of a \'successful\' marriage?'),
];

// ─── After Marriage Questions (50) ───────────────────────────────────────────

export const AFTER_QUESTION_BANK: AssessmentQuestion[] = [
  makeQ('after', 1, 'MCQ', 'Low', 'Do you feel like your partner truly hears and understands your concerns?', ['Always', 'Mostly', 'Sometimes', 'Never']),
  makeQ('after', 2, 'MCQ', 'Low', 'How often do you find yourselves arguing about the exact same issues?', ['Never', 'Rarely', 'Often', 'Always']),
  makeQ('after', 3, 'MCQ', 'Medium', 'How would you rate your current level of emotional connection?', ['Strong and deep', 'Moderate/Stable', 'Weak/Fading', 'Completely disconnected']),
  makeQ('after', 4, 'MCQ', 'High', 'How are the household finances currently being managed?', ['Jointly and transparently', 'Mostly together with some friction', 'Rarely discussed/Parallel', 'Strictly separate/Conflict-prone']),
  makeQ('after', 5, 'MCQ', 'Medium', 'How frequently do you feel appreciated by your spouse?', ['Daily', 'Weekly', 'Only on occasions', 'Never']),
  makeQ('after', 6, 'MCQ', 'Low', 'Are you satisfied with the amount of quality time you spend together?', ['Very satisfied', 'Somewhat satisfied', 'Need more time', 'Very dissatisfied']),
  makeQ('after', 7, 'MCQ', 'Low', 'How would you describe your level of trust in your partner right now?', ['Complete/Unshakeable', 'Mostly trustful', 'Partially suspicious', 'No trust left']),
  makeQ('after', 8, 'MCQ', 'High', 'How do small, everyday issues affect your relationship mood?', ['Easily ignored', 'Briefly annoying', 'Often escalate into fights', 'Always ruin the day']),
  makeQ('after', 9, 'MCQ', 'Medium', 'How balanced do you feel the division of labor is in your home?', ['Perfectly balanced', 'Mostly fair', 'Somewhat unequal', 'Extremely lopsided']),
  makeQ('after', 10, 'MCQ', 'Low', 'Do you feel respected when making joint decisions?', ['Always', 'Often', 'Sometimes', 'Rarely']),
  makeQ('after', 11, 'MCQ', 'High', 'How often do you discuss your future goals together?', ['Regularly', 'Occasionally', 'Rarely', 'Never']),
  makeQ('after', 12, 'MCQ', 'Low', 'How satisfied are you with the level of physical intimacy?', ['High', 'Medium', 'Low', 'Non-existent']),
  makeQ('after', 13, 'MCQ', 'Low', 'Do you feel emotionally safe sharing your secrets with your partner?', ['Yes, completely', 'Mostly', 'Sometimes', 'No, I\'m judged']),
  makeQ('after', 14, 'MCQ', 'High', 'How often do you feel lonely while being with your partner?', ['Never', 'Rarely', 'Often', 'Always']),
  makeQ('after', 15, 'MCQ', 'High', 'Do you feel like you are growing as a person within this marriage?', ['Yes, definitely', 'Somewhat', 'No, I\'m stagnant', 'I feel I\'m declining']),
  makeQ('after', 16, 'MCQ', 'Low', 'How often do you laugh or have fun together?', ['Daily', 'Weekly', 'Rarely', 'Never']),
  makeQ('after', 17, 'MCQ', 'Low', 'Do you feel secure about the stability of your marriage?', ['Very secure', 'Mostly secure', 'Somewhat insecure', 'Very unstable']),
  makeQ('after', 18, 'MCQ', 'Medium', 'Are your long-term goals still aligned with your partner\'s?', ['Perfectly aligned', 'Mostly aligned', 'Diverging', 'Completely opposite']),
  makeQ('after', 19, 'MCQ', 'Medium', 'How do you feel your partnership compares to a competition?', ['Pure partnership', 'Mostly supportive', 'Slightly competitive', 'Constant competition']),
  makeQ('after', 20, 'MCQ', 'Low', 'How effectively do you resolve financial disagreements?', ['Calmly and quickly', 'With some tension', 'Avoid until necessary', 'Always leads to a fight']),
  makeQ('after', 21, 'MCQ', 'High', 'How often do you criticize each other\'s personality or habits?', ['Never', 'Rarely', 'Often', 'Constantly']),
  makeQ('after', 22, 'MCQ', 'High', 'Do you feel like you disconnect emotionally during busy weeks?', ['Never', 'Rarely', 'Often', 'Always']),
  makeQ('after', 23, 'MCQ', 'High', 'Are individual habits (e.g., hygiene, phone use) causing friction?', ['No issues', 'Minor annoyances', 'Moderate friction', 'Major recurring fights']),
  makeQ('after', 24, 'MCQ', 'High', 'If you could go back, would you choose this partner again?', ['Yes, definitely', 'Probably', 'Unsure', 'No']),
  makeQ('after', 25, 'MSQ', 'Low', 'What tactics do you use to resolve a fight? (Select all that apply)', ['Calm discussion', 'Taking a time-out', 'Seeking mediation', 'Writing a letter/message', 'Apologizing first']),
  makeQ('after', 26, 'MSQ', 'Medium', 'How do you currently show love to your partner? (Select all that apply)', ['Verbal praise', 'Doing chores for them', 'Buying small gifts', 'Planning dates', 'Physical affection']),
  makeQ('after', 27, 'MSQ', 'Low', 'Which interests do you actually share and enjoy together? (Select all that apply)', ['Watching shows/movies', 'Traveling', 'Exercise/Gym', 'Cooking/Dining out', 'Socializing with friends']),
  makeQ('after', 28, 'MSQ', 'Medium', 'What are the biggest current stressors in your marriage? (Select all that apply)', ['Work-life balance', 'Extended family/In-laws', 'Money/Debt', 'Parenting duties', 'Lack of communication']),
  makeQ('after', 29, 'MSQ', 'Low', 'Where does most of your joint income go? (Select all that apply)', ['Rent/Mortgage', 'Lifestyle/Dining', 'Savings/Investments', 'Children\'s needs', 'Travel/Luxury']),
  makeQ('after', 30, 'MSQ', 'Medium', 'Which parenting areas are most challenging for you? (Select all that apply)', ['Consistency in discipline', 'Managing schedules', 'Emotional support', 'Educational choices', 'Screen time limits']),
  makeQ('after', 31, 'MSQ', 'Low', 'Which areas do you feel you need to grow in as a couple? (Select all that apply)', ['Better listening', 'Financial transparency', 'Sexual intimacy', 'Shared hobbies', 'Managing anger']),
  makeQ('after', 32, 'MSQ', 'Low', 'How does your partner support you during a work crisis? (Select all that apply)', ['Giving advice', 'Handling home chores', 'Listening patiently', 'Giving me space', 'Encouragement/Distraction']),
  makeQ('after', 33, 'MSQ', 'Medium', 'Which topics do you currently avoid talking about? (Select all that apply)', ['Past relationships', 'Spending habits', 'Sexual needs', 'In-law issues', 'Career dissatisfaction']),
  makeQ('after', 34, 'MSQ', 'Low', 'What does a perfect date night look like now? (Select all that apply)', ['Fancy dinner', 'Staying in with a movie', 'Active/Outdoors', 'Double date with friends', 'Cultural event/Concert']),
  makeQ('after', 35, 'MSQ', 'High', 'What triggers emotional distance in your relationship? (Select all that apply)', ['Work fatigue', 'Feeling criticized', 'Unresolved fights', 'Lack of physical touch', 'Boredom/Routine']),
  makeQ('after', 36, 'MSQ', 'Low', 'How are you maintaining boundaries with families? (Select all that apply)', ['Limiting visits', 'No financial dependence', 'Privacy on marital issues', 'Joint decision on holidays', 'Setting rules for visits']),
  makeQ('after', 37, 'MSQ', 'Low', 'Which daily routines do you value most? (Select all that apply)', ['Morning coffee together', 'Eating dinner together', 'Sleeping at the same time', 'Evening walks', 'Sharing daily highs/lows']),
  makeQ('after', 38, 'MSQ', 'Low', 'How do you communicate when not physically together? (Select all that apply)', ['Frequent texts', 'Long phone calls', 'Occasional memes/links', 'Brief check-ins', 'Rarely communicate']),
  makeQ('after', 39, 'MSQ', 'Low', 'Which spiritual/religious activities do you share? (Select all that apply)', ['Attending services', 'Daily prayer/Meditation', 'Holiday traditions', 'Religious fasting', 'None - separate beliefs']),
  makeQ('after', 40, 'MSQ', 'Low', 'How do you celebrate each other\'s achievements? (Select all that apply)', ['Public praise', 'Private gifts', 'Special dinners', 'Verbal acknowledgment', 'Helping with next steps']),
  makeQ('after', 41, 'MSQ', 'Low', 'What are your common travel preferences now? (Select all that apply)', ['Budget-friendly', 'Luxury/Comfort', 'Kid-friendly', 'Spontaneous trips', 'Plan a year ahead']),
  makeQ('after', 42, 'MSQ', 'Low', 'Which household management tools do you use? (Select all that apply)', ['Shared calendar', 'Shared bank account', 'Budgeting apps', 'Chore charts', 'Grocery list apps']),
  makeQ('after', 43, 'One-line', 'Medium', 'Describe the current state of your emotional bond in one sentence.'),
  makeQ('after', 44, 'One-line', 'High', 'What is the single biggest point of friction in your home today?'),
  makeQ('after', 45, 'One-line', 'Low', 'What is the trait you value most in your partner after being married?'),
  makeQ('after', 46, 'One-line', 'Medium', 'What is your shared vision for where you want to be in 10 years?'),
  makeQ('after', 47, 'One-line', 'Low', 'How has your definition of marriage changed since the wedding day?'),
  makeQ('after', 48, 'One-line', 'High', 'If you could change one thing about your daily dynamic, what would it be?'),
  makeQ('after', 49, 'One-line', 'Low', 'What is your favorite memory as a married couple so far?'),
  makeQ('after', 50, 'One-line', 'High', 'What is the most important message you want to give your partner today?'),
];

// ─── Combined bank (for legacy lookups) ───────────────────────────────────────
export const QUESTION_BANK: AssessmentQuestion[] = [
  ...BEFORE_QUESTION_BANK,
  ...AFTER_QUESTION_BANK,
];

// ─── Session selection (15 questions: 8 MCQ + 5 MSQ + 2 One-line) ────────────

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const selectSessionQuestionSet = (mode: AssessmentMode = 'before'): string[] => {
  const bank = mode === 'before' ? BEFORE_QUESTION_BANK : AFTER_QUESTION_BANK;
  const mcq = shuffle(bank.filter((q) => q.type === 'MCQ')).slice(0, 8);
  const msq = shuffle(bank.filter((q) => q.type === 'MSQ')).slice(0, 5);
  const oneLine = shuffle(bank.filter((q) => q.type === 'One-line')).slice(0, 2);
  return shuffle([...mcq, ...msq, ...oneLine]).map((q) => q.id);
};

export const getQuestionsByIds = (ids: string[]): AssessmentQuestion[] => {
  const byId = new Map(QUESTION_BANK.map((q) => [q.id, q]));
  return ids.map((id) => byId.get(id)).filter((q): q is AssessmentQuestion => Boolean(q));
};

export const defaultQuestionSet = (mode: AssessmentMode = 'before'): AssessmentQuestion[] => {
  return selectSessionQuestionSet(mode).map((id) => {
    const byId = new Map(QUESTION_BANK.map((q) => [q.id, q]));
    return byId.get(id)!;
  }).filter(Boolean);
};
