import { Heart, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type HeaderProps = {
  onAuthClick: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
};

export function Header({ onAuthClick, onNavigate, currentPage }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2.5 group transition-transform hover:scale-105"
          >
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2 rounded-xl shadow-sm group-hover:shadow-md transition-all">
              <Heart className="text-white" size={22} fill="currentColor" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              MarriageWise
            </span>
          </button>

          <nav className="hidden md:flex items-center space-x-1 border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 rounded-full px-2 py-1.5 shadow-sm">
            <button
              onClick={() => onNavigate('home')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${currentPage === 'home' || currentPage === 'auth-before' || currentPage === 'auth-after'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-700/80'
                }`}
            >
              Home
            </button>
            {user && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${currentPage.includes('dashboard') || currentPage === 'quiz' || currentPage === 'health-tracker' || currentPage === 'red-flags'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-700/80'
                  }`}
              >
                Dashboard
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200/60 bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 transition-all shadow-sm"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user ? (
              <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full py-1.5 pl-2 pr-4 shadow-sm">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 p-1.5 rounded-full">
                  <User size={18} />
                </div>
                <div className="flex flex-col items-start pr-3 border-r border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight block max-w-[100px] truncate">{profile?.full_name || 'User'}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold leading-tight">{profile?.relationship_status || 'Member'}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 hover:-translate-y-0.5"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
