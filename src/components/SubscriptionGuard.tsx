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
  
  const tiers = { free: 0, basic: 1, premium: 2 };
  const userTier = profile?.subscription_tier || 'free';
  const isLocked = tiers[userTier] < tiers[requiredTier];

  if (!isLocked) return <>{children}</>;

  const isPremium = requiredTier === 'premium';
  const accentColor = isPremium ? '#5c7c64' : '#d97757';
  const accentBg    = isPremium ? 'rgba(92,124,100,0.12)'  : 'rgba(217,119,87,0.12)';
  const accentGlow  = isPremium ? 'rgba(92,124,100,0.15)'  : 'rgba(217,119,87,0.15)';
  const tierLabel   = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return (
    <div className="relative group overflow-hidden premium-card transition-all duration-300">
      {/* Blurred content preview */}
      <div className="filter blur-[6px] opacity-25 select-none pointer-events-none">
        {children}
      </div>

      {/* Lock overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center rounded-[1.25rem]"
        style={{
          background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%)`,
          borderColor: 'var(--border-primary)',
        }}
      >
        {/* Lock Icon */}
        <div
          className="mb-5 w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: accentBg, color: accentColor }}
        >
          <Lock size={24} />
        </div>

        <h3
          className="text-lg font-extrabold mb-1.5 tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Unlock {featureName}
        </h3>
        <p
          className="text-sm mb-6 max-w-[260px] leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          Available in our{' '}
          <span className="font-bold" style={{ color: accentColor }}>
            {tierLabel}
          </span>{' '}
          plan. Upgrade to access this and more.
        </p>

        <button
          onClick={onUpgradeClick}
          className="group/btn px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] focus-ring flex items-center gap-2"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 4px 14px ${accentGlow}`,
          }}
        >
          View Plans
          <ChevronRight
            size={16}
            className="group-hover/btn:translate-x-0.5 transition-transform"
          />
        </button>

        {isPremium && (
          <div
            className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            <Sparkles size={11} style={{ color: accentColor }} />
            Best for Couples & Deep AI Analysis
          </div>
        )}
      </div>
    </div>
  );
};
