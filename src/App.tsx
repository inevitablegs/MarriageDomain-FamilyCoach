import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Landing } from './pages/Landing';
import { Auth } from './components/Auth';
import { Dashboard } from './pages/Dashboard';
import { CompatibilityQuiz } from './pages/CompatibilityQuiz';
import { HealthTracker } from './pages/HealthTracker';
import { RedFlagChecker } from './pages/RedFlagChecker';
import { PreMarriageAnalysis } from './pages/PreMarriageAnalysis';
import { ConflictResolution } from './pages/ConflictResolution';
import { CouplePulseCheck } from './pages/CouplePulseCheck';
import { Services } from './pages/Services';
import { MentorDashboard } from './pages/MentorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ChatPage } from './pages/ChatPage';
import { RelationshipStressTest } from './pages/RelationshipStressTest';
import { NeedToKnow } from './pages/NeedToKnow';
import { ExpectationResolver } from './pages/ExpectationResolver';
import { Pricing } from './pages/Pricing';

// ── Page type ────────────────────────────────────────────────────────────────
type AppPage =
  | 'home'
  | 'auth-before'
  | 'auth-after'
  | 'dashboard'
  | 'dashboard-before'
  | 'dashboard-after'
  | 'quiz'
  | 'red-flags'
  | 'health-tracker'
  | 'pre-marriage-analysis'
  | 'conflict-resolution'
  | 'couple-pulse-check'
  | 'services'
  | 'auth-mentor'
  | 'auth-admin'
  | 'mentor-dashboard'
  | 'admin-dashboard'
  | 'chat'
  | 'relationship-stress-test'
  | 'need-to-know'
  | 'expectation-resolver'
  | 'pricing';

// ── Global spinner ────────────────────────────────────────────────────────────
function GlobalLoader() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Animated logo mark */}
      <div className="relative">
        <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-xl shadow-rose-500/30 animate-pulse">
          <Heart className="text-white" size={28} fill="currentColor" />
        </div>
        {/* Spinning ring */}
        <div className="absolute -inset-2 rounded-[24px] border-2 border-rose-400/20 border-t-rose-500 animate-spin" />
      </div>
      <p
        className="text-sm font-semibold tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        Loading MarriageWise…
      </p>
    </div>
  );
}

