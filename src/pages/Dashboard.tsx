import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CompatibilityAssessment, RedFlag, RelationshipHealth, supabase } from '../lib/supabase';
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
  targetPage: 'quiz' | 'red-flags' | 'health-tracker';
};

const beforeMarriageServices: ServiceItem[] = [
  {
    name: 'Basic Compatibility Quiz',
    priceLabel: 'FREE',
    description: 'Get a quick assessment of your relationship compatibility.',
    bullets: ['Values alignment check', 'Lifestyle compatibility', 'Basic communication assessment'],
    cta: 'Start Free Quiz',
    targetPage: 'quiz',
  },
  {
    name: 'Advanced Compatibility Report',
    priceLabel: 'INR 499',
    description: 'Deep analysis with risk scoring and recommendations.',
    bullets: ['Detailed scoring', 'Risk factor identification', 'Personalized recommendations'],
    cta: 'Generate Advanced Report',
    targetPage: 'quiz',
  },
  {
    name: 'Red Flag Deep Analysis',
    priceLabel: 'INR 799',
    description: 'Identify potential warning signs before commitment.',
    bullets: ['Behavior pattern analysis', 'Warning indicators', 'Guided interpretation'],
    cta: 'Run Deep Red Flag Analysis',
    targetPage: 'red-flags',
  },
  {
    name: '1:1 Decision Clarity Session',
    priceLabel: 'INR 1,999',
    description: 'Personal coaching to help you decide with confidence.',
    bullets: ['Private clarity framework', 'Decision structure', 'Follow-up guidance'],
    cta: 'Prepare Decision Session',
    targetPage: 'quiz',
  },
  {
    name: 'Pre-Marriage Readiness Program',
    priceLabel: 'INR 4,999',
    description: 'Structured preparation for a stronger marriage foundation.',
    bullets: ['Communication preparation', 'Financial alignment prep', 'Conflict framework'],
    cta: 'Start Readiness Program',
    targetPage: 'quiz',
  },
  {
    name: 'Decision Confidence Score',
    priceLabel: 'INR 299',
    description: 'Final confidence indicator based on your complete assessment data.',
    bullets: ['Risk vs confidence output', 'Clarity score', 'Action recommendation'],
    cta: 'Get Confidence Score',
    targetPage: 'quiz',
  },
  {
    name: 'Compatibility Deep Scan',
    priceLabel: 'Included',
    description: 'Assess long-term alignment before commitment.',
    bullets: ['Values fit score', 'Lifestyle alignment', 'Communication gaps'],
    cta: 'Start Compatibility',
    targetPage: 'quiz',
  },
  {
    name: 'Red Flag Intelligence',
    priceLabel: 'Included',
    description: 'Identify high-risk issues early, not after damage.',
    bullets: ['Behavior risk map', 'Severity insights', 'Action steps'],
    cta: 'Run Red Flag Check',
    targetPage: 'red-flags',
  },
];

