import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CompatibilityAssessment, RedFlag, RelationshipHealth, supabase, CoupleAssessmentSession, PulseCheckSession, MentorAssignment, Mentor } from '../lib/supabase';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  Handshake,
  Heart,
  Link2,
  MessageCircleHeart,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  MessageCircle,
  Clock,
  Zap,
  HeartHandshake,
} from 'lucide-react';
import { readAllThoughts, type StoredThought, emotionEmoji, priorityConfig } from '../lib/expectationResolverAi';

type DashboardProps = {
  onNavigate: (page: string) => void;
  mode?: 'before' | 'after';
};

type ServiceItem = {
  name: string;
  priceLabel: string;
  description: string;
  bullets: string[];
  cta: string;
  targetPage: 'quiz' | 'red-flags' | 'health-tracker' | 'pre-marriage-analysis' | 'conflict-resolution' | 'couple-pulse-check' | 'need-to-know' | 'expectation-resolver';
};

const beforeMarriageServices: ServiceItem[] = [
  {
    name: 'Basic Compatibility Quiz',
    priceLabel: 'FREE',
    description: 'Get a quick assessment of your relationship compatibility.',
    bullets: ['Values alignment check', 'Lifestyle compatibility', 'Basic communication'],
    cta: 'Start Free Quiz',
    targetPage: 'quiz',
  },
  {
    name: 'Advanced Compatibility Report',
    priceLabel: 'PREMIUM',
    description: 'Deep analysis with risk scoring and recommendations.',
    bullets: ['Detailed scoring', 'Risk factor identification', 'Personalized advice'],
    cta: 'Generate Report',
    targetPage: 'quiz',
  },
  {
    name: 'Red Flag Deep Analysis',
    priceLabel: 'PREMIUM',
    description: 'Identify potential warning signs before commitment.',
    bullets: ['Behavior pattern analysis', 'Warning indicators', 'Guided interpretation'],
    cta: 'Run Deep Analysis',
    targetPage: 'pre-marriage-analysis',
  },
  {
    name: 'Need to Know Reality Check',
    priceLabel: 'PREMIUM',
    description: 'AI-guided breakdowns on the 6 hidden dangers of Indian marriages.',
    bullets: ['Family & Society Pressure', 'Fake Personalities', 'Financial Transparency'],
    cta: 'Enter AI Hub',
    targetPage: 'need-to-know',
  },
  {
    name: 'Expectation Resolver™',
    priceLabel: 'PREMIUM',
    description: 'AI that converts emotions into clear expectations and instant fixes.',
    bullets: ['Emotion detection & patterns', 'Hidden expectation extraction', 'Ready-to-send solutions'],
    cta: 'Resolve Expectations',
    targetPage: 'expectation-resolver',
  },
];

const afterMarriageServices: ServiceItem[] = [
  {
    name: 'Relationship Health Dashboard',
    priceLabel: 'FREE',
    description: 'Track relationship metrics and progress over time.',
    bullets: ['Weekly check-ins', 'Trend visualization', 'Improvement signals'],
    cta: 'Open Dashboard',
    targetPage: 'health-tracker',
  },
  {
    name: 'Conflict Resolution Program',
    priceLabel: 'PREMIUM',
    description: 'Build practical conflict resolution habits as a couple.',
    bullets: ['De-escalation patterns', 'Repair communication', 'Guided steps'],
    cta: 'Start Conflict Program',
    targetPage: 'conflict-resolution',
  },
  {
    name: 'Couple Pulse',
    priceLabel: 'PREMIUM',
    description: 'Weekly dual-partner pulse assessment across connection, responsibility and trust.',
    bullets: ['Both partners participate', 'AI-powered scoring', 'Actionable weekly plan'],
    cta: 'Start Pulse Check',
    targetPage: 'couple-pulse-check',
  },
];

