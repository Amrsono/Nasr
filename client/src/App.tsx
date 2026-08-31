import React from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { AuthPage } from './components/auth/AuthPage';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Car } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

export const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
          <Car className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider animate-pulse">
          Loading Nasr Ride...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Main Top Navigation */}
      <Navbar />

      {/* Role-Based Dashboard View */}
      <main className="flex-1 pb-12">
        {user.role === 'admin' && <AdminDashboard />}
        {user.role === 'driver' && <DriverDashboard />}
        {user.role === 'customer' && <CustomerDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        Nasr Ride Platform Phase 1 • Real-Time Dispatch & Google Maps Ready
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <>
      <AppContent />
      <Analytics />
    </>
  );
};

export default App;
