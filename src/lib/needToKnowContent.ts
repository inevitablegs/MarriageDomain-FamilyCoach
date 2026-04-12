export type NeedToKnowCategory = {
  id: string;
  title: string;
  shortDesc: string;
  bulletPoints: string[];
  extensiveContent: string;
};

export const NEED_TO_KNOW_CATEGORIES: NeedToKnowCategory[] = [
  {
    id: 'family',
    title: 'Family & Society Pressure',
    shortDesc: 'The intense cultural weight that forces marriages for the wrong reasons.',
    bulletPoints: [
      'Rushing into a commitment due to age or "ticking clocks."',
      'Making decisions based on "log kya kahenge" (what will people say).',
      'Succumbing to forced or heavily coerced arranged marriage setups.'
    ],
    extensiveContent: `## 🔥 Domain: Family & Society Pressure (Pre-Marriage Risk)

### 1. Decision Ownership Breakdown
👉 Who is actually deciding this marriage?

Sub-points:
- Family-led decision vs self-led decision
- Emotional blackmail (“we have done so much for you”)
- Fear-based agreement (age, reputation, “log kya kahenge”)
- Lack of independent evaluation time

👉 Core risk:
Marriage chosen to satisfy others, not personal alignment.

### 2. Timeline Pressure (Artificial Urgency)
👉 Rushed decisions kill clarity.

Sub-points:
- “Right age” pressure (especially strong in Indian context)
- Forced quick engagement/marriage timeline
- Limited interaction time between partners
- Pressure after seeing multiple rejected proposals

👉 Core risk:
Commitment without enough data.

### 3. Family Expectation Overload
👉 Hidden expectations that show up after marriage.

Sub-points:
- Role expectations (daughter-in-law duties, gender roles)
- Living arrangements (joint family vs nuclear mismatch)
- Financial expectations (supporting family, shared income)
- Cultural/religious practices enforcement

👉 Core risk:
Post-marriage shock due to unspoken rules.

### 4. Reputation & Social Image Pressure
👉 Decisions driven by “what people will say”

Sub-points:
- Fear of societal judgment
- Status-driven marriage (wealth, caste, profession)
- Comparison with relatives/peers
- Avoiding “shame” over broken engagement

👉 Core risk:
Choosing image over compatibility.

### 5. Suppression of Personal Red Flags
👉 This is dangerous and common.

Sub-points:
- Ignoring incompatibilities to avoid conflict with family
- Rationalizing obvious concerns (“it will adjust later”)
- Fear of rejecting proposal due to family expectations
- Lack of safe space to express doubts

👉 Core risk:
Entering marriage with known unresolved issues.

### 6. External Decision Interference
👉 Family continues controlling after marriage.

Sub-points:
- Parents influencing decisions (finance, living, children)
- Lack of boundaries between couple and family
- Loyalty conflicts (partner vs parents)
- Over-dependence on family approval

👉 Core risk:
Couple never becomes an independent unit.`
  },
  {
    id: 'fake_personalities',
    title: 'Fake Personalities During Courtship',
    shortDesc: 'The danger of representative behavior and the honeymoon phase.',
    bulletPoints: [
      '"Representative" behavior where both parties hide their true flaws.',
      'Lack of exposure to how the partner handles high-stress situations.',
      'Staying in the "honeymoon phase" and avoiding deep, uncomfortable dialogue.'
    ],
    extensiveContent: `## 🔥 Domain: Fake Personalities During Courtship (Pre-Marriage Risk)

### 1. The "Representative" Protocol
👉 Are you dating them, or their PR manager?

Sub-points:
- Highly curated interactions in controlled environments
- Mirroring interests to appear compatible
- Suppressing natural emotional reactions
- Over-performing generosity and patience

👉 Core risk:
Falling in love with a facade that disappears after 6 months.

### 2. Conflict Avoidance Camouflage
👉 What happens when they are finally challenged?

Sub-points:
- Agreeing to everything just to keep the peace
- Refusal to engage in deep, difficult conversations
- Escaping arguments with surface-level apologies
- Masking fundamental boundary disagreements

👉 Core risk:
Zero operational data on how they handle real crisis.

### 3. The Unseen Anger Baseline
👉 You have never seen them truly frustrated.

Sub-points:
- Hiding emotional volatility behind social grace
- Suppressing irritation during the honeymoon phase
- Unpredictable passive-aggressive behavior
- Weaponizing emotional withdrawal when stressed

👉 Core risk:
Shocking emergence of verbal or emotional hostility post-marriage.

### 4. Fake Modernity (The Traditional Trap)
👉 "Progressive" words, deeply conservative actions.

Sub-points:
- Claiming egalitarian views while expecting traditional gender roles
- Supporting career goals until they interfere with household duties
- Agreeing to nuclear setups while secretly planning joint family living
- Hidden expectations of submissiveness

👉 Core risk:
Lifelong resentment due to bait-and-switch structural expectations.

### 5. Lifestyle Habit Masking
👉 Hiding the daily reality to secure the commitment.

Sub-points:
- Concealing poor hygiene or extreme messy habits
- Masking severe laziness or lack of household contribution
- Faking ambition or financial discipline
- Downplaying substance use or negative coping mechanisms

👉 Core risk:
Severe daily operational friction once cohabitating.`
  },
  {
    id: 'communication',
    title: 'Poor Communication Skills',
    shortDesc: 'The structural inability to safely express conflict and vulnerability.',
    bulletPoints: [
      'Inability to express needs or boundaries clearly.',
      'A "shut down" or "avoidant" response to difficult topics.',
      'Consistently misinterpreting the partner’s intentions.'
    ],
    extensiveContent: `## 🔥 Domain: Poor Communication Skills (Pre-Marriage Risk)

### 1. The Stonewalling Defense
👉 The silent treatment is not peace; it is punishment.

Sub-points:
- Refusing to speak or acknowledge the partner during stress
- Walking away from arguments without stating a return time
- Punishing the partner with multi-day silent treatments
- Refusal to engage in repair conversations

👉 Core risk:
Emotional abandonment leading to total relationship paralysis.

### 2. Defensiveness and Blame-Shifting
👉 Making every critique a personal attack.

Sub-points:
- Inability to accept minor feedback without exploding
- Immediately turning the argument back on the partner
- Playing the victim to avoid accountability
- Justifying bad behavior instead of apologizing

👉 Core risk:
Total erosion of safety to bring up any issues.

### 3. Boundary Collapse (The Inability to say "No")
👉 Passive-aggressive compliance kills intimacy.

Sub-points:
- Saying "yes" to keep the peace while hoarding resentment
- Expecting mind-reading instead of stating needs clearly
- Punishing the partner later for things they agreed to
- Collapsing under pressure instead of negotiating

👉 Core risk:
A relationship filled with bitterness and zero authentic consent.

### 4. Weaponized Misinterpretation
👉 Assuming worst-case intent behind normal actions.

Sub-points:
- Reacting to logistical questions as personal attacks
- Reading malicious intent into innocent mistakes
- Keeping score of perceived slights
- Refusing to give the benefit of the doubt

👉 Core risk:
Constant eggshell-walking and emotional exhaustion.

### 5. Contempt and Disrespect
👉 The ultimate predictor of divorce.

Sub-points:
- Eye-rolling, mocking, or sarcastic dismissals
- Name-calling during heated arguments
- Publicly humiliating or correcting the partner
- Dismissing the partner's core intelligence or value

👉 Core risk:
Total destruction of mutual respect and attraction.`
  },
  {
    id: 'financial',
    title: 'Financial Transparency Issues',
    shortDesc: 'The silent killer of modern marriages hiding beneath joint accounts.',
    bulletPoints: [
      'Entering the union with hidden debts or secret financial obligations.',
      'Fundamental differences in "spender" vs. "saver" mentalities.',
      'Lack of a unified plan for income, investments, and spending.'
    ],
    extensiveContent: `## 🔥 Domain: Financial Transparency Issues (Pre-Marriage Risk)

### 1. The Extended Family Tax
👉 Silent obligations that drain the joint account.

Sub-points:
- Sending secret stipends to parents or siblings
- Assuming the spouse will cover in-law debt
- Unspoken expectations to fund extravagant family events
- Hiding financial aid from the primary partner

👉 Core risk:
Financial infidelity and the breakdown of nuclear trust.

### 2. The Debt Concealment
👉 Marrying a financial liability.

Sub-points:
- Hiding credit card debt, personal loans, or risky investments
- Downplaying the severity of financial obligations
- Concealing poor credit history or bad financial habits
- Expecting the partner's income to save them post-marriage

👉 Core risk:
Catastrophic legal and economic consequences for both partners.

### 3. Spender vs. Saver Paradigm Clash
👉 Fundamentally opposed views on the utility of money.

Sub-points:
- One views money as survival; the other views it as freedom
- Extreme anxiety around daily discretionary spending
- Total lack of a mutually agreed budget system
- Judgment and resentment over personal purchases

👉 Core risk:
Everyday logistical decisions become psychological warfare.

### 4. Income Power Imbalance
👉 Using money as a weapon of control.

Sub-points:
- The higher earner dictating all relationship decisions
- Requiring the lower earner to "ask permission" for basics
- Hidden accounts preventing equal access to assets
- Refusal to consider unpaid domestic labor as contribution

👉 Core risk:
The marriage regresses into an abusive parent-child dynamic.

### 5. Lack of Strategic Alignment
👉 No unified vision for the next decade.

Sub-points:
- Disagreements on merging vs separating accounts
- Unaligned goals on buying property, investing, or saving algorithms
- Differing risk tolerances for business or career moves
- Complete avoidance of long-term financial planning

👉 Core risk:
Total stagnation and inability to build joint wealth.`
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle Mismatch',
    shortDesc: 'The grinding reality of incompatible daily operational habits.',
    bulletPoints: [
      'Clashing social needs (e.g., an extreme extrovert paired with a hermit).',
      'Different standards for health, hygiene, and daily routines.',
      'One partner prioritizing total freedom while the other craves rigid structure.'
    ],
    extensiveContent: `## 🔥 Domain: Lifestyle Mismatch (Pre-Marriage Risk)

### 1. The Social Energy Divide
👉 How the couple recharges their batteries.

Sub-points:
- Extreme extrovert requiring constant social validation vs intense introvert
- One partner constantly hosting unannounced guests
- Dragging the unwilling partner to endless social obligations
- Chronic social exhaustion leading to irritability

👉 Core risk:
The home stops functioning as a safe sanctuary for one partner.

### 2. The Chronological Clashes
👉 Rigid structure versus total spontaneity.

Sub-points:
- Strict daily planner vs fly-by-the-seat-of-your-pants reality
- Clashing sleep schedules destroying intimacy
- Extreme friction over punctuality and logistical planning
- Spontaneous partner feeling "controlled" while rigid partner feels "disrespected"

👉 Core risk:
Endless, irritating compromises draining affection.

### 3. Baseline Hygiene & Cleanliness
👉 Different definitions of "acceptable."

Sub-points:
- One partner acting as the default maid
- Resentment over mental load and chore distribution
- Differing standards for personal grooming or household clutter
- The cleaner partner nagging, the messier partner withdrawing

👉 Core risk:
Descent into a roommate dynamic entirely devoid of romance.

### 4. Health and Maintenance Mismatch
👉 Wildly different trajectories for physical aging.

Sub-points:
- One prioritizes fitness/nutrition while the other fundamentally rejects it
- Resentment over lifestyle diseases or lack of energy
- Clashing priorities on how leisure time is spent (gym vs couch)
- Enabling destructive habits (smoking, excessive drinking)

👉 Core risk:
Loss of physical attraction and asymmetrical caretaking later.

### 5. Career Ambition Asymmetry
👉 Different engines driving the life plan.

Sub-points:
- Hyper-ambitious hustler vs content coaster
- Resentful sacrifices regarding relocation or late nights
- Demanding the ambitious partner slow down
- Contempt for the less ambitious partner's lack of drive

👉 Core risk:
Living fundamentally parallel, unconnected lives.`
  },
  {
    id: 'validation',
    title: 'External Validation Dependence',
    shortDesc: 'Letting outside forces dictate the internal health of the relationship.',
    bulletPoints: [
      'Comparing the relationship to curated social media "goals."',
      'Allowing friends or extended family to dictate internal relationship decisions.',
      'A lack of independent thinking regarding the couple\'s future.'
    ],
    extensiveContent: `## 🔥 Domain: External Validation Dependence (Pre-Marriage Risk)

### 1. The Committee Marriage
👉 Who is actually running this relationship?

Sub-points:
- Leaking marital conflicts immediately to parents or best friends
- Requiring third-party approval for internal decisions
- Allowing extended family to vote on the couple's boundaries
- Complete failure to present a united front to outsiders

👉 Core risk:
Total destruction of mutual trust and partner sovereignty.

### 2. The Social Media Mirage
👉 Performing the relationship instead of living it.

Sub-points:
- Curating optics to mask deep internal fractures
- Over-prioritizing aesthetic milestones (weddings, vacations) over connection
- Judging the partner's worth based on public engagement metrics
- Demanding public displays of affection to soothe private insecurity

👉 Core risk:
Investing 100% of energy into the image, and 0% into the foundation.

### 3. Peer Comparison Paralysis
👉 The thief of relational joy.

Sub-points:
- Constantly comparing the spouse’s income or career to friends
- Generating artificial resentment over milestones (houses, cars, babies)
- Devaluing the partner’s actual contributions because they don't look like someone else's
- Forcing the couple into debt to keep up appearances

👉 Core risk:
The partner feels structurally inadequate and perpetually unappreciated.

### 4. Identity Enmeshment
👉 The inability to separate from the family of origin.

Sub-points:
- Making choices solely to avoid disappointing parents
- Using family approval as the only metric for success
- Failure to individuate and form a new, overriding nuclear unit
- Using "cultural duty" to justify emotional abandonment of the spouse

👉 Core risk:
You never truly marry them; you just adopt them into your parents' dynamic.`
  }
];
