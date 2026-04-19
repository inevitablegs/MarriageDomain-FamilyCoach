import React, { useState } from 'react';
import { Check, Heart, Sparkles, ArrowLeft, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PricingProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onBack, onSuccess }) => {
  const { profile, updateTier } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (tier: 'free' | 'basic' | 'premium') => {
    setLoading(tier);
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { error } = await updateTier(tier);
    setLoading(null);
    
    if (!error && onSuccess) {
      onSuccess();
    }
  };

  const currentTier = profile?.subscription_tier || 'free';

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      description: 'The foundation for your relationship journey.',
      tier: 'free' as const,
      features: [
        'Need To Know Hub (Education)',
        'Daily Health Journaling',
        'Basic AI Guidance',
        'Profile Setup',
      ],
      icon: Heart,
      color: 'rose',
      cta: 'Current Plan',
    },
    {
      name: 'Basic',
      price: '₹499',
      priceDetail: '/forever access (limited)',
      description: 'Comprehensive tools for deeper self-discovery.',
      tier: 'basic' as const,
      features: [
        'Compatibility Quiz (Individual)',
        'Red Flag Behavioral Checker',
        'Expectation Resolver',
        'Advanced Health Analytics',
        'History Tracking',
      ],
      icon: Zap,
      color: 'amber',
      cta: 'Upgrade to Basic',
      popular: true,
    },
    {
      name: 'Premium',
      price: '₹1499',
      priceDetail: '/full relationship suite',
      description: 'The ultimate synchronous experience for couples.',
      tier: 'premium' as const,
      features: [
        'Multi-account Couple Assessment',
        'Conflict Resolution AI Assistant',
        'Relationship Stress Test',
        'Direct Mentor Chat Access',
        'Partner Insights Dashboard',
        'Priority AI Support',
      ],
      icon: Sparkles,
      color: 'indigo',
      cta: 'Go Premium',
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 landscape:py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
            <p className="text-white/50 text-sm">Invest in the future of your relationship.</p>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.tier;
            const Icon = plan.icon;
            
            return (
              <div
                key={plan.name}
                className={`relative group flex flex-col p-8 rounded-[32px] transition-all duration-500 border overflow-hidden ${
                  plan.popular 
                    ? 'bg-white/10 border-white/20 shadow-2xl scale-[1.02] z-10' 
                    : 'bg-white/5 border-white/10 hover:bg-white/8'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-6 right-6">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-${plan.color}-500/20 text-${plan.color}-400 ring-1 ring-${plan.color}-500/30`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.priceDetail && (
                      <span className="text-white/40 text-xs">{plan.priceDetail}</span>
                    )}
                  </div>
                  <p className="mt-4 text-white/50 text-sm leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="flex-grow space-y-4 mb-8 text-sm">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check size={10} className="text-emerald-400" />
                      </div>
                      <span className="text-white/80 leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  disabled={isCurrent || loading !== null}
                  onClick={() => handleUpgrade(plan.tier)}
                  className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-white/10 text-white/40 border border-white/5 cursor-default'
                      : loading === plan.tier
                      ? 'bg-rose-500/50 text-white cursor-wait'
                      : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 active:scale-[0.98]'
                  }`}
                >
                  {loading === plan.tier ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    <>
                      {plan.cta}
                      {!isCurrent && <Zap size={16} fill="white" />}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Reassurance Footer */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 py-8 border-t border-white/5 opacity-50">
          <div className="flex items-center gap-2 text-white/60">
            <ShieldCheck size={18} />
            <span className="text-xs">Secure Payment Gateway</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <Heart size={18} />
            <span className="text-xs">Helping 10,000+ Couples</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <Sparkles size={18} />
            <span className="text-xs">100% Satisfaction Guarantee</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .bg-rose-500\/20 { background-color: rgba(244, 63, 94, 0.2); }
        .bg-amber-500\/20 { background-color: rgba(245, 158, 11, 0.2); }
        .bg-indigo-500\/20 { background-color: rgba(99, 102, 241, 0.2); }
        .text-rose-400 { color: rgb(251, 113, 133); }
        .text-amber-400 { color: rgb(251, 191, 36); }
        .text-indigo-400 { color: rgb(129, 140, 248); }
        .ring-rose-500\/30 { box-shadow: inset 0 0 0 1px rgba(244, 63, 94, 0.3); }
        .ring-amber-500\/30 { box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.3); }
        .ring-indigo-500\/30 { box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.3); }
      `}} />
    </div>
  );
};
