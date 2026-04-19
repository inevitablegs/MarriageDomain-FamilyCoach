import React from 'react';
import { Lock, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier: 'free' | 'basic' | 'premium';
  featureName: string;
  onUpgradeClick: () => void;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  requiredTier,
  featureName,
  onUpgradeClick,
}) => {
  const { profile } = useAuth();
  
  const tiers = {
    free: 0,
    basic: 1,
    premium: 2,
  };

  const userTier = profile?.subscription_tier || 'free';
  const isLocked = tiers[userTier] < tiers[requiredTier];

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative group overflow-hidden rounded-3xl border border-white/20 bg-white/5 backdrop-blur-xl transition-all duration-300">
      {/* Content preview (blurred) */}
      <div className="filter blur-md opacity-30 select-none pointer-events-none p-8">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl">
        <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/40">
          <Lock size={28} />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">
          Unlock {featureName}
        </h3>
        <p className="text-white/70 text-sm mb-6 max-w-[240px]">
          This and many other powerful tools are available in our{' '}
          <span className="text-rose-400 font-semibold">{requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}</span> plan.
        </p>

        <button
          onClick={onUpgradeClick}
          className="group/btn relative px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/40 transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            Upgrade Now
            <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </span>
        </button>

        {requiredTier === 'premium' && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-300/80">
            <Sparkles size={12} />
            Best for Couples & Deep AI Analysis
          </div>
        )}
      </div>
    </div>
  );
};
