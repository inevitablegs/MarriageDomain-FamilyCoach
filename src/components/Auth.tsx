import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, HeartHandshake, Users, AlertCircle } from 'lucide-react';

type AuthProps = {
  mode: 'before' | 'after';
  onBack: () => void;
  onSuccess: () => void;
};

export function Auth({ mode, onBack, onSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signOut, signUp } = useAuth();

  const isAfterMarriage = mode === 'after';

  const themeConfig = {
    gradientText: isAfterMarriage ? 'from-emerald-600 to-teal-500' : 'from-indigo-600 to-blue-500',
    gradientBg: isAfterMarriage ? 'from-emerald-600 to-teal-600' : 'from-indigo-600 to-blue-600',
    gradientHover: isAfterMarriage ? 'hover:from-emerald-700 hover:to-teal-700' : 'hover:from-indigo-700 hover:to-blue-700',
    ringColor: isAfterMarriage ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500',
    title: isAfterMarriage ? 'After Marriage Journey' : 'Before Marriage Journey',
    subtitle: isAfterMarriage
      ? 'Connect, rebuild, and track your relationship health securely.'
      : 'Analyze compatibility and uncover red flags before committing.',
    icon: isAfterMarriage ? <Users size={28} className="text-white" /> : <HeartHandshake size={28} className="text-white" />
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const relationshipStatus = mode === 'after' ? 'married' : 'single';
        const { error } = await signUp(email, password, fullName, relationshipStatus);
        if (error) throw error;
      } else {
        const { error, profile: signedInProfile } = await signIn(email, password);
        if (error) throw error;

        const relationshipStatus = signedInProfile?.relationship_status;
        const beforeMarriageAllowed = relationshipStatus === 'single' || relationshipStatus === 'engaged';
        const afterMarriageAllowed = relationshipStatus === 'married';

        if ((mode === 'before' && !beforeMarriageAllowed) || (mode === 'after' && !afterMarriageAllowed)) {
          await signOut();
          const msg = mode === 'before'
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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-primary transition-colors duration-300 relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Decorative Blur Backgrounds */}
      <div className={`absolute top-0 right-0 h-[500px] w-[500px] rounded-full blur-[120px] opacity-20 ${isAfterMarriage ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
      <div className={`absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full blur-[120px] opacity-20 ${isAfterMarriage ? 'bg-teal-500' : 'bg-blue-500'}`} />

      <div className="w-full max-w-5xl animate-rise-in relative z-10">
        <div className="premium-card grid overflow-hidden lg:grid-cols-[1fr,1.2fr] min-h-[600px]">

          {/* Left / Top Side: Graphic Banner */}
          <div className={`relative flex flex-col justify-between p-10 bg-gradient-to-br ${themeConfig.gradientBg}`}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

            <div className="relative z-10">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition-all"
              >
                <ArrowLeft size={16} /> Back
              </button>
            </div>

            <div className="relative z-10 mt-12 lg:mt-0">
              <div className="inline-flex h-16 w-16 shadow-lg items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 mb-6">
                {themeConfig.icon}
              </div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">
                {themeConfig.title}
              </h2>
              <p className="mt-4 text-white/90 text-lg leading-relaxed max-w-sm">
                {themeConfig.subtitle}
              </p>
            </div>

            <div className="hidden lg:block relative z-10 mt-12 pt-8 border-t border-white/20">
              <p className="text-sm font-medium text-white/70 italic">
                {isAfterMarriage ? "Start rebuilding your connection today." : "Make your most important decision with clarity."}
              </p>
            </div>
          </div>

          {/* Right / Bottom Side: Auth Form */}
          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-secondary transition-colors duration-300">
            <div className="mb-10">
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
                {isSignUp
                  ? 'Enter your details to get started.'
                  : 'Sign in to your account to continue.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-transparent focus:ring-2 ${themeConfig.ringColor}`}
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-transparent focus:ring-2 ${themeConfig.ringColor}`}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-transparent focus:ring-2 ${themeConfig.ringColor}`}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-4 animate-fade-in">
                  <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`mt-2 w-full rounded-xl bg-gradient-to-r ${themeConfig.gradientBg} ${themeConfig.gradientHover} px-4 py-4 font-bold text-white shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg`}
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-8">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className={`font-bold transition-colors bg-clip-text text-transparent bg-gradient-to-r ${themeConfig.gradientText} hover:opacity-80`}
                >
                  {isSignUp ? 'Log in instead' : 'Create an account'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
