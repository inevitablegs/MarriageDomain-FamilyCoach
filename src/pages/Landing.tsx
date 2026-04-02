import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Compass,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  Target,
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff6e8_0%,#fffdf8_42%,#f5f7fb_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <section className="animate-rise-in relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-8 shadow-2xl shadow-amber-100/40 sm:p-12">
          <div className="absolute -right-8 -top-10 h-56 w-56 rounded-full bg-rose-200/50 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-44 w-44 rounded-full bg-amber-200/50 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-4 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              <Sparkles size={14} />
              Relationship Clarity System
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Before You Marry... or Before It Breaks - Get It Right.
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-700 sm:text-xl">
              A structured relationship coaching system that helps you choose the right partner and fix relationship problems with real, step-by-step guidance.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={() => onNavigate('auth-before')}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-amber-300/40 transition hover:-translate-y-0.5 hover:bg-amber-700"
              >
                Check Compatibility Score
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onNavigate('auth-after')}
                className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-base font-bold text-slate-800 transition hover:border-slate-500"
              >
                Fix My Relationship
              </button>
            </div>

            <p className="mt-5 text-sm font-medium text-slate-600">
              Used by couples and individuals to make smarter relationship decisions
            </p>
          </div>
        </section>

        <section className="animate-rise-in mt-16 grid gap-6 rounded-3xl border border-rose-100 bg-white p-8 shadow-lg sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900">Most Relationships Don&apos;t Fail Suddenly - They Fail Silently</h2>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <ul className="space-y-2">
              {problemPoints.map((item) => (
                <li key={item} className="flex items-start gap-2 text-slate-700">
                  <ShieldAlert className="mt-0.5 text-rose-500" size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-slate-700">And most people realize it too late.</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              You were never taught how to choose or manage a relationship.
            </p>
          </div>
        </section>

        <section className="animate-rise-in mt-16 grid gap-8 rounded-3xl border border-sky-100 bg-gradient-to-r from-sky-50/70 to-cyan-50/70 p-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">We Give You a System - Not Just Advice</h2>
            <p className="mt-4 text-slate-700">No guesswork. No assumptions. Just clarity.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {solutionPoints.map((item) => (
              <li key={item} className="rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-3xl font-bold text-slate-900">Simple. Structured. Effective.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ['1. Answer Smart Questions', 'Designed to reveal real compatibility and risks'],
              ['2. Get Your Compatibility Score', 'See strengths, gaps, and critical red flags'],
              ['3. Get Action Plan', 'Clear steps to decide or improve your relationship'],
            ].map(([title, desc], idx) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {idx + 1}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-8 shadow-lg">
            <p className="text-sm font-bold uppercase tracking-wide text-rose-700">Before Marriage</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">Confused about your partner?</h3>
            <ul className="mt-5 space-y-3 text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-rose-500" />Check compatibility</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-rose-500" />Detect red flags</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-rose-500" />Make confident decisions</li>
            </ul>
            <button
              onClick={() => onNavigate('auth-before')}
              className="mt-6 rounded-xl bg-rose-600 px-6 py-3 font-bold text-white transition hover:bg-rose-700"
            >
              Check Before You Commit
            </button>
          </article>

          <article className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-lg">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">After Marriage</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">Facing issues in your relationship?</h3>
            <ul className="mt-5 space-y-3 text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" />Fix communication</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" />Resolve conflicts</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" />Rebuild connection</li>
            </ul>
            <button
              onClick={() => onNavigate('auth-after')}
              className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              Fix My Relationship
            </button>
          </article>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
          <h2 className="text-3xl font-bold text-slate-900">Why This Is Different</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Others</p>
              <ul className="mt-3 space-y-2 text-slate-700">
                <li className="flex items-center gap-2"><CircleDot size={14} />Advice-based</li>
                <li className="flex items-center gap-2"><CircleDot size={14} />Emotional guesswork</li>
                <li className="flex items-center gap-2"><CircleDot size={14} />Reactive (after problems)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">You With Us</p>
              <ul className="mt-3 space-y-2 text-emerald-900">
                <li className="flex items-center gap-2"><Target size={14} />System-based</li>
                <li className="flex items-center gap-2"><Target size={14} />Data-driven clarity</li>
                <li className="flex items-center gap-2"><Target size={14} />Proactive (before damage)</li>
              </ul>
            </div>
          </div>
          <p className="mt-5 text-lg font-semibold text-slate-800">
            We don&apos;t just talk about relationships - we help you manage them.
          </p>
        </section>

        <section className="mt-16 rounded-3xl border border-amber-100 bg-amber-50/60 p-8">
          <h2 className="text-3xl font-bold text-slate-900">What People Say</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              'Helped me see things I was ignoring',
              'Gave clarity before making a big decision',
              'Saved us from repeated fights',
            ].map((quote) => (
              <blockquote key={quote} className="rounded-xl border border-amber-200 bg-white p-5 text-slate-700 shadow-sm">
                <p className="text-sm">&quot;{quote}&quot;</p>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-8 text-white shadow-2xl">
          <h2 className="text-3xl font-bold">Don&apos;t Wait Until It&apos;s Too Late</h2>
          <p className="mt-4 text-slate-200">One wrong decision can cost years.</p>
          <p className="text-slate-200">One right decision can change your life.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => onNavigate('auth-before')}
              className="rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-900 transition hover:bg-amber-400"
            >
              Start Compatibility Check
            </button>
            <button
              onClick={() => onNavigate('auth-after')}
              className="rounded-xl border border-white/40 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Improve My Relationship
            </button>
          </div>
        </section>

        <footer className="mt-12 rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-600">
          Built to help you make better relationship decisions - before and after marriage.
        </footer>

        <section className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-500">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
            <HeartHandshake size={14} /> Pre + Post Marriage System
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
            <Compass size={14} /> Structured Guidance
          </div>
        </section>
      </div>
    </div>
  );
}
