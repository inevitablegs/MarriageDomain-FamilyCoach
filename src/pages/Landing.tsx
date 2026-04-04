import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Compass,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  Target,
  Heart,
  ChevronRight
} from 'lucide-react';

type LandingProps = {
  onNavigate: (page: string) => void;
};

export function Landing({ onNavigate }: LandingProps) {
  const problemPoints = [
    'Wrong partner choices',
    'Unresolved conflicts',
    'Emotional disconnect',
    'Financial stress',
    'Family pressure',
  ];

  const solutionPoints = [
    'Structured compatibility assessment',
    'Real-life scenario testing',
    'Conflict resolution frameworks',
    'Emotional and financial alignment tools',
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-primary font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 -left-64 h-[500px] w-[500px] rounded-full bg-indigo-200/40 dark:bg-indigo-900/20 blur-[100px] opacity-70" />
      <div className="absolute top-40 -right-64 h-[600px] w-[600px] rounded-full bg-blue-200/40 dark:bg-blue-900/20 blur-[120px] opacity-60" />
      <div className="absolute -bottom-64 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-rose-100/40 dark:bg-rose-900/10 blur-[150px] opacity-50" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">

        {/* HERO SECTION */}
        <section className="animate-rise-in relative flex flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/50 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 shadow-sm backdrop-blur-sm">
            <Sparkles size={14} className="text-indigo-500" />
            Relationship Clarity System
          </div>

          <h1 className="mt-8 max-w-5xl text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">
            Before You Marry... or Before It Breaks <br className="hidden lg:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 bg-clip-text text-transparent">Get It Right.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 sm:text-xl">
            A structured relationship coaching system to choose the right partner or fix relationship problems with real, data-driven step-by-step guidance.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center justify-center w-full max-w-md sm:max-w-none">
            <button
              onClick={() => onNavigate('auth-before')}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105 hover:from-indigo-700 hover:to-blue-700 sm:w-auto"
            >
              Start Compatibility Check
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => onNavigate('auth-after')}
              className="flex w-full items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-secondary/70 px-8 py-4 text-base font-bold text-slate-800 dark:text-slate-200 shadow-sm transition-all hover:bg-secondary hover:shadow-md sm:w-auto"
            >
              Fix My Relationship
            </button>
          </div>

          <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 justify-center">
            <HeartHandshake size={14} className="text-slate-400 dark:text-slate-500" /> Trusted by thousands of couples & individuals
          </p>
        </section>

        {/* METRICS / STATS BENTO */}
        <section className="animate-rise-in mx-auto mt-24 max-w-5xl rounded-[2.5rem] premium-card p-2">
          <div className="grid overflow-hidden rounded-[2rem] sm:grid-cols-2 lg:grid-cols-3 bg-primary/50">
            <div className="p-10 border-b sm:border-b-0 sm:border-r border-slate-200/60 dark:border-slate-800/60 text-center">
              <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">85%</div>
              <div className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Clarity within 1 Week</div>
            </div>
            <div className="p-10 border-b lg:border-b-0 lg:border-r border-slate-200/60 dark:border-slate-800/60 text-center">
              <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">3x</div>
              <div className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Fewer Major Conflicts</div>
            </div>
            <div className="p-10 text-center sm:col-span-2 lg:col-span-1">
              <div className="text-4xl font-extrabold text-sky-500 dark:text-sky-400">100%</div>
              <div className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Private & Secure</div>
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section className="animate-rise-in mt-32 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-rose-600 font-bold uppercase tracking-wider text-xs mb-4">
              <ShieldAlert size={16} /> Avoid Silent Failures
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl leading-tight">
              Most Relationships Don't Fail Suddenly. They Fail Silently.
            </h2>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              We are never taught how to systematically choose or manage a relationship. We rely on feelings and blind luck until things break down.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {problemPoints.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <CircleDot size={14} className="text-rose-600 dark:text-rose-400" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-effect rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-amber-100/50 dark:bg-amber-900/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">We Give You a System - Not Just Advice.</h3>
            <ul className="space-y-4">
              {solutionPoints.map((item) => (
                <li key={item} className="flex items-start gap-4 bg-secondary/60 p-4 rounded-xl border border-secondary transition-colors">
                  <CheckCircle2 size={24} className="text-indigo-500 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-32">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Simple. Structured. Effective.</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-lg">Your path to relationship clarity takes just three steps.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              ['1', 'Answer Smart Questions', 'Scientifically designed prompts to reveal real compatibility and potential risk areas.', 'bg-indigo-50 text-indigo-600 ring-indigo-100'],
              ['2', 'Get Your Compatibility Score', 'See your actionable strengths, gaps, and any critical red flags immediately.', 'bg-blue-50 text-blue-600 ring-blue-100'],
              ['3', 'Follow Action Plan', 'Receive clear, structured steps to confidently decide on or improve your relationship.', 'bg-sky-50 text-sky-600 ring-sky-100'],
            ].map(([num, title, desc, colorClass]) => (
              <article key={title} className="premium-card p-8 group overflow-hidden relative">
                <div className={`absolute top-0 right-0 p-24 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 transition-opacity opacity-50 group-hover:opacity-100 ${colorClass.split(' ')[0]}`}></div>
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold ring-4 shadow-sm ${colorClass}`}>
                  {num}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* TWO JOURNEYS (BEFORE/AFTER) */}
        <section className="mt-32 grid gap-8 lg:grid-cols-2">
          <article className="premium-card p-10 relative overflow-hidden group border-2 border-transparent hover:border-indigo-100 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Before Marriage</p>
            <h3 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Confused about your partner?</h3>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">Stop guessing. Get deep insights before making the biggest commitment of your life.</p>
            <ul className="mt-8 space-y-4 text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-3"><span className="p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full"><CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" /></span> Compatibility Deep Scan</li>
              <li className="flex items-center gap-3"><span className="p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full"><CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" /></span> Red Flag Intelligence</li>
              <li className="flex items-center gap-3"><span className="p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full"><CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" /></span> Make Confident Decisions</li>
            </ul>
            <button
              onClick={() => onNavigate('auth-before')}
              className="mt-10 flex items-center justify-between w-full rounded-2xl bg-slate-900 hover:bg-slate-800 px-6 py-4 font-bold text-white transition-colors"
            >
              <span>Start Before Marriage Journey</span>
              <ArrowRight size={20} />
            </button>
          </article>

          <article className="premium-card p-10 relative overflow-hidden group border-2 border-transparent hover:border-emerald-100 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">After Marriage</p>
            <h3 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Facing issues in your relationship?</h3>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">Repair and rebuild together with structured assessment sessions and health tracking.</p>
            <ul className="mt-8 space-y-4 text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-3"><span className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full"><CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /></span> Couple Assessment Sessions</li>
              <li className="flex items-center gap-3"><span className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full"><CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /></span> Conflict Risk Monitor</li>
              <li className="flex items-center gap-3"><span className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full"><CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /></span> Rebuild Connection</li>
            </ul>
            <button
              onClick={() => onNavigate('auth-after')}
              className="mt-10 flex items-center justify-between w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-4 font-bold text-white transition-colors"
            >
              <span>Start Joint Journey</span>
              <ArrowRight size={20} />
            </button>
          </article>
        </section>

        {/* CTA BANNER */}
        <section className="mt-32 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 p-12 text-center text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent"></div>
          <div className="relative z-10">
            <Heart className="mx-auto text-rose-500 mb-6" size={48} fill="currentColor" />
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl max-w-2xl mx-auto">Don't Wait Until It's Too Late</h2>
            <p className="mt-6 text-xl text-slate-300 max-w-xl mx-auto leading-relaxed">
              One wrong decision can cost years. <br /> One right decision can change your life.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => onNavigate('auth-before')}
                className="w-full sm:w-auto rounded-full bg-white dark:bg-slate-100 px-8 py-4 font-bold text-slate-900 transition-transform hover:scale-105 shadow-xl"
              >
                Start Compatibility Check
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-slate-200/60 pt-8 pb-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-6">
            <span className="flex items-center gap-1.5"><HeartHandshake size={14} /> Pre + Post Marriage System</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1.5"><Compass size={14} /> Structured Guidance</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1.5"><Target size={14} /> Data-Driven Clarity</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-600">© {new Date().getFullYear()} MarriageWise. Built for better relationship decisions.</p>
        </footer>

      </div>
    </div>
  );
}
