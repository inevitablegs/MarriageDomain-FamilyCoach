import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, HeartHandshake, Link2, Users } from 'lucide-react';

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
        // signIn now returns the loaded profile directly — no redundant query needed.
        const { error, profile: signedInProfile } = await signIn(email, password);
        if (error) throw error;

        const relationshipStatus = signedInProfile?.relationship_status;
        const beforeMarriageAllowed = relationshipStatus === 'single' || relationshipStatus === 'engaged';
        const afterMarriageAllowed = relationshipStatus === 'married';

        if ((mode === 'before' && !beforeMarriageAllowed) || (mode === 'after' && !afterMarriageAllowed)) {
          // Fully sign out before showing the error so there's no stale session.
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

  const isAfterMarriage = mode === 'after';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_top,#ecfeff_0%,#ffffff_40%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="grid lg:grid-cols-2">
          <aside className={`p-8 sm:p-10 ${isAfterMarriage ? 'bg-gradient-to-br from-emerald-700 to-teal-600 text-white' : 'bg-gradient-to-br from-amber-600 to-rose-500 text-white'}`}>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold hover:bg-white/10"
            >
              <ArrowLeft size={16} /> Back to Home
            </button>

            <div className="mt-8 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              {isAfterMarriage ? <Users size={24} /> : <HeartHandshake size={24} />}
            </div>

            <h2 className="mt-5 text-3xl font-extrabold">
              {isAfterMarriage ? 'After Marriage Access' : 'Before Marriage Access'}
            </h2>
            <p className="mt-3 text-white/90">
              {isAfterMarriage
                ? 'Create or use your couple account to improve communication, resolve conflict, and rebuild connection with a structured plan.'
                : 'Create or use your individual account to check compatibility, detect red flags, and decide with clarity before commitment.'}
            </p>

            <ul className="mt-8 space-y-3 text-sm">
              {isAfterMarriage ? (
                <>
                  <li className="rounded-lg bg-white/10 px-3 py-2">Joint relationship dashboard</li>
                  <li className="rounded-lg bg-white/10 px-3 py-2">Partner invitation and sync</li>
                  <li className="rounded-lg bg-white/10 px-3 py-2">Conflict and health action plans</li>
                </>
              ) : (
                <>
                  <li className="rounded-lg bg-white/10 px-3 py-2">Compatibility scoring</li>
                  <li className="rounded-lg bg-white/10 px-3 py-2">Risk and red-flag detection</li>
                  <li className="rounded-lg bg-white/10 px-3 py-2">Decision confidence framework</li>
                </>
              )}
            </ul>
          </aside>

          <div className="p-8 sm:p-10">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {isAfterMarriage ? 'Couple / Joint Account' : 'Individual Account'}
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
                {isSignUp ? 'Create Your Account' : 'Welcome Back'}
              </h3>
              <p className="mt-2 text-slate-600">
                {isSignUp
                  ? 'Secure your account to unlock guided relationship decisions.'
                  : 'Sign in to continue your relationship clarity journey.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-lg py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${isAfterMarriage ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-bold text-slate-900 hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
