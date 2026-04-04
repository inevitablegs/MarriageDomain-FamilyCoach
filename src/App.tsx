import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Auth } from './components/Auth';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { CompatibilityQuiz } from './pages/CompatibilityQuiz';
import { RedFlagChecker } from './pages/RedFlagChecker';
import { HealthTracker } from './pages/HealthTracker';

type Page = 'home' | 'dashboard' | 'quiz' | 'red-flags' | 'health-tracker';
type AppPage = Page | 'auth-before' | 'auth-after' | 'dashboard-before' | 'dashboard-after';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const { loading, profile, user } = useAuth();

  const getDashboardPage = (): AppPage =>
    profile?.relationship_status === 'married' ? 'dashboard-after' : 'dashboard-before';

  const handleNavigate = (page: string) => {
    if (page === 'home' && user) {
      setCurrentPage(getDashboardPage());
      window.scrollTo(0, 0);
      return;
    }

    if (page === 'dashboard' && user) {
      setCurrentPage(getDashboardPage());
      window.scrollTo(0, 0);
      return;
    }

    if (page === 'quiz' || page === 'red-flags' || page === 'health-tracker' || page === 'dashboard') {
      if (!user) {
        setCurrentPage(page === 'health-tracker' ? 'auth-after' : 'auth-before');
        return;
      }
    }
    setCurrentPage(page as AppPage);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const isProtectedPage =
      currentPage === 'dashboard' ||
      currentPage === 'dashboard-before' ||
      currentPage === 'dashboard-after' ||
      currentPage === 'quiz' ||
      currentPage === 'red-flags' ||
      currentPage === 'health-tracker';

    if (!user && isProtectedPage) {
      setCurrentPage('home');
      window.scrollTo(0, 0);
    } else if (user && currentPage === 'home' && profile) {
      setCurrentPage(getDashboardPage());
      window.scrollTo(0, 0);
    }
  }, [currentPage, user, profile]);

  const handleAuthClick = () => setCurrentPage('auth-before');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <Header
        onAuthClick={handleAuthClick}
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      <main className="flex-grow animate-fade-in">
        {currentPage === 'home' && !user && (
          <Landing onNavigate={handleNavigate} />
        )}

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

        {currentPage === 'dashboard' && user && (
          <Dashboard onNavigate={handleNavigate} mode={profile?.relationship_status === 'married' ? 'after' : 'before'} />
        )}

        {currentPage === 'dashboard-before' && user && (
          <Dashboard onNavigate={handleNavigate} mode="before" />
        )}

        {currentPage === 'dashboard-after' && user && (
          <Dashboard onNavigate={handleNavigate} mode="after" />
        )}

        {currentPage === 'quiz' && user && (
          <CompatibilityQuiz onNavigate={handleNavigate} />
        )}

        {currentPage === 'red-flags' && user && (
          <RedFlagChecker onNavigate={handleNavigate} />
        )}

        {currentPage === 'health-tracker' && user && (
          <HealthTracker onNavigate={handleNavigate} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