export function Dashboard({ mode, onNavigate }: DashboardProps) {
  const { profile, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<CompatibilityAssessment[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [healthRecords, setHealthRecords] = useState<RelationshipHealth[]>([]);
  const [jointSessions, setJointSessions] = useState<CoupleAssessmentSession[]>([]);
  const [pulseSessions, setPulseSessions] = useState<PulseCheckSession[]>([]);
  const [partnerExpectations, setPartnerExpectations] = useState<StoredThought[]>([]);
  const [assignedMentor, setAssignedMentor] = useState<Mentor | null>(null);
  const [mentorAssignment, setMentorAssignment] = useState<MentorAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      try {
        const [assessmentsData, redFlagsData, healthData, jointData, pulseData] = await Promise.all([
          supabase
            .from('compatibility_assessments')
            .select('*')
            .eq('user_id', profile.id)
            .order('completed_at', { ascending: false })
            .limit(6),
          supabase
            .from('red_flags')
            .select('*')
            .eq('user_id', profile.id)
            .order('detected_at', { ascending: false })
            .limit(10),
          supabase
            .from('relationship_health')
            .select('*')
            .eq('user_id', profile.id)
            .order('recorded_at', { ascending: false })
            .limit(6),
          supabase
            .from('couple_assessment_sessions')
            .select('*')
            .or(`partner_a_id.eq.${profile.id},partner_b_id.eq.${profile.id}`)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1),
          supabase
            .from('pulse_check_sessions')
            .select('*')
            .or(`initiator_id.eq.${profile.id},partner_id.eq.${profile.id}`)
            .order('created_at', { ascending: false }),
        ]);

        if (assessmentsData.data) setAssessments(assessmentsData.data);
        if (redFlagsData.data) setRedFlags(redFlagsData.data);
        if (healthData.data) setHealthRecords(healthData.data);
        if (jointData && jointData.data) setJointSessions(jointData.data as CoupleAssessmentSession[]);
        if (pulseData.data) setPulseSessions(pulseData.data as PulseCheckSession[]);

        // Load Expectations Resolver thoughts
        const allThoughts = readAllThoughts();
        if (profile.partner_id) {
          setPartnerExpectations(allThoughts.filter(t => t.user_id === profile.partner_id && !t.is_deleted));
        }

        // Load mentor assignment
        const { data: assignmentData } = await supabase
          .from('mentor_assignments')
          .select('*')
          .eq('user_id', profile.id)
          .eq('status', 'active');

        if (assignmentData && (assignmentData as MentorAssignment[]).length > 0) {
          const assignment = (assignmentData as MentorAssignment[])[0];
          setMentorAssignment(assignment);
          const { data: mentorData } = await supabase
            .from('mentors')
            .select('*')
            .eq('id', assignment.mentor_id)
            .maybeSingle();
          if (mentorData) setAssignedMentor(mentorData as Mentor);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [profile]);

  if (authLoading || loading || !profile) {
    return (
      <div
        className="min-h-[calc(100vh-68px)] flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div
            className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--brand-indigo)' }}
          />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Loading workspace…
          </p>
        </div>
      </div>
    );
  }

  const isCoupleDashboard = mode ? mode === 'after' : profile.relationship_status === 'married';

  return isCoupleDashboard ? (
    <AfterMarriageDashboard
      onNavigate={onNavigate}
      profileName={profile.full_name}
      hasPartnerConnected={Boolean(profile.partner_id)}
      assessments={assessments}
      redFlags={redFlags}
      healthRecords={healthRecords}
      jointSessions={jointSessions}
      pulseSessions={pulseSessions}
      profileId={profile.id}
      assignedMentor={assignedMentor}
      mentorAssignment={mentorAssignment}
      partnerExpectations={partnerExpectations}
    />
  ) : (
    <BeforeMarriageDashboard
      onNavigate={onNavigate}
      profileName={profile.full_name}
      assessments={assessments}
      redFlags={redFlags}
      assignedMentor={assignedMentor}
      mentorAssignment={mentorAssignment}
      partnerExpectations={partnerExpectations}
    />
  );
}

type CommonDataProps = {
  onNavigate: (page: string) => void;
  profileName: string;
  assessments: CompatibilityAssessment[];
  redFlags: RedFlag[];
  assignedMentor: Mentor | null;
  mentorAssignment: MentorAssignment | null;
  partnerExpectations: StoredThought[];
};

type CoupleDataProps = CommonDataProps & {
  hasPartnerConnected: boolean;
  healthRecords: RelationshipHealth[];
  jointSessions: CoupleAssessmentSession[];
  pulseSessions: PulseCheckSession[];
  profileId: string;
};

function BeforeMarriageDashboard({ onNavigate, profileName, assessments, redFlags, assignedMentor, mentorAssignment, partnerExpectations }: CommonDataProps) {
  const latestAssessment = assessments[0];
  const highRisk = redFlags.filter((entry) => entry.severity === 'high').length;

  // Smart nudge conditions
  const hasHighRiskFlags = highRisk > 0;
  const hasNoAssessments = assessments.length === 0;

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-10 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero banner — stagger-0 (instant) */}
        <section className="animate-rise-in relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#2a2826] to-[#4a4642] px-8 py-12 shadow-2xl shadow-stone-900/20 sm:px-12 noise-overlay">
          <div className="absolute top-0 right-0 h-64 w-64 bg-white/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white border border-white/20 shadow-sm">
              Before Marriage Dashboard
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Welcome, {profileName}
            </h1>
            <p className="mt-4 text-indigo-100 text-lg max-w-xl leading-relaxed">
              Decide with clarity. Use the assessments below to gain data-backed insights on compatibility and potential red flags.
            </p>
          </div>
        </section>

        {/* Smart Nudges — stagger-1 */}
        <div className="stagger-1 space-y-3">
          {hasNoAssessments && (
            <div className="smart-nudge glass-tier-floating" style={{ borderLeftColor: 'var(--brand-indigo)' }}>
              <div className="nudge-icon" style={{ backgroundColor: 'var(--brand-indigo-light)', color: 'var(--brand-indigo)' }}>
                <Bell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Start your first assessment</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Run a Compatibility Deep Scan to get your baseline score.</p>
              </div>
              <button onClick={() => onNavigate('quiz')} className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5" style={{ backgroundColor: 'var(--brand-indigo)', color: '#fff' }}>
                Start Now
              </button>
            </div>
          )}
          {hasHighRiskFlags && (
            <div className="smart-nudge glass-tier-floating" style={{ borderLeftColor: 'var(--brand-rose)' }}>
              <div className="nudge-icon" style={{ backgroundColor: 'var(--brand-rose-light)', color: 'var(--brand-rose)' }}>
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{highRisk} high-severity red flag{highRisk > 1 ? 's' : ''} detected</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Review your behavioral risk analysis for critical insights.</p>
              </div>
              <button onClick={() => onNavigate('pre-marriage-analysis')} className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5" style={{ backgroundColor: 'var(--brand-rose)', color: '#fff' }}>
                Review
              </button>
            </div>
          )}
        </div>

        {/* Metrics — stagger-2 */}
        <section className="stagger-2 grid sm:grid-cols-3 gap-5">
          <MetricCard theme="coral" icon={<ClipboardList size={22} />} label="Assessments" value={String(assessments.length)} helper="Completed reports" />
          <MetricCard theme="coral" icon={<TrendingUp size={22} />} label="Latest Compatibility" value={latestAssessment ? `${latestAssessment.total_score}%` : 'N/A'} helper="Most recent score" numericValue={latestAssessment?.total_score} />
          <MetricCard theme="rose" icon={<ShieldAlert size={22} />} label="High Risk Flags" value={String(highRisk)} helper="Needs careful review" />
        </section>

        {/* Main grid — stagger-3/4 */}
        <div className="grid lg:grid-cols-[1fr,300px] gap-8">
          <section
            className="stagger-3 premium-card p-8"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Sparkles className="text-indigo-500" size={22} />
              Recommended Resources
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {beforeMarriageServices.map((service) => (
                <ServiceCard key={service.name} service={service} onNavigate={onNavigate} color="coral" />
              ))}
            </div>
          </section>

          <div className="stagger-4">
            <QuickActionsPanel
              theme="coral"
              tip="Identify systemic structural risks and hidden mismatches beneath the surface."
              actions={[
                { label: 'Start Relationship Stress Test', onClick: () => onNavigate('relationship-stress-test'), variant: 'primary' },
                { label: 'Expectation Resolver™', onClick: () => onNavigate('expectation-resolver'), variant: 'primary' },
                { label: 'Start Compatibility Assessment', onClick: () => onNavigate('quiz'), variant: 'secondary' },
                { label: 'Run Deep Behavior Analysis', onClick: () => onNavigate('pre-marriage-analysis'), variant: 'secondary' },
              ]}
            />
          </div>
        </div>

        {/* Chat with Mentor widget — stagger-5 */}
        <div className="stagger-5">
          <MentorChatWidget assignedMentor={assignedMentor} mentorAssignment={mentorAssignment} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}

