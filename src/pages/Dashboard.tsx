import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CompatibilityAssessment, RedFlag, RelationshipHealth, supabase, CoupleAssessmentSession, PulseCheckSession } from '../lib/supabase';
import {
  AlertTriangle,
  ArrowRight,
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
} from 'lucide-react';

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
  targetPage: 'quiz' | 'red-flags' | 'health-tracker' | 'pre-marriage-analysis' | 'conflict-resolution' | 'couple-pulse-check';
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
            style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366f1' }}
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
    />
  ) : (
    <BeforeMarriageDashboard
      onNavigate={onNavigate}
      profileName={profile.full_name}
      assessments={assessments}
      redFlags={redFlags}
    />
  );
}

type CommonDataProps = {
  onNavigate: (page: string) => void;
  profileName: string;
  assessments: CompatibilityAssessment[];
  redFlags: RedFlag[];
};

type CoupleDataProps = CommonDataProps & {
  hasPartnerConnected: boolean;
  healthRecords: RelationshipHealth[];
  jointSessions: CoupleAssessmentSession[];
  pulseSessions: PulseCheckSession[];
  profileId: string;
};

function BeforeMarriageDashboard({ onNavigate, profileName, assessments, redFlags }: CommonDataProps) {
  const latestAssessment = assessments[0];
  const highRisk = redFlags.filter((entry) => entry.severity === 'high').length;

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-10 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero banner */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-700 to-blue-600 px-8 py-12 shadow-2xl shadow-indigo-900/20 sm:px-12 noise-overlay">
          <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-widest text-white border border-white/30 shadow-sm">
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

        {/* Metrics */}
        <section className="grid sm:grid-cols-3 gap-5">
          <MetricCard theme="indigo" icon={<ClipboardList size={22} />} label="Assessments" value={String(assessments.length)} helper="Completed reports" />
          <MetricCard theme="blue" icon={<TrendingUp size={22} />} label="Latest Compatibility" value={latestAssessment ? `${latestAssessment.total_score}%` : 'N/A'} helper="Most recent score" />
          <MetricCard theme="rose" icon={<ShieldAlert size={22} />} label="High Risk Flags" value={String(highRisk)} helper="Needs careful review" />
        </section>

        {/* Main grid */}
        <div className="grid lg:grid-cols-[1fr,300px] gap-8">
          <section
            className="premium-card p-8"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Sparkles className="text-indigo-500" size={22} />
              Recommended Resources
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {beforeMarriageServices.map((service) => (
                <ServiceCard key={service.name} service={service} onNavigate={onNavigate} color="indigo" />
              ))}
            </div>
          </section>

          <QuickActionsPanel
            theme="indigo"
            tip="Consistency is key. Try running an assessment every week for trend tracking."
            actions={[
              { label: 'Start Compatibility Assessment', onClick: () => onNavigate('quiz'), variant: 'primary' },
              { label: 'Run Deep Behavior Analysis', onClick: () => onNavigate('pre-marriage-analysis'), variant: 'secondary' },
            ]}
          />
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

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-10 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero banner */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-700 to-teal-600 px-8 py-12 shadow-2xl shadow-emerald-900/20 sm:px-12 noise-overlay">
          <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-widest text-white border border-white/30 shadow-sm">
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

        {/* Partner connection alert */}
        {!hasPartnerConnected && (
          <section
            className="animate-rise-in rounded-[2rem] border-l-4 border-l-amber-500 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            style={{ backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderLeft: '4px solid #f59e0b' }}
          >
            <div>
              <h2 className="text-lg font-extrabold flex items-center gap-3 mb-2" style={{ color: '#92400e' }}>
                <Link2 size={20} className="text-amber-600" /> Joint Account Required
              </h2>
              <p className="text-sm font-medium max-w-2xl" style={{ color: '#78350f' }}>
                Couples dashboard features require an active partner connection. Open Couple Assessment to invite your partner or link accounts.
              </p>
            </div>
            <button
              onClick={() => onNavigate('quiz')}
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-bold text-amber-950 hover:bg-amber-400 transition-colors shadow-md focus-ring"
            >
              Connect Partner <ArrowRight size={16} />
            </button>
          </section>
        )}

        {/* Pending Pulse Alert */}
        {hasPartnerConnected && pendingPulse && (
          <section
            className="animate-rise-in rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-3 mb-2" style={{ color: '#064e3b' }}>
                <Heart size={24} className="text-emerald-600 animate-pulse" /> Action Needed: Partner's Pulse Check
              </h2>
              <p className="text-sm font-medium max-w-2xl" style={{ color: '#064e3b' }}>
                Your partner has completed their half of the weekly Couple Pulse Check. It's your turn to respond so you can both see the results!
              </p>
            </div>
            <button
              onClick={() => onNavigate('couple-pulse-check')}
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg focus-ring shrink-0"
            >
              Respond to Pulse <ArrowRight size={16} />
            </button>
          </section>
        )}

        {/* Partner Insights Widget */}
        {partnerInsights && (
          <section className="premium-card p-8 bg-gradient-to-br from-indigo-50 to-pink-50 border-indigo-100/50">
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3 text-indigo-900">
              <MessageCircleHeart className="text-pink-500" size={24} /> Partner Insights
            </h2>
            <p className="text-sm text-indigo-800/70 mb-6 font-medium">Direct quotes from your partner's latest Pulse Check</p>
            <div className="grid md:grid-cols-3 gap-5">
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-indigo-100 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                  <Heart size={14} className="text-pink-400" /> Gratitude
                </h3>
                <p className="text-sm font-medium text-indigo-900 italic leading-relaxed">
                  "{partnerInsights.gratitude || 'No specific gratitude recorded this week.'}"
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-indigo-100 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-400" /> What they wish you knew
                </h3>
                <p className="text-sm font-medium text-indigo-900 italic leading-relaxed">
                  "{partnerInsights.wish || 'Communication felt clear this week.'}"
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-indigo-100 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-400" /> Room for Growth
                </h3>
                <p className="text-sm font-medium text-indigo-900 italic leading-relaxed">
                  "{partnerInsights.improvement || 'Nothing specific right now.'}"
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Metrics */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard theme="teal" icon={<Users size={22} />} label="Joint Status" value={hasPartnerConnected ? 'Connected' : 'Pending'} helper="Partner linked" />
          <MetricCard
            theme="rose"
            icon={<Heart size={22} />}
            label="Couples Alignment"
            value={alignmentScore ? `${alignmentScore}%` : (latestAssessment ? `${latestAssessment.total_score}%` : 'N/A')}
            helper={alignmentHelper}
          />
          <MetricCard theme="red" icon={<AlertTriangle size={22} />} label="High Risk Flags" value={String(highRisk)} helper="Urgent issues" />
          <MetricCard theme="emerald" icon={<MessageCircleHeart size={22} />} label="Relationship Health" value={healthLabel} helper={latestHealth ? `Overall ${latestHealth.overall_score}%` : 'Track it now'} />
        </section>

        {/* Main grid */}
        <div className="grid lg:grid-cols-[1fr,300px] gap-8">
          <section
            className="premium-card p-8"
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
                  color="emerald"
                />
              ))}
            </div>
          </section>

          <QuickActionsPanel
            theme="emerald"
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
  theme: 'indigo' | 'emerald';
  tip: string;
  actions: ActionDef[];
}) {
  const accentColor = theme === 'indigo' ? '#6366f1' : '#10b981';
  const accentLight = theme === 'indigo' ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)';
  const accentBorder = theme === 'indigo' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)';

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
  color: 'indigo' | 'emerald';
};