// ── Inner app (needs auth context) ───────────────────────────────────────────
function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<AppPage>('home');

  const getDashboardPage = (): AppPage => {
    if (!profile) return 'dashboard';
    return profile.relationship_status === 'married'
      ? 'dashboard-after'
      : 'dashboard-before';
  };

  const handleNavigate = (page: string) => {
    if (page === 'home' && user) {
      setCurrentPage(getDashboardPage());
      window.scrollTo(0, 0);
      return;
    }

    if (
      page === 'quiz' ||
      page === 'red-flags' ||
      page === 'health-tracker' ||
      page === 'dashboard' ||
      page === 'pre-marriage-analysis' ||
      page === 'conflict-resolution' ||
      page === 'couple-pulse-check' ||
      page === 'relationship-stress-test' ||
      page === 'need-to-know' ||
      page === 'expectation-resolver' ||
      page === 'pricing'
    ) {
      if (!user) {
        setCurrentPage(page === 'health-tracker' ? 'auth-after' : 'auth-before');
        return;
      }
    }
    setCurrentPage(page as AppPage);
    window.scrollTo(0, 0);
  };

  // ── Auth guard: redirect unauthenticated users away from protected pages ──
  useEffect(() => {
    const isProtectedPage =
      currentPage === 'dashboard' ||
      currentPage === 'dashboard-before' ||
      currentPage === 'dashboard-after' ||
      currentPage === 'quiz' ||
      currentPage === 'red-flags' ||
      currentPage === 'health-tracker' ||
      currentPage === 'pre-marriage-analysis' ||
      currentPage === 'conflict-resolution' ||
      currentPage === 'couple-pulse-check' ||
      currentPage === 'relationship-stress-test' ||
      currentPage === 'need-to-know' ||
      currentPage === 'expectation-resolver';

    if (!user && isProtectedPage) {
      setCurrentPage('home');
      window.scrollTo(0, 0);
    } else if (user && currentPage === 'home' && profile) {
      setCurrentPage(getDashboardPage());
      window.scrollTo(0, 0);
    }
  }, [currentPage, user, profile]);



  const handleAuthClick = () => {
    setCurrentPage('auth-before');
  };

  const handleMentorAuthClick = () => {
    setCurrentPage('auth-mentor');
  };

  const handleAdminAuthClick = () => {
    setCurrentPage('auth-admin');
  };

  if (loading) return <GlobalLoader />;

  return (
    <div
      className="min-h-screen font-sans flex flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Header
        onAuthClick={handleAuthClick}
        onMentorAuthClick={handleMentorAuthClick}
        onAdminAuthClick={handleAdminAuthClick}
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      <main className="flex-grow animate-fade-in">
        {/* Public pages */}
        {currentPage === 'home' && !user && (
          <Landing onNavigate={handleNavigate} />
        )}

        {currentPage === 'services' && (
          <Services onAuthClick={handleAuthClick} onNavigate={handleNavigate} />
        )}

        {/* Auth flows */}
        {currentPage === 'auth-before' && (
          <Auth
            mode="before"
            onBack={() => handleNavigate('home')}
            onSuccess={() => setCurrentPage('dashboard-before')}
          />
        )}

        {currentPage === 'auth-after' && (
          <Auth
            mode="after"
            onBack={() => handleNavigate('home')}
            onSuccess={() => setCurrentPage('dashboard-after')}
          />
        )}

        {currentPage === 'auth-mentor' && (
          <Auth
            mode="mentor"
            onBack={() => handleNavigate('home')}
            onSuccess={() => setCurrentPage('mentor-dashboard')}
          />
        )}

        {currentPage === 'auth-admin' && (
          <Auth
            mode="admin"
            onBack={() => handleNavigate('home')}
            onSuccess={() => setCurrentPage('admin-dashboard')}
          />
        )}

        {/* Dashboards */}
        {currentPage === 'dashboard' && user && (
          <Dashboard
            onNavigate={handleNavigate}
            mode={profile?.relationship_status === 'married' ? 'after' : 'before'}
          />
        )}

        {currentPage === 'dashboard-before' && user && (
          <Dashboard onNavigate={handleNavigate} mode="before" />
        )}

        {currentPage === 'dashboard-after' && user && (
          <Dashboard onNavigate={handleNavigate} mode="after" />
        )}

        {currentPage === 'mentor-dashboard' && user && (
          <MentorDashboard onNavigate={handleNavigate} />
        )}

        {currentPage === 'admin-dashboard' && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}

        {/* Feature pages */}
        {currentPage === 'quiz' && user && (
          <CompatibilityQuiz onNavigate={handleNavigate} />
        )}

        {currentPage === 'red-flags' && user && (
          <RedFlagChecker onNavigate={handleNavigate} />
        )}

        {currentPage === 'health-tracker' && user && (
          <HealthTracker onNavigate={handleNavigate} />
        )}

        {currentPage === 'pre-marriage-analysis' && user && (
          <PreMarriageAnalysis onNavigate={handleNavigate} />
        )}

        {currentPage === 'conflict-resolution' && user && (
          <ConflictResolution onNavigate={handleNavigate} />
        )}

        {currentPage === 'couple-pulse-check' && user && (
          <CouplePulseCheck onNavigate={handleNavigate} />
        )}

        {currentPage === 'relationship-stress-test' && user && (
          <RelationshipStressTest onNavigate={handleNavigate} />
        )}

        {currentPage === 'need-to-know' && (
          <NeedToKnow onNavigate={handleNavigate} />
        )}

        {currentPage === 'expectation-resolver' && user && (
          <ExpectationResolver onNavigate={handleNavigate} />
        )}

        {currentPage === 'chat' && user && (
          <ChatPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'pricing' && user && (
          <Pricing 
            onBack={() => handleNavigate('home')} 
            onSuccess={() => handleNavigate('home')}
          />
        )}
      </main>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;