const afterMarriageServices: ServiceItem[] = [
  {
    name: 'Relationship Health Dashboard',
    priceLabel: 'FREE',
    description: 'Track relationship metrics and progress over time.',
    bullets: ['Weekly health check-ins', 'Trend visualization', 'Improvement signals'],
    cta: 'Open Health Dashboard',
    targetPage: 'health-tracker',
  },
  {
    name: 'Conflict Resolution Program',
    priceLabel: 'INR 2,999',
    description: 'Build practical conflict resolution habits as a couple.',
    bullets: ['De-escalation patterns', 'Repair communication', 'Guided action steps'],
    cta: 'Start Conflict Program',
    targetPage: 'red-flags',
  },
  {
    name: 'Emotional Intimacy Rebuild',
    priceLabel: 'INR 3,999',
    description: 'Rebuild trust, emotional closeness, and consistent communication.',
    bullets: ['Connection exercises', 'Trust rebuilding', 'Intimacy improvement plan'],
    cta: 'Begin Rebuild Journey',
    targetPage: 'health-tracker',
  },
  {
    name: 'Crisis Recovery Plan',
    priceLabel: 'INR 7,999',
    description: 'Intensive support for high-conflict or unstable phases.',
    bullets: ['Urgent issue stabilization', 'Recovery roadmap', 'Priority intervention flow'],
    cta: 'Activate Recovery Plan',
    targetPage: 'red-flags',
  },
  {
    name: 'Premium Couple Coaching',
    priceLabel: 'INR 9,999',
    description: 'High-touch ongoing support for long-term relationship growth.',
    bullets: ['Couple growth strategy', 'Ongoing check-ins', 'Priority support model'],
    cta: 'Start Premium Coaching',
    targetPage: 'quiz',
  },
  {
    name: 'Couple Assessment Sessions',
    priceLabel: 'Included',
    description: 'Joint scoring and clarity framework for both partners.',
    bullets: ['Private partner submissions', 'Shared report output', 'Risk-weighted analysis'],
    cta: 'Open Couple Assessment',
    targetPage: 'quiz',
  },
  {
    name: 'Relationship Health Tracking',
    priceLabel: 'Included',
    description: 'Monitor communication and emotional recovery over time.',
    bullets: ['Health snapshots', 'Trend visibility', 'Improvement tracking'],
    cta: 'Track Relationship Health',
    targetPage: 'health-tracker',
  },
  {
    name: 'Conflict Risk Monitor',
    priceLabel: 'Included',
    description: 'Catch repeat patterns causing fights and emotional distance.',
    bullets: ['Trigger identification', 'Risk severity', 'Stability guidance'],
    cta: 'Check Conflict Risks',
    targetPage: 'red-flags',
  },
];

