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
    targetPage: 'red-flags',
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
    targetPage: 'red-flags',
  },
  {
    name: 'Emotional Intimacy Rebuild',
    priceLabel: 'PREMIUM',
    description: 'Rebuild trust, emotional closeness, and communication.',
    bullets: ['Connection exercises', 'Trust rebuilding', 'Improvement plan'],
    cta: 'Begin Journey',
    targetPage: 'health-tracker',
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
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium tracking-wide">Loading workspace...</p>
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
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-700 to-blue-600 px-8 py-12 shadow-2xl shadow-indigo-900/20 sm:px-12">
          <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-widest text-white border border-white/30 shadow-sm">
              Before Marriage Dashboard
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold text-white tracking-tight">Welcome, {profileName}</h1>
            <p className="mt-4 text-indigo-100 text-lg max-w-xl leading-relaxed">
              Decide with clarity. Use the assessments below to gain data-backed insights on compatibility and potential red flags.
            </p>
          </div>
        </section>

        <section className="grid sm:grid-cols-3 gap-6">
          <MetricCard theme="indigo" icon={<ClipboardList size={24} />} label="Assessments" value={String(assessments.length)} helper="Completed reports" />
          <MetricCard theme="blue" icon={<TrendingUp size={24} />} label="Latest Compatibility" value={latestAssessment ? `${latestAssessment.total_score}%` : 'N/A'} helper="Most recent score" />
          <MetricCard theme="rose" icon={<ShieldAlert size={24} />} label="High Risk Flags" value={String(highRisk)} helper="Needs careful review" />
        </section>

        <div className="grid lg:grid-cols-[1fr,300px] gap-8">
          <section className="premium-card p-8 bg-white/80 backdrop-blur-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
              <Sparkles className="text-indigo-500" size={24} />
              Recommended Resources
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
              {beforeMarriageServices.map((service) => (
                <ServiceCard key={service.name} service={service} onNavigate={onNavigate} color="indigo" />
              ))}
            </div>
          </section>

          <section className="premium-card p-8 bg-gradient-to-b from-white to-slate-50/50 flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
            <div className="flex flex-col gap-4 flex-grow">
              <ActionButton onClick={() => onNavigate('quiz')} label="Start Compatibility Assessment" theme="indigo" />
              <ActionButton onClick={() => onNavigate('red-flags')} label="Run Red Flag Checker" variant="secondary" theme="indigo" />
            </div>
            <div className="mt-8 rounded-2xl bg-indigo-50 border border-indigo-100 p-5">
              <p className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Next Step</p>
              <p className="text-sm text-indigo-700 font-medium mt-1">Consistency is key. Try running an assessment every week for trend tracking.</p>
            </div>
          </section>
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
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-700 to-teal-600 px-8 py-12 shadow-2xl shadow-emerald-900/20 sm:px-12">
          <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-widest text-white border border-white/30 shadow-sm">
              <Users size={14} className="mr-1.5 inline-block" />
              After Marriage Dashboard
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold text-white tracking-tight">Welcome, {profileName}</h1>
            <p className="mt-4 text-emerald-100 text-lg max-w-xl leading-relaxed">
              Joint-account workflow for couples to repair communication, reduce conflict, and rebuild connection.
            </p>
          </div>
        </section>

        {!hasPartnerConnected && (
          <section className="animate-rise-in rounded-[2rem] border-l-8 border-l-amber-500 bg-amber-50/80 p-6 sm:p-8 shadow-sm backdrop-blur border border-r-amber-100 border-y-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-extrabold text-amber-900 flex items-center gap-3"><Link2 size={22} className="text-amber-600" /> Joint Account Required</h2>
              <p className="text-amber-800 font-medium mt-2 max-w-2xl">
                Couples dashboard features require an active partner connection. Open Couple Assessment to invite your partner or link accounts.
              </p>
            </div>
            <button
              onClick={() => onNavigate('quiz')}
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-bold text-amber-950 hover:bg-amber-400 transition-colors shadow-md"
            >
              Connect Partner <ArrowRight size={18} />
            </button>
          </section>
        )}

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard theme="teal" icon={<Users size={24} />} label="Joint Status" value={hasPartnerConnected ? 'Connected' : 'Pending'} helper="Partner linked" />
          <MetricCard theme="rose" icon={<Heart size={24} />} label="Couples Alignment" value={latestAssessment ? `${latestAssessment.total_score}%` : 'N/A'} helper="Most recent joint score" />
          <MetricCard theme="red" icon={<AlertTriangle size={24} />} label="High Risk Flags" value={String(highRisk)} helper="Urgent issues" />
          <MetricCard theme="emerald" icon={<MessageCircleHeart size={24} />} label="Relationship Health" value={healthLabel} helper={latestHealth ? `Overall ${latestHealth.overall_score}%` : 'Track it now'} />
        </section>

        <div className="grid lg:grid-cols-[1fr,300px] gap-8">
          <section className="premium-card p-8 bg-white/80 backdrop-blur-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
              <Handshake className="text-emerald-500" size={24} />
              Couple Services
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {afterMarriageServices.map((service) => (
                <ServiceCard key={service.name} service={service} onNavigate={onNavigate} disabled={!hasPartnerConnected && service.targetPage !== 'quiz'} color="emerald" />
              ))}
            </div>
          </section>

          <section className="premium-card p-8 bg-gradient-to-b from-white to-slate-50/50 flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Action Center</h2>
            <div className="flex flex-col gap-4 flex-grow">
              <ActionButton onClick={() => onNavigate('quiz')} label="Open Couple Assessment" theme="emerald" />
              <ActionButton onClick={() => onNavigate('health-tracker')} label="Track Relationship Health" variant="secondary" theme="emerald" disabled={!hasPartnerConnected} />
              <ActionButton onClick={() => onNavigate('red-flags')} label="Check Conflict Risks" variant="secondary" disabled={!hasPartnerConnected} theme="emerald" />
            </div>
            <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Tip</p>
              <p className="text-sm text-emerald-700 font-medium mt-1">Review the Relationship Health once a week together with your partner.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

type ServiceCardProps = {
  service: ServiceItem;
  onNavigate: (page: 'quiz' | 'red-flags' | 'health-tracker') => void;
  disabled?: boolean;
  color: 'indigo' | 'emerald';
};

function ServiceCard({ service, onNavigate, disabled = false, color }: ServiceCardProps) {
  const isPremium = service.priceLabel === 'PREMIUM';
  const colorMap = {
    indigo: {
      tag: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      icon: 'text-indigo-500',
      btn: 'bg-indigo-600 hover:bg-indigo-700',
      hover: 'hover:border-indigo-200 hover:shadow-indigo-900/5',
      premium: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    emerald: {
      tag: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: 'text-emerald-500',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
      hover: 'hover:border-emerald-200 hover:shadow-emerald-900/5',
      premium: 'text-amber-700 bg-amber-50 border-amber-200'
    }
  };

  const theme = colorMap[color];

  return (
    <article className={`premium-card p-6 flex flex-col transition-all duration-300 ${disabled ? 'opacity-60 bg-slate-50' : `bg-white ${theme.hover} hover:-translate-y-1`}`}>
      <div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border mb-4 ${isPremium ? theme.premium : theme.tag}`}>
          {service.priceLabel}
        </span>
        <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{service.name}</h3>
        <p className="text-sm text-slate-600 font-medium mt-2 line-clamp-2">{service.description}</p>
        <ul className="mt-5 space-y-2 mb-6">
          {service.bullets.map((bullet) => (
            <li key={bullet} className="text-sm font-medium text-slate-700 flex items-start gap-2.5">
              <CheckCircle2 size={16} className={`${theme.icon} flex-shrink-0 mt-0.5`} />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto pt-4 border-t border-slate-100">
        <button
          onClick={() => onNavigate(service.targetPage)}
          disabled={disabled}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all shadow-sm ${theme.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {service.cta} <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}

type ActionButtonProps = {
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  theme: 'indigo' | 'emerald';
};

function ActionButton({ onClick, label, variant = 'primary', disabled = false, theme }: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  const colorMap = {
    indigo: isPrimary ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border-transparent' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-indigo-200 shadow-sm',
    emerald: isPrimary ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border-transparent' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-emerald-200 shadow-sm',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-5 py-3.5 text-sm w-full font-bold transition-all border ${colorMap[theme]} disabled:opacity-50 disabled:cursor-not-allowed text-left flex items-center justify-between group`}
    >
      <span>{label}</span>
      <ArrowRight size={16} className={`transition-transform ${!disabled && 'group-hover:translate-x-1'} opacity-60`} />
    </button>
  );
}

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  theme: 'indigo' | 'emerald' | 'rose' | 'blue' | 'teal' | 'red';
};

function MetricCard({ icon, label, value, helper, theme }: MetricCardProps) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    teal: 'bg-teal-50 text-teal-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <article className="premium-card p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 blur-2xl rounded-full opacity-20 -z-10 translate-x-1/2 -translate-y-1/2 transition-opacity group-hover:opacity-40 ${colorMap[theme].split(' ')[0]}`}></div>
      <div className="flex items-start justify-between mb-4">
        <div className={`rounded-2xl p-3 shadow-inner ${colorMap[theme]}`}>{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wide">{label}</p>
        <p className="text-xs font-semibold text-slate-400 mt-2">{helper}</p>
      </div>
    </article>
  );
}
