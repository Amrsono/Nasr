import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Users, Shield, Car, User as UserIcon } from 'lucide-react';

export const DemoAccountSwitcher: React.FC = () => {
  const { user, demoUsers, switchUser } = useAuth();
  const { t, i18n } = useTranslation();

  const getLocalizedDemoName = (demo: any) => {
    if (i18n.language === 'ar') {
      if (demo.role === 'admin') return 'المالك (الإدارة)';
      if (demo.email === 'driver1@nasr.com') return 'السائق ١ (أحمد)';
      if (demo.email === 'driver2@nasr.com') return 'السائق ٢ (محمود)';
      if (demo.email === 'driver3@nasr.com') return 'السائق ٣ (طارق)';
      if (demo.email === 'driver4@nasr.com') return 'السائق ٤ (يوسف)';
      if (demo.role === 'driver') return demo.name.replace('Driver', 'السائق');
      if (demo.role === 'customer') return 'عمرو سونو (العميل)';
    }
    return demo.role === 'admin'
      ? 'Owner (Admin)'
      : demo.email.startsWith('driver')
      ? demo.name.replace(' - ', ' ')
      : 'Amrsono (Customer)';
  };

  return (
    <div className="bg-slate-950/80 backdrop-blur-md border-b border-emerald-500/20 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">{t('app.switchAccount')}:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {demoUsers.map((demo) => {
            const isSelected = user?.email.toLowerCase() === demo.email.toLowerCase();
            const isOwner = demo.role === 'admin';
            const isDriver = demo.role === 'driver';

            return (
              <button
                key={demo.id}
                onClick={() => switchUser(demo.email)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? isOwner
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10 scale-105'
                      : isDriver
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-md shadow-blue-500/10 scale-105'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10 scale-105'
                    : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {isOwner && <Shield className="w-3 h-3 text-amber-400" />}
                {isDriver && <Car className="w-3 h-3 text-blue-400" />}
                {!isOwner && !isDriver && <UserIcon className="w-3 h-3 text-emerald-400" />}
                
                <span>{getLocalizedDemoName(demo)}</span>

                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