function ServiceCard({ service, onNavigate, disabled = false, color }: ServiceCardProps) {
  const isPremium = service.priceLabel === 'PREMIUM';

  const colorTokens = {
    indigo: {
      badgeBg: 'rgba(99,102,241,0.1)',
      badgeColor: '#6366f1',
      premiumBg: 'rgba(245,158,11,0.1)',
      premiumColor: '#d97706',
      checkColor: '#6366f1',
      btnBg: '#4f46e5',
      btnBgHover: '#4338ca',
    },
    emerald: {
      badgeBg: 'rgba(16,185,129,0.1)',
      badgeColor: '#10b981',
      premiumBg: 'rgba(245,158,11,0.1)',
      premiumColor: '#d97706',
      checkColor: '#10b981',
      btnBg: '#059669',
      btnBgHover: '#047857',
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
  theme: 'indigo' | 'emerald';
};

function ActionButton({ onClick, label, variant = 'primary', disabled = false, theme }: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  const primaryBg = theme === 'indigo' ? '#4f46e5' : '#059669';
  const primaryHover = theme === 'indigo' ? '#4338ca' : '#047857';

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
  theme: 'indigo' | 'emerald' | 'rose' | 'blue' | 'teal' | 'red';
};

const metricThemeMap: Record<string, { bg: string; color: string }> = {
  indigo: { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
  emerald: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  rose: { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e' },
  blue: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  teal: { bg: 'rgba(20,184,166,0.1)', color: '#14b8a6' },
  red: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
};

function MetricCard({ icon, label, value, helper, theme }: MetricCardProps) {
  const t = metricThemeMap[theme] ?? metricThemeMap.indigo;

  return (
    <article
      className="premium-card p-6 relative overflow-hidden group"
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
        <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        <p className="text-xs font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </p>
        <p className="text-xs font-semibold mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {helper}
        </p>
      </div>
    </article>
  );
}