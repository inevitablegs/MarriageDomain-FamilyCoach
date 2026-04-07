import { useState } from 'react';
import { CheckCircle, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ServicesProps = {
  onAuthClick: () => void;
  onNavigate: (page: string) => void;
};

export function Services({ onAuthClick, onNavigate }: ServicesProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'pre_marriage' | 'post_marriage'>('pre_marriage');

  const preMarriageServices = [
    {
      name: 'Basic Compatibility Quiz',
      price: 0,
      isFree: true,
      description: 'Get a quick assessment of your relationship compatibility',
      features: [
        'Values alignment check',
        'Lifestyle compatibility',
        'Basic communication assessment',
        'Instant results',
      ],
    },
    {
      name: 'Advanced Compatibility Report',
      price: 499,
      isFree: false,
      description: 'Deep analysis with risk scoring and recommendations',
      features: [
        'Comprehensive personality analysis',
        'Detailed compatibility scoring',
        'Risk factor identification',
        'Personalized recommendations',
        'PDF report download',
      ],
    },
    {
      name: 'Red Flag Deep Analysis',
      price: 799,
      isFree: false,
      description: 'Identify potential warning signs early',
      features: [
        'Behavior pattern analysis',
        'Emotional maturity assessment',
        'Conflict style evaluation',
        'Warning indicators',
        '30-minute expert review',
      ],
    },
    {
      name: '1:1 Decision Clarity Session',
      price: 1999,
      isFree: false,
      description: 'Personal coaching to help you make the right decision',
      features: [
        '60-minute private session',
        'Expert marriage coach',
        'Personalized action plan',
        'Decision framework',
        'Follow-up email support',
      ],
    },
    {
      name: 'Pre-Marriage Readiness Program',
      price: 4999,
      isFree: false,
      description: 'Complete preparation for a successful marriage',
      features: [
        '8-week structured program',
        'Communication skills training',
        'Financial planning module',
        'Conflict resolution techniques',
        'Family integration guidance',
        'Lifetime resource access',
      ],
      featured: true,
    },
    {
      name: 'Decision Confidence Score',
      price: 299,
      isFree: false,
      description: 'Final go/no-go indicator based on comprehensive analysis',
      features: [
        'All assessment data synthesis',
        'Clear confidence percentage',
        'Risk vs reward analysis',
        'Expert final recommendation',
      ],
    },
  ];

  const postMarriageServices = [
    {
      name: 'Conflict Resolution Program',
      price: 2999,
      isFree: false,
      description: 'Learn to handle disagreements constructively',
      features: [
        '4-week guided program',
        'Communication techniques',
        'De-escalation strategies',
        'Practice exercises',
        'Weekly coaching calls',
      ],
    },
    {
      name: 'Relationship Health Dashboard',
      price: 0,
      isFree: true,
      description: 'Track your relationship metrics over time',
      features: [
        'Weekly health check-ins',
        'Progress visualization',
        'Trend analysis',
        'Improvement suggestions',
      ],
    },
    {
      name: 'Crisis Recovery Plan',
      price: 7999,
      isFree: false,
      description: 'Emergency intervention for serious relationship issues',
      features: [
        'Immediate assessment',
        'Crisis intervention strategies',
        '4 emergency coaching sessions',
        '24/7 support access',
        'Customized recovery roadmap',
        '3-month follow-up',
      ],
      featured: true,
    },
    {
      name: 'Premium Couple Coaching',
      price: 9999,
      isFree: false,
      description: 'Ongoing support for continuous growth',
      features: [
        'Monthly 1:1 sessions',
        'Personalized growth plans',
        'Priority support',
        'Resource library access',
        'Partner sessions available',
        '6-month commitment',
      ],
    },
  ];

  const services = selectedCategory === 'pre_marriage' ? preMarriageServices : postMarriageServices;

  return (
    <div className="min-h-screen py-16 sm:py-24 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14 animate-rise-in">
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--brand-indigo)' }}>
            Coaching Plans
          </p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Our Services
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Choose the right support for your relationship journey
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12 animate-fade-in">
          <div
            className="inline-flex rounded-2xl p-1.5 border"
            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <TabButton
              label="Before Marriage"
              active={selectedCategory === 'pre_marriage'}
              onClick={() => setSelectedCategory('pre_marriage')}
              activeColor="from-indigo-600 to-blue-600"
            />
            <TabButton
              label="After Marriage"
              active={selectedCategory === 'post_marriage'}
              onClick={() => setSelectedCategory('post_marriage')}
              activeColor="from-emerald-600 to-teal-600"
            />
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-rise-in">
          {services.map((service, index) => {
            const isFeatured = (service as any).featured === true;
            return (
              <div
                key={index}
                className={`premium-card flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 ${
                  isFeatured ? 'ring-2' : ''
                }`}
                style={{ padding: '2rem', ...(isFeatured ? { '--tw-ring-color': 'var(--brand-indigo)' } as React.CSSProperties : {}) }}
              >
                {/* Featured badge */}
                {isFeatured && (
                  <div className="absolute top-0 right-6">
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-b-xl shadow-md flex items-center gap-1">
                      <Sparkles size={10} /> Popular
                    </div>
                  </div>
                )}

                {/* Price / Free badge */}
                <div className="mb-4">
                  {service.isFree ? (
                    <span
                      className="badge"
                      style={{ backgroundColor: 'var(--brand-emerald-light)', color: 'var(--brand-emerald)' }}
                    >
                      Free Forever
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>₹</span>
                      <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {service.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title & description */}
                <h3 className="text-lg font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  {service.name}
                </h3>
                <p className="text-sm leading-relaxed flex-grow mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {service.description}
                </p>

                {/* Feature list */}
                <ul className="space-y-2.5 mb-8">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle
                        size={16}
                        className="shrink-0 mt-0.5"
                        style={{ color: 'var(--brand-emerald)' }}
                      />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => {
                    if (user) {
                      onNavigate('dashboard');
                    } else {
                      onAuthClick();
                    }
                  }}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 focus-ring ${
                    isFeatured
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md'
                      : 'text-white'
                  }`}
                  style={
                    !isFeatured
                      ? {
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-primary)',
                        }
                      : undefined
                  }
                >
                  {!user && !service.isFree && <Lock size={15} />}
                  <span>
                    {service.isFree
                      ? 'Get Started'
                      : user
                      ? 'Book Now'
                      : 'Sign In to Book'}
                  </span>
                  <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
            Not sure which plan is right for you?
          </p>
          <button
            onClick={() => (user ? onNavigate('dashboard') : onAuthClick())}
            className="inline-flex items-center gap-2 border font-semibold px-6 py-3 rounded-full transition-all hover:-translate-y-0.5 focus-ring"
            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
          >
            Start with a free assessment <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
  activeColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all focus-ring ${
        active
          ? `bg-gradient-to-r ${activeColor} text-white shadow-md`
          : ''
      }`}
      style={!active ? { color: 'var(--text-secondary)' } : undefined}
    >
      {label}
    </button>
  );
}