function AfterMarriageDashboard({
  onNavigate,
  profileName,
  assessments,
  redFlags,
  healthRecords,
  hasPartnerConnected,
  jointSessions,
  pulseSessions,
  profileId,
  assignedMentor,
  mentorAssignment,
  partnerExpectations,
}: CoupleDataProps) {
  const latestJointSession = jointSessions[0];
  const latestAssessment = assessments[0];
  const latestHealth = healthRecords[0];
  const highRisk = redFlags.filter((entry) => entry.severity === 'high').length;

  const pendingPulse = pulseSessions.find((s) => s.status === 'pending_partner' && s.partner_id === profileId);
  const completedPulses = pulseSessions.filter((s) => s.status === 'completed');
  const latestCompletedPulse = completedPulses[0];

  const partnerInsights = useMemo(() => {
    if (!latestCompletedPulse) return null;
    const isInitiator = latestCompletedPulse.initiator_id === profileId;
    const pResponses = (isInitiator ? latestCompletedPulse.partner_responses : latestCompletedPulse.initiator_responses) as Record<string, any> | null;
    if (!pResponses) return null;
    return {
      gratitude: pResponses.gratitude_message,
      wish: pResponses.wish_partner_knew,
      improvement: pResponses.improvement_suggestion,
    };
  }, [latestCompletedPulse, profileId]);

  const jointReport = latestJointSession?.report as any;
  const alignmentScore = jointReport?.overall_compatibility_percent;

  const alignmentHelper = useMemo(() => {
    if (!jointReport?.category_scores) return 'Most recent joint score';
    const categories = Object.entries(jointReport.category_scores)
      .map(([cat, score]) => `${cat}: ${score}%`)
      .join(' | ');
    return categories || 'Most recent joint score';
  }, [jointReport]);

  const healthLabel = useMemo(() => {
    if (!latestHealth) return 'Not Tracked';
    if (latestHealth.overall_score >= 80) return 'Strong';
    if (latestHealth.overall_score >= 60) return 'Stable';
    return 'Needs Attention';
  }, [latestHealth]);

  // Smart nudge conditions
  const lastHealthDate = latestHealth ? new Date(latestHealth.recorded_at || latestHealth.created_at || '') : null;
  const healthIsStale = !lastHealthDate || (Date.now() - lastHealthDate.getTime() > 7 * 24 * 60 * 60 * 1000);
  const lastPulseDate = completedPulses[0] ? new Date(completedPulses[0].created_at || '') : null;
  const pulseIsStale = !lastPulseDate || (Date.now() - lastPulseDate.getTime() > 7 * 24 * 60 * 60 * 1000);

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-10 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero banner — stagger-0 */}
        <section className="animate-rise-in relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#3d4f40] to-[#5c7c64] px-8 py-12 shadow-2xl shadow-emerald-900/10 sm:px-12 noise-overlay">
          <div className="absolute top-0 right-0 h-64 w-64 bg-white/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white border border-white/20 shadow-sm">
              <Users size={13} className="mr-1.5" /> After Marriage Dashboard
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Welcome, {profileName}
            </h1>
            <p className="mt-4 text-emerald-100 text-lg max-w-xl leading-relaxed">
              Joint-account workflow for couples to repair communication, reduce conflict, and rebuild connection.
            </p>
          </div>
        </section>

        {/* Smart Nudges — stagger-1 */}
        <div className="stagger-1 space-y-3">
          {/* Partner connection alert */}
          {!hasPartnerConnected && (
            <div className="smart-nudge glass-tier-floating" style={{ borderLeftColor: '#f59e0b' }}>
              <div className="nudge-icon" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                <Link2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Joint Account Required</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Connect your partner to unlock couple features.</p>
              </div>
              <button onClick={() => onNavigate('quiz')} className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 shrink-0" style={{ backgroundColor: '#f59e0b', color: '#451a03' }}>
                Connect <ArrowRight size={12} className="inline ml-1" />
              </button>
            </div>
          )}

          {/* Pending Pulse Alert */}
          {hasPartnerConnected && pendingPulse && (
            <div className="smart-nudge glass-tier-floating" style={{ borderLeftColor: '#10b981' }}>
              <div className="nudge-icon" style={{ backgroundColor: 'rgba(92,124,100,0.1)', color: '#5c7c64' }}>
                <Heart size={18} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Partner's Pulse Check Waiting</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Your partner completed their half. Respond to see joint results!</p>
              </div>
              <button onClick={() => onNavigate('couple-pulse-check')} className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 shrink-0" style={{ backgroundColor: 'var(--brand-emerald)', color: '#fff' }}>
                Respond <ArrowRight size={12} className="inline ml-1" />
              </button>
            </div>
          )}

          {/* Health tracking nudge */}
          {hasPartnerConnected && healthIsStale && (
            <div className="smart-nudge glass-tier-floating" style={{ borderLeftColor: '#14b8a6' }}>
              <div className="nudge-icon" style={{ backgroundColor: 'rgba(20,184,166,0.1)', color: '#14b8a6' }}>
                <Activity size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Weekly health check-in due</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Track your relationship health to see trends over time.</p>
              </div>
              <button onClick={() => onNavigate('health-tracker')} className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 shrink-0" style={{ backgroundColor: 'var(--brand-emerald)', color: '#fff' }}>
                Track Now
              </button>
            </div>
          )}

          {/* Pulse check nudge */}
          {hasPartnerConnected && !pendingPulse && pulseIsStale && (
            <div className="smart-nudge glass-tier-floating" style={{ borderLeftColor: '#8b5cf6' }}>
              <div className="nudge-icon" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                <Bell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Weekly Couple Pulse is due</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Start a new pulse assessment with your partner.</p>
              </div>
              <button onClick={() => onNavigate('couple-pulse-check')} className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 shrink-0" style={{ backgroundColor: 'var(--brand-indigo)', color: '#fff' }}>
                Start Pulse
              </button>
            </div>
          )}
        </div>

        {/* Partner Insights Widget — stagger-2 */}
        {partnerInsights && (
          <section className="stagger-2 premium-card p-8 bg-gradient-to-br from-[#fdfcfb] to-[#f7f3f0] border-[#2a2826]/5">
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3 text-[#2a2826]">
              <MessageCircleHeart className="text-[#a65d50]" size={24} /> Partner Insights
            </h2>
            <p className="text-sm text-[#57524e]/70 mb-6 font-medium">Direct quotes from your partner's latest Pulse Check</p>
            <div className="grid md:grid-cols-3 gap-5">
              <div className="glass-tier-elevated p-5 rounded-2xl">
                <h3 className="label-clinical text-[#d97757] mb-3 flex items-center gap-2">
                  <Heart size={14} className="text-[#a65d50]" /> Gratitude
                </h3>
                <p className="text-sm font-medium text-[#2a2826] italic leading-relaxed">
                  "{partnerInsights.gratitude || 'No specific gratitude recorded this week.'}"
                </p>
              </div>
              <div className="glass-tier-elevated p-5 rounded-2xl">
                <h3 className="label-clinical text-[#d97757] mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-[#d97757]" /> What they wish you knew
                </h3>
                <p className="text-sm font-medium text-[#2a2826] italic leading-relaxed">
                  "{partnerInsights.wish || 'Communication felt clear this week.'}"
                </p>
              </div>
              <div className="glass-tier-elevated p-5 rounded-2xl">
                <h3 className="label-clinical text-[#d97757] mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#5c7c64]" /> Room for Growth
                </h3>
                <p className="text-sm font-medium text-[#2a2826] italic leading-relaxed">
                  "{partnerInsights.improvement || 'Nothing specific right now.'}"
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Metrics — stagger-3 */}
        <section className="stagger-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard theme="teal" icon={<Users size={22} />} label="Joint Status" value={hasPartnerConnected ? 'Connected' : 'Pending'} helper="Partner linked" />
          <MetricCard
            theme="coral"
            icon={<Heart size={22} />}
            label="Couples Alignment"
            value={alignmentScore ? `${alignmentScore}%` : (latestAssessment ? `${latestAssessment.total_score}%` : 'N/A')}
            helper={alignmentHelper}
            numericValue={alignmentScore || latestAssessment?.total_score}
          />
          <MetricCard theme="rose" icon={<AlertTriangle size={22} />} label="High Risk Flags" value={String(highRisk)} helper="Urgent issues" />
          <MetricCard theme="sage" icon={<MessageCircleHeart size={22} />} label="Relationship Health" value={healthLabel} helper={latestHealth ? `Overall ${latestHealth.overall_score}%` : 'Track it now'} numericValue={latestHealth?.overall_score} />
        </section>

        {/* Main grid — stagger-4/5 */}
        <div className="grid lg:grid-cols-[1fr,300px] gap-8">
          <section
            className="stagger-4 premium-card p-8"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Handshake className="text-emerald-500" size={22} />
              Couple Services
            </h2>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {afterMarriageServices.map((service) => (
                <ServiceCard
                  key={service.name}
                  service={service}
                  onNavigate={onNavigate}
                  disabled={!hasPartnerConnected && service.targetPage !== 'quiz'}
                  color="sage"
                />
              ))}
            </div>
          </section>

          <div className="stagger-5">
            <QuickActionsPanel
              theme="sage"
              tip="Review the Relationship Health once a week together with your partner."
              actions={[
                { label: 'Open Couple Assessment', onClick: () => onNavigate('quiz'), variant: 'primary' },
                { label: 'Track Relationship Health', onClick: () => onNavigate('health-tracker'), variant: 'secondary', disabled: !hasPartnerConnected },
                { label: 'Start Conflict Program', onClick: () => onNavigate('conflict-resolution'), variant: 'secondary', disabled: !hasPartnerConnected },
                { label: 'Start Couple Pulse', onClick: () => onNavigate('couple-pulse-check'), variant: 'secondary', disabled: !hasPartnerConnected },
              ]}
            />
          </div>
        </div>

        {/* Chat with Mentor widget — stagger-6 */}
        <div className="stagger-6">
          <MentorChatWidget assignedMentor={assignedMentor} mentorAssignment={mentorAssignment} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}

// ── Quick Actions Panel ───────────────────────────────────────────────────────
type ActionDef = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

function QuickActionsPanel({ theme, tip, actions }: {
  theme: 'coral' | 'sage';
  tip: string;
  actions: ActionDef[];
}) {
  const accentColor = theme === 'coral' ? '#d97757' : '#5c7c64';
  const accentLight = theme === 'coral' ? 'rgba(217,119,87,0.08)' : 'rgba(92,124,100,0.08)';
  const accentBorder = theme === 'coral' ? 'rgba(217,119,87,0.2)' : 'rgba(92,124,100,0.2)';

  return (
    <section
      className="premium-card p-8 flex flex-col"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
        Quick Actions
      </h2>
      <div className="flex flex-col gap-3 flex-grow">
        {actions.map((a) => (
          <ActionButton
            key={a.label}
            onClick={a.onClick}
            label={a.label}
            variant={a.variant}
            disabled={a.disabled}
            theme={theme}
          />
        ))}
      </div>
      <div
        className="mt-8 rounded-2xl px-5 py-4 border"
        style={{ backgroundColor: accentLight, borderColor: accentBorder }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>
          Next Step
        </p>
        <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {tip}
        </p>
      </div>
    </section>
  );
}

// ── ServiceCard ──────────────────────────────────────────────────────────────
type ServiceCardProps = {
  service: ServiceItem;
  onNavigate: (page: string) => void;
  disabled?: boolean;
  color: 'coral' | 'sage';
};

function ServiceCard({ service, onNavigate, disabled = false, color }: ServiceCardProps) {
  const isPremium = service.priceLabel === 'PREMIUM';

  const colorTokens = {
    coral: {
      badgeBg: 'var(--brand-indigo-light)',
      badgeColor: 'var(--brand-indigo)',
      premiumBg: 'rgba(217,119,87,0.15)',
      premiumColor: '#d97757',
      checkColor: 'var(--brand-indigo)',
      btnBg: 'var(--brand-indigo)',
      btnBgHover: '#bf664a',
    },
    sage: {
      badgeBg: 'var(--brand-emerald-light)',
      badgeColor: 'var(--brand-emerald)',
      premiumBg: 'rgba(92,124,100,0.15)',
      premiumColor: '#5c7c64',
      checkColor: 'var(--brand-emerald)',
      btnBg: 'var(--brand-emerald)',
      btnBgHover: '#4d6854',
    },
  };

  const t = colorTokens[color];

  return (
    <article
      className={`premium-card p-6 flex flex-col transition-all duration-200 ${disabled ? 'opacity-60' : 'hover:-translate-y-1'}`}
      style={{ backgroundColor: disabled ? 'var(--bg-tertiary)' : 'var(--bg-secondary)' }}
    >
      <div>
        <span
          className="badge mb-4"
          style={{
            backgroundColor: isPremium ? t.premiumBg : t.badgeBg,
            color: isPremium ? t.premiumColor : t.badgeColor,
          }}
        >
          {service.priceLabel}
        </span>
        <h3 className="text-base font-extrabold leading-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
          {service.name}
        </h3>
        <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {service.description}
        </p>
        <ul className="space-y-2 mb-5">
          {service.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: t.checkColor }} />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      <div
        className="mt-auto pt-4 border-t"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <button
          onClick={() => onNavigate(service.targetPage)}
          disabled={disabled}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-ring"
          style={{ backgroundColor: t.btnBg }}
          onMouseEnter={(e) => !disabled && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = t.btnBgHover)}
          onMouseLeave={(e) => !disabled && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = t.btnBg)}
        >
          {service.cta} <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}

