import React, { useState } from 'react';
import {
  Check,
  Heart,
  Sparkles,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Zap,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { initializePayment } from '../lib/payment';

interface PricingProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onBack, onSuccess }) => {
  const { profile, updateTier } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: (typeof plans)[0]) => {
    if (!profile) return;
    setLoading(plan.tier);

    try {
      if (plan.tier === 'free') {
        await updateTier('free');
        setLoading(null);
        if (onSuccess) onSuccess();
        return;
      }

      const amount = parseInt(plan.price.replace('₹', '').replace(',', ''));

      await initializePayment({
        amount,
        tierName: plan.name,
        userProfile: {
          full_name: profile.full_name,
          email: profile.email,
        },
        onSuccess: async (response) => {
          console.log('Payment success callback triggered', response);
          const { error } = await updateTier(plan.tier);
          setLoading(null);
          if (!error && onSuccess) onSuccess();
        },
        onCancel: () => {
          setLoading(null);
        },
      });
    } catch (err) {
      console.error('Payment initialization failed:', err);
      setLoading(null);
    }
  };

  const currentTier = profile?.subscription_tier || 'free';

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      priceDetail: 'forever',
      description: 'Start your journey with essential relationship insights.',
      tier: 'free' as const,
      features: [
        'Need To Know Hub (Education)',
        'Daily Health Journaling',
        'Basic AI Guidance',
        'Profile Setup',
      ],
      icon: Heart,
      accentColor: '#a65d50',
      accentBg: 'rgba(166,93,80,0.10)',
      accentGlow: 'rgba(166,93,80,0.15)',
      cta: 'Current Plan',
    },
    {
      name: 'Basic',
      price: '₹499',
      priceDetail: 'one-time',
      description: 'Unlock self-discovery tools for deeper personal analysis.',
      tier: 'basic' as const,
      features: [
        'Compatibility Deep-Scan Quiz',
        'Red Flag Behavioral Checker',
        'Expectation Resolver™',
        'Advanced Health Analytics',
        'Full History & Reports',
      ],
      icon: Zap,
      accentColor: '#d97757',
      accentBg: 'rgba(217,119,87,0.10)',
      accentGlow: 'rgba(217,119,87,0.20)',
      cta: 'Upgrade to Basic',
      popular: true,
    },
    {
      name: 'Premium',
      price: '₹1,499',
      priceDetail: 'full suite',
      description: 'The complete couple experience with AI-powered coaching.',
      tier: 'premium' as const,
      features: [
        'Multi-account Couple Assessment',
        'Conflict Resolution AI Coach',
        'Relationship Stress Test',
        'Direct Mentor Chat Access',
        'Partner Insights Dashboard',
        'Priority AI Support',
      ],
      icon: Crown,
      accentColor: '#5c7c64',
      accentBg: 'rgba(92,124,100,0.10)',
      accentGlow: 'rgba(92,124,100,0.20)',
      cta: 'Go Premium',
    },
  ];

  return (
    <div
      className="min-h-[calc(100vh-68px)] py-10 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="animate-rise-in flex items-center gap-4 mb-10">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border transition-all hover:-translate-y-0.5 focus-ring"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Choose Your Plan
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Invest in the clarity of your relationship journey.
            </p>
          </div>
        </div>

        {/* ── Hero Banner ── */}
        <section className="stagger-1 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#2a2826] to-[#4a4642] px-8 py-10 mb-10 shadow-2xl shadow-stone-900/20 noise-overlay">
          <div className="absolute top-0 right-0 h-64 w-64 bg-white/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <span className="font-display text-3xl sm:text-4xl font-semibold text-white/90 italic leading-snug">
              "The best investment you'll ever make is in your relationship."
            </span>
            <p className="mt-4 text-white/50 text-sm">
              Join thousands of couples building stronger foundations with MarriageWise.
            </p>
          </div>
        </section>

        {/* ── Pricing Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, i) => {
            const isCurrent = currentTier === plan.tier;
            const Icon = plan.icon;

            return (
              <div
                key={plan.name}
                className={`stagger-${i + 2} relative flex flex-col premium-card p-0 overflow-hidden transition-all duration-300 ${
                  plan.popular ? 'ring-2' : ''
                }`}
                style={{
                  ...(plan.popular
                    ? { boxShadow: `0 8px 40px ${plan.accentGlow}`, borderColor: plan.accentColor, ['--tw-ring-color' as any]: plan.accentColor }
                    : {}),
                }}
              >
                {/* Popular ribbon */}
                {plan.popular && (
                  <div
                    className="text-center py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white"
                    style={{ backgroundColor: plan.accentColor }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="flex flex-col flex-grow p-8">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-11 h-11 rounded-[14px] flex items-center justify-center"
                      style={{ backgroundColor: plan.accentBg, color: plan.accentColor }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-extrabold leading-tight"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span
                          className="badge mt-0.5"
                          style={{ backgroundColor: plan.accentBg, color: plan.accentColor }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <span
                      className="text-4xl font-extrabold tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {plan.price}
                    </span>
                    <span
                      className="text-xs font-semibold ml-1.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      /{plan.priceDetail}
                    </span>
                  </div>
                  <p
                    className="text-sm mb-8 leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {plan.description}
                  </p>

                  {/* Features */}
                  <div className="flex-grow space-y-3.5 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2.5">
                        <div
                          className="mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: plan.accentBg }}
                        >
                          <Check size={12} style={{ color: plan.accentColor }} />
                        </div>
                        <span
                          className="text-sm font-medium leading-snug"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    disabled={isCurrent || loading !== null}
                    onClick={() => handleUpgrade(plan)}
                    className="w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                    style={
                      isCurrent
                        ? {
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-primary)',
                          }
                        : {
                            backgroundColor: plan.accentColor,
                            color: '#fff',
                            boxShadow: `0 4px 14px ${plan.accentGlow}`,
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isCurrent) (e.currentTarget.style.transform = 'translateY(-2px)');
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) (e.currentTarget.style.transform = 'translateY(0)');
                    }}
                  >
                    {loading === plan.tier ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Trust Footer ── */}
        <div
          className="stagger-5 flex flex-wrap items-center justify-center gap-8 py-6 border-t"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} />
            <span className="text-xs font-semibold">Razorpay Secure Payments</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Heart size={16} />
            <span className="text-xs font-semibold">Helping 10,000+ Couples</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Sparkles size={16} />
            <span className="text-xs font-semibold">100% Satisfaction Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
