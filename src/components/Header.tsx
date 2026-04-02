import { Heart, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type HeaderProps = {
  onAuthClick: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
};

export function Header({ onAuthClick, onNavigate, currentPage }: HeaderProps) {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 hover:opacity-80 transition"
          >
            <Heart className="text-rose-500" size={32} fill="currentColor" />
            <span className="text-2xl font-bold text-gray-800">MarriageWise</span>
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium transition ${
                currentPage === 'home' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Home
            </button>
            {user && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`text-sm font-medium transition ${
                  currentPage === 'dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User size={20} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{profile?.full_name}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
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