// ── ActionButton ─────────────────────────────────────────────────────────────
type ActionButtonProps = {
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  theme: 'coral' | 'sage';
};

function ActionButton({ onClick, label, variant = 'primary', disabled = false, theme }: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  const primaryBg = theme === 'coral' ? 'var(--brand-indigo)' : 'var(--brand-emerald)';
  const primaryHover = theme === 'coral' ? '#bf664a' : '#4d6854';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl px-5 py-3.5 text-sm w-full font-bold transition-all border text-left flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
      style={
        isPrimary
          ? { backgroundColor: primaryBg, borderColor: 'transparent', color: '#fff' }
          : { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }
      }
      onMouseEnter={(e) => {
        if (disabled) return;
        if (isPrimary) (e.currentTarget as HTMLButtonElement).style.backgroundColor = primaryHover;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (isPrimary) (e.currentTarget as HTMLButtonElement).style.backgroundColor = primaryBg;
      }}
    >
      <span>{label}</span>
      <ArrowRight size={15} className={`transition-transform opacity-60 ${!disabled ? 'group-hover:translate-x-1' : ''}`} />
    </button>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────
type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  theme: 'coral' | 'sage' | 'rose' | 'blue' | 'teal' | 'red';
  numericValue?: number;
};

const metricThemeMap: Record<string, { bg: string; color: string }> = {
  coral: { bg: 'rgba(217,119,87,0.1)', color: '#d97757' },
  sage: { bg: 'rgba(92,124,100,0.1)', color: '#5c7c64' },
  rose: { bg: 'rgba(166,93,80,0.1)', color: '#a65d50' },
  blue: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  teal: { bg: 'rgba(20,184,166,0.1)', color: '#14b8a6' },
  red: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
};

