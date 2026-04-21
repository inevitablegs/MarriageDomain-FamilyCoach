import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, HeartHandshake, Users, AlertCircle, Eye, EyeOff } from 'lucide-react';

type AuthProps = {
  mode: 'before' | 'after' | 'mentor' | 'admin';
  onBack: () => void;
  onSuccess: () => void;
};

export function Auth({ mode, onBack, onSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signOut, signUp } = useAuth();

  const isAfterMarriage = mode === 'after';
  const isMentor = mode === 'mentor';
  const isAdmin = mode === 'admin';
  const isSpecialRole = isMentor || isAdmin;

  const theme = isMentor
    ? {
        gradient: 'from-[#2D6A4F] via-[#1B4332] to-[#0A1C14]',
        ringClass: 'focus:ring-[#2D6A4F]',
        accentColor: '#2D6A4F',
        title: 'Coach / Mentor Portal',
        subtitle: 'Sign in to your mentor account to connect with assigned users and provide guidance.',
        icon: <Users size={26} className="text-white" />,
        testimonial: '"Empowering families through structured guidance and connection." — VivahSutra Mentors',
      }
    : isAdmin
    ? {
        gradient: 'from-[#2C1A0E] via-[#1C0A14] to-[#12060C]',
        ringClass: 'focus:ring-[#e8831a]',
        accentColor: '#e8831a',
        title: 'Admin Control Center',
        subtitle: 'Manage mentors, assign coaches to users, and oversee the platform.',
        icon: <HeartHandshake size={26} className="text-white" />,
        testimonial: '"Platform administration and mentor management." — VivahSutra Admin',
      }
    : isAfterMarriage
    ? {
        gradient: 'from-[#2D6A4F] via-[#1B4332] to-[#0A1C14]',
        ringClass: 'focus:ring-[#2D6A4F]',
        accentColor: '#2D6A4F',
        title: 'After Marriage Journey',
        subtitle: 'Connect, rebuild, and track your relationship health securely.',
        icon: <Users size={26} className="text-white" />,
        testimonial: '"We finally have a shared language for our relationship." — Priya & Rohan',
      }
    : {
        gradient: 'from-[#e8831a] via-[#8b1a3a] to-[#6b1437]',
        ringClass: 'focus:ring-[#e8831a]',
        accentColor: '#e8831a',
        title: 'Before Marriage Journey',
        subtitle: 'Analyze compatibility and uncover red flags before committing.',
        icon: <HeartHandshake size={26} className="text-white" />,
        testimonial: '"VivahSutra gave us the clarity we needed." — Ananya, Pune',
      };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Admin login — validate against env credentials
      if (isAdmin) {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@vivahsutra.com';
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
        if (email.trim().toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
          setError('Invalid admin credentials.');
          setLoading(false);
          return;
        }
        onSuccess();
        return;
      }

      if (isSignUp && !isSpecialRole) {
        const relationshipStatus = mode === 'after' ? 'married' : 'single';
        const { error } = await signUp(email, password, fullName, relationshipStatus);
        if (error) throw error;
      } else {
        const { error, profile: signedInProfile } = await signIn(email, password);
        if (error) throw error;

        // Mentor role validation
        if (isMentor) {
          const role = signedInProfile?.role || 'user';
          if (role !== 'mentor') {
            await signOut();
            setError('This account is not registered as a mentor. Contact admin for access.');
            setLoading(false);
            return;
          }
          onSuccess();
          return;
        }

        const relationshipStatus = signedInProfile?.relationship_status;
        const beforeMarriageAllowed =
          relationshipStatus === 'single' || relationshipStatus === 'engaged';
        const afterMarriageAllowed = relationshipStatus === 'married';

        if (
          (mode === 'before' && !beforeMarriageAllowed) ||
          (mode === 'after' && !afterMarriageAllowed)
        ) {
          await signOut();
          const msg =
            mode === 'before'
              ? 'This account is a couple account. Please use After Marriage login.'
              : 'This account is an individual account. Please use Before Marriage login.';
          setError(msg);
          setLoading(false);
          return;
        }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-68px)] flex items-center justify-center relative overflow-hidden p-4 sm:p-6 lg:p-8 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: isMentor ? '#2D6A4F' : isAdmin ? '#2C1A0E' : isAfterMarriage ? '#2D6A4F' : '#e8831a' }}
      />
      <div
        className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: isMentor ? '#1B4332' : isAdmin ? '#1C0A14' : isAfterMarriage ? '#1B4332' : '#8b1a3a' }}
      />

      <div className="w-full max-w-5xl animate-rise-in relative z-10">
        <div
          className="premium-card overflow-hidden grid lg:grid-cols-[1fr,1.25fr]"
          style={{ minHeight: 580 }}
        >

          {/* ── Left panel ── */}
          <div
            className={`relative flex flex-col justify-between p-9 sm:p-12 bg-gradient-to-br ${theme.gradient} noise-overlay`}
          >
            {/* Back button */}
            <div>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition-all focus-ring"
              >
                <ArrowLeft size={15} /> Back
              </button>
            </div>

            {/* Content */}
            <div className="mt-10 lg:mt-0">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur border border-white/20 mb-6 shadow-lg">
                {theme.icon}
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
                {theme.title}
              </h2>
              <p className="mt-4 text-white/85 text-base leading-relaxed max-w-xs">
                {theme.subtitle}
              </p>

              {/* Trust signal */}
              <div className="mt-8 rounded-2xl bg-white/10 border border-white/15 px-5 py-4 text-sm text-white/80 font-medium italic leading-relaxed hidden lg:block">
                {theme.testimonial}
              </div>
            </div>

            {/* Decorative dots */}
            <div className="hidden lg:flex items-center gap-2 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`rounded-full bg-white ${i === 1 ? 'w-6 h-2' : 'w-2 h-2 opacity-40'}`} />
              ))}
            </div>
          </div>

          {/* ── Right panel / Form ── */}
          <div
            className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center transition-colors duration-300"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            {/* Heading */}
            <div className="mb-8">
              <h3
                className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h3>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isSignUp
                  ? 'Enter your details to get started.'
                  : 'Sign in to your account to continue.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (sign-up only, not for mentor/admin) */}
              {isSignUp && !isSpecialRole && (
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-semibold mb-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Riya Sharma"
                    className="input-base"
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-base pr-11"
                    required
                    minLength={6}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors focus-ring"
                    style={{ color: 'var(--text-muted)' }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3.5 border text-sm animate-fade-in"
                  style={{
                    backgroundColor: '#fff1f2',
                    borderColor: '#fecdd3',
                    color: '#be123c',
                  }}
                >
                  <AlertCircle size={17} className="shrink-0 mt-0.5" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 py-4 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-ring bg-gradient-to-r ${theme.gradient}`}
                style={{ boxShadow: `0 4px 14px 0 ${theme.accentColor}40` }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Processing…
                  </span>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            {/* Toggle sign-in / sign-up (only for user modes) */}
            {!isSpecialRole && (
              <div
                className="mt-8 pt-6 border-t text-center"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                    }}
                    className="font-bold transition-colors hover:opacity-80 focus-ring rounded"
                    style={{ color: theme.accentColor }}
                  >
                    {isSignUp ? 'Log in instead' : 'Create an account'}
                  </button>
                </p>
              </div>
            )}

            {/* Mentor help text */}
            {isMentor && (
              <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--border-primary)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Mentor accounts are created by the platform admin.<br />
                  Contact your administrator for access.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}