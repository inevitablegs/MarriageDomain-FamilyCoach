import { useState } from 'react';
import { Heart, LogOut, Sun, Moon, Menu, X, GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type HeaderProps = {
  onAuthClick: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onMentorAuthClick?: () => void;
  onAdminAuthClick?: () => void;
};

export function Header({ onNavigate, currentPage, onMentorAuthClick, onAdminAuthClick }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (pages: string[]) => pages.includes(currentPage);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 glass-effect border-b transition-all duration-300"
        style={{
          borderColor: 'var(--border-primary)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[68px]">

            {/* Logo */}
            <button
              onClick={() => { onNavigate('home'); closeMobile(); }}
              className="flex items-center gap-2.5 group focus-ring rounded-lg"
            >
              <div className="bg-[#d97757] p-1.5 rounded-[10px] shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-[-4deg]">
                <Heart className="text-white" size={18} fill="currentColor" />
              </div>
              <span
                className="text-2xl font-semibold tracking-wide"
                style={{ fontFamily: '"Cormorant Garamond", serif', color: 'var(--royal-text)' }}
              >
                Vivah<span className="italic" style={{ color: 'var(--royal-saffron)' }}>Sutra</span>
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 p-1 rounded-full border" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
              {!user && (
                <NavPill
                  label="Home"
                  active={isActive(['home', 'auth-before', 'auth-after'])}
                  onClick={() => onNavigate('home')}
                  activeClass="text-white shadow-sm"
                  activeStyle={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                />
              )}
              {user && profile?.role !== 'mentor' && profile?.role !== 'admin' && (
                <NavPill
                  label="Dashboard"
                  active={isActive(['dashboard', 'dashboard-before', 'dashboard-after'])}
                  onClick={() => onNavigate('home')}
                  activeClass="bg-[#d97757] text-white"
                />
              )}
              {user && profile?.role === 'mentor' && (
                <NavPill
                  label="Mentor Dashboard"
                  active={isActive(['mentor-dashboard'])}
                  onClick={() => onNavigate('mentor-dashboard')}
                  activeClass="text-white shadow-sm font-display"
                  activeStyle={{ backgroundColor: '#5c7c64' } }
                  icon={<GraduationCap size={14} />}
                />
              )}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border transition-all hover:scale-105 focus-ring"
                style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              {user ? (
                <div className="hidden md:flex items-center gap-2 rounded-full border py-1 pl-2 pr-3 transition-all"
                  style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: 'rgba(217,119,87,0.1)', color: '#d97757' }}>
                    {(profile?.full_name?.[0] ?? 'U').toUpperCase()}
                  </div>
                  <div className="flex flex-col pr-2 border-r" style={{ borderColor: 'var(--border-primary)' }}>
                    <span className="text-[12px] font-bold leading-tight max-w-[90px] truncate" style={{ color: 'var(--text-primary)' }}>
                      {profile?.full_name ?? 'User'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold capitalize" style={{ color: 'var(--text-muted)' }}>
                      {profile?.relationship_status ?? 'Member'}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    className="p-1.5 rounded-full transition-colors hover:text-[#a65d50] focus-ring"
                    style={{ color: 'var(--text-muted)' }}
                    title="Sign Out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">

                  <button
                    onClick={onMentorAuthClick}
                    className="flex items-center gap-2 bg-[#d97757] hover:bg-[#a65d50] text-white px-4 py-2 rounded-full font-semibold text-sm shadow-md transition-all hover:-translate-y-0.5 focus-ring"
                  >
                    <GraduationCap size={15} /> Coach Login
                  </button>
                  <button
                    onClick={onAdminAuthClick}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all hover:scale-105 focus-ring"
                    style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                    title="Admin Login"
                  >
                    <ShieldCheck size={16} />
                  </button>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border transition-all focus-ring"
                style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 animate-fade-in"
          style={{ backgroundColor: 'rgba(8,12,20,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={closeMobile}
        >
          <div
            className="animate-slide-down absolute top-[68px] inset-x-0 mx-4 rounded-2xl border p-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1 mb-4">
              {!user && (
                <MobileNavItem label="Home" onClick={() => { onNavigate('home'); closeMobile(); }} active={isActive(['home'])} />
              )}
              {user && profile?.role !== 'mentor' && profile?.role !== 'admin' && (
                <MobileNavItem label="Dashboard" onClick={() => { onNavigate('home'); closeMobile(); }} active={isActive(['dashboard', 'dashboard-before', 'dashboard-after'])} />
              )}
              {user && profile?.role === 'mentor' && (
                <MobileNavItem label="Mentor Dashboard" onClick={() => { onNavigate('mentor-dashboard'); closeMobile(); }} active={isActive(['mentor-dashboard'])} />
              )}
            </div>

            <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </button>

              {user ? (
                <button
                  onClick={() => { signOut(); closeMobile(); }}
                  className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                  style={{ color: '#a65d50' }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              ) : (
                <div className="flex flex-col gap-2">

                  <button
                    onClick={() => { onMentorAuthClick?.(); closeMobile(); }}
                    className="bg-[#d97757] text-white px-5 py-2 rounded-full font-semibold text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    <GraduationCap size={14} /> Coach Login
                  </button>
                  <button
                    onClick={() => { onAdminAuthClick?.(); closeMobile(); }}
                    className="flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <ShieldCheck size={14} /> Admin
                  </button>
                </div>
              )}
            </div>

            {user && profile && (
              <div className="mt-3 pt-3 border-t flex items-center gap-3" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: 'rgba(217,119,87,0.1)', color: '#d97757' }}>
                  {(profile.full_name?.[0] ?? 'U').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{profile.full_name}</p>
                  <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{profile.relationship_status}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NavPill({ label, active, onClick, activeClass, activeStyle, icon }: {
  label: string; active: boolean; onClick: () => void; activeClass: string; activeStyle?: React.CSSProperties; icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 focus-ring ${
        active ? activeClass : ''
      }`}
      style={active ? activeStyle : { color: 'var(--text-secondary)' }}
    >
      {icon}{label}
    </button>
  );
}

function MobileNavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors focus-ring"
      style={active ? { color: '#d97757' } : { color: 'var(--text-secondary)' }}
    >
      {label}
    </button>
  );
}