function MetricCard({ icon, label, value, helper, theme, numericValue }: MetricCardProps) {
  const t = metricThemeMap[theme] ?? metricThemeMap.coral;
  const isHighScore = typeof numericValue === 'number' && numericValue >= 80;

  return (
    <article
      className={`premium-card p-6 relative overflow-hidden group ${isHighScore ? 'glow-bloom' : ''}`}
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Glow blob */}
      <div
        className="absolute top-0 right-0 w-24 h-24 blur-2xl rounded-full opacity-20 -z-10 translate-x-1/2 -translate-y-1/2 transition-opacity group-hover:opacity-40 pointer-events-none"
        style={{ backgroundColor: t.color }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className="rounded-2xl p-3 shadow-inner"
          style={{ backgroundColor: t.bg, color: t.color }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className={`text-3xl font-extrabold tracking-tight ${isHighScore ? 'data-pulse' : ''}`} style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        <p className="label-clinical mt-1" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </p>
        <p className="text-xs font-semibold mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {helper}
        </p>
      </div>
    </article>
  );
}

// ── MentorChatWidget ─────────────────────────────────────────────────────────

function MentorChatWidget({
  assignedMentor,
  mentorAssignment,
  onNavigate,
}: {
  assignedMentor: Mentor | null;
  mentorAssignment: MentorAssignment | null;
  onNavigate: (page: string) => void;
}) {
  return (
    <section className="premium-card p-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <h2
        className="text-xl font-extrabold mb-4 flex items-center gap-3"
        style={{ color: 'var(--text-primary)' }}
      >
        <MessageCircleHeart className="text-violet-500" size={22} />
        Chat with Your Mentor
      </h2>

      {assignedMentor && mentorAssignment ? (
        <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}
            >
              {assignedMentor.full_name[0]?.toUpperCase() || 'M'}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {assignedMentor.full_name}
              </p>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {assignedMentor.specialization}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('chat')}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-sm focus-ring shrink-0"
            style={{ backgroundColor: '#8b5cf6' }}
          >
            <MessageCircleHeart size={15} /> Open Chat
          </button>
        </div>
      ) : (
        <div
          className="text-center py-10 rounded-2xl border-2 border-dashed"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <MessageCircleHeart size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
            No mentor assigned yet
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            A mentor will be assigned to you by the admin. Check back soon!
          </p>
        </div>
      )}
    </section>
  );
}