import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Car, Globe, LogOut, Shield, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'admin') {
      return (
        <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
          <Shield className="w-3 h-3" />
          {t('roles.admin')}
        </span>
      );
    }
    if (user.role === 'driver') {
      return (
        <span className="flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
          <Car className="w-3 h-3" />
          {t('roles.driver')}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
        <UserIcon className="w-3 h-3" />
        {t('roles.customer')}
      </span>
    );
  };

  const getLocalizedUserName = (name: string) => {
    if (i18n.language === 'ar') {
      if (name === 'Owner Admin') return 'المالك (الإدارة العامة)';
      if (name.includes('Driver 1') || name.includes('Ahmed')) return 'السائق ١ (أحمد)';
      if (name.includes('Driver 2') || name.includes('Mahmoud')) return 'السائق ٢ (محمود)';
      if (name.includes('Driver 3') || name.includes('Tarek')) return 'السائق ٣ (طارق)';
      if (name.includes('Driver 4') || name.includes('Youssef')) return 'السائق ٤ (يوسف)';
      if (name === 'Amrsono') return 'عمرو سونو';
    }
    return name;
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Car className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                {t('app.name')}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {t('app.phase1')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block leading-none mt-0.5">
              {t('app.tagline')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {getRoleBadge()}

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title={t('app.language')}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800 rtl:border-l-0 rtl:border-r rtl:pr-2">
              <div className="hidden md:flex flex-col text-right rtl:text-left leading-none">
                <span className="text-xs font-bold text-slate-200">{getLocalizedUserName(user.name)}</span>
                <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
              </div>

              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-slate-700 object-cover bg-slate-800"
              />

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title={t('app.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