export function Dashboard({ mode, onNavigate }: DashboardProps) {
  const { profile, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<CompatibilityAssessment[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [healthRecords, setHealthRecords] = useState<RelationshipHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      try {
        const [assessmentsData, redFlagsData, healthData] = await Promise.all([
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
        ]);

        if (assessmentsData.data) setAssessments(assessmentsData.data);
        if (redFlagsData.data) setRedFlags(redFlagsData.data);
        if (healthData.data) setHealthRecords(healthData.data);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
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
};

function BeforeMarriageDashboard({ onNavigate, profileName, assessments, redFlags }: CommonDataProps) {
  const latestAssessment = assessments[0];
  const highRisk = redFlags.filter((entry) => entry.severity === 'high').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        <section className="rounded-3xl bg-gradient-to-r from-amber-700 to-rose-600 text-white px-6 py-8 shadow-xl">
          <p className="text-amber-100 text-sm uppercase tracking-wide font-semibold">Before Marriage Dashboard</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-2">Welcome, {profileName}</h1>
          <p className="mt-2 text-amber-50">Make a confident decision with data-backed compatibility and red-flag insights.</p>
        </section>

        <section className="grid md:grid-cols-3 gap-5">
          <MetricCard icon={<ClipboardList className="text-blue-600" size={24} />} label="Assessments" value={String(assessments.length)} helper="Completed reports" />
          <MetricCard icon={<TrendingUp className="text-emerald-600" size={24} />} label="Latest Compatibility" value={latestAssessment ? `${latestAssessment.total_score}%` : 'N/A'} helper="Most recent score" />
          <MetricCard icon={<ShieldAlert className="text-red-600" size={24} />} label="High Risk Flags" value={String(highRisk)} helper="Needs careful review" />
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Sparkles size={18} /> Services For You</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {beforeMarriageServices.map((service) => (
              <ServiceCard key={service.name} service={service} onNavigate={onNavigate} />
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <ActionButton onClick={() => onNavigate('quiz')} label="Start Compatibility Assessment" />
            <ActionButton onClick={() => onNavigate('red-flags')} label="Run Red Flag Checker" variant="secondary" />
          </div>
        </section>
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
}: CoupleDataProps) {
  const latestAssessment = assessments[0];
  const latestHealth = healthRecords[0];
  const highRisk = redFlags.filter((entry) => entry.severity === 'high').length;

  const healthLabel = useMemo(() => {
    if (!latestHealth) return 'Not Tracked';
    if (latestHealth.overall_score >= 80) return 'Strong';
    if (latestHealth.overall_score >= 60) return 'Stable';
    return 'Needs Attention';
  }, [latestHealth]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        <section className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-600 text-white px-6 py-8 shadow-xl">
          <p className="text-emerald-100 text-sm uppercase tracking-wide font-semibold">After Marriage Dashboard</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-2">Welcome, {profileName}</h1>
          <p className="mt-2 text-emerald-50">Joint-account workflow for couples to repair communication, reduce conflict, and rebuild connection.</p>
        </section>

        {!hasPartnerConnected && (
          <section className="rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-900 flex items-center gap-2"><Link2 size={18} /> Joint Account Required</h2>
            <p className="text-amber-800 mt-2">
              Couples dashboard features require an active partner connection. Open Couple Assessment and send/accept partner invitation to continue.
            </p>
            <button
              onClick={() => onNavigate('quiz')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 transition"
            >
              Connect Partner Now <ArrowRight size={16} />
            </button>
          </section>
        )}

        <section className="grid md:grid-cols-4 gap-5">
          <MetricCard icon={<Users className="text-teal-600" size={24} />} label="Joint Status" value={hasPartnerConnected ? 'Connected' : 'Pending'} helper="Partner account linkage" />
          <MetricCard icon={<Heart className="text-rose-600" size={24} />} label="Latest Compatibility" value={latestAssessment ? `${latestAssessment.total_score}%` : 'N/A'} helper="Most recent couple score" />
          <MetricCard icon={<AlertTriangle className="text-red-600" size={24} />} label="High Risk Flags" value={String(highRisk)} helper="Conflict severity alerts" />
          <MetricCard icon={<MessageCircleHeart className="text-indigo-600" size={24} />} label="Relationship Health" value={healthLabel} helper={latestHealth ? `Overall ${latestHealth.overall_score}%` : 'Start tracking now'} />
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Handshake size={18} /> Couple Services</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {afterMarriageServices.map((service) => (
              <ServiceCard key={service.name} service={service} onNavigate={onNavigate} disabled={!hasPartnerConnected && service.targetPage !== 'quiz'} />
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <ActionButton onClick={() => onNavigate('quiz')} label="Open Couple Assessment" />
            <ActionButton onClick={() => onNavigate('health-tracker')} label="Track Relationship Health" variant="secondary" disabled={!hasPartnerConnected} />
            <ActionButton onClick={() => onNavigate('red-flags')} label="Check Conflict Risks" variant="secondary" disabled={!hasPartnerConnected} />
          </div>
        </section>
      </div>
    </div>
  );
}

type ServiceCardProps = {
  service: ServiceItem;
  onNavigate: (page: 'quiz' | 'red-flags' | 'health-tracker') => void;
  disabled?: boolean;
};

function ServiceCard({ service, onNavigate, disabled = false }: ServiceCardProps) {
  return (
    <article className={`rounded-xl border p-4 ${disabled ? 'border-slate-200 bg-slate-100' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{service.priceLabel}</p>
      <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
      <p className="text-sm text-slate-600 mt-1">{service.description}</p>
      <ul className="mt-3 space-y-1.5">
        {service.bullets.map((bullet) => (
          <li key={bullet} className="text-sm text-slate-700 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            {bullet}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onNavigate(service.targetPage)}
        disabled={disabled}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-45 disabled:cursor-not-allowed"
      >
        {service.cta} <ArrowRight size={14} />
      </button>
    </article>
  );
}

type ActionButtonProps = {
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

function ActionButton({ onClick, label, variant = 'primary', disabled = false }: ActionButtonProps) {
  const className =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 font-semibold transition ${className} disabled:opacity-45 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
};

function MetricCard({ icon, label, value, helper }: MetricCardProps) {
  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="rounded-lg bg-slate-100 p-2">{icon}</div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="text-xs text-slate-500 mt-1">{helper}</p>
    </article>
  );
}
