import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Car, Shield, User as UserIcon, Lock, Mail, Phone, Globe, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'customer' | 'driver'>('customer');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [carColor, setCarColor] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuickLoggingEmail, setActiveQuickLoggingEmail] = useState<string | null>(null);

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
  };

  const handleQuickLogin = async (demoEmail: string, demoPw: string) => {
    setError('');
    setActiveQuickLoggingEmail(demoEmail);
    setEmail(demoEmail);
    setPassword(demoPw);
    try {
      await login(demoEmail, demoPw);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setActiveQuickLoggingEmail(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          role,
          phone,
          carDetails:
            role === 'driver'
              ? {
                  model: carModel || 'Standard Sedan',
                  plate: carPlate || '1234 ABC',
                  color: carColor || 'White',
                }
              : undefined,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-white">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Car className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <span className="text-xl font-black tracking-tight text-white">{t('app.name')}</span>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-all"
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-center">
        {/* Left Side: Brand Narrative & 1-Click Quick Demo Accounts */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Ride-Hailing Experience</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {t('auth.welcome')}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('auth.subtitle')}
            </p>
          </div>

          {/* 1-CLICK QUICK DEMO LOGINS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>{t('auth.quickDemo')}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Instant Sign-In</span>
            </div>
            <p className="text-xs text-slate-400">{t('auth.demoHint')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Owner / Admin */}
              <button
                type="button"
                disabled={!!activeQuickLoggingEmail}
                onClick={() => handleQuickLogin('admin@nasr.com', 'admin123')}
                className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left rtl:text-right transition-all group flex items-center justify-between active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    {activeQuickLoggingEmail === 'admin@nasr.com' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300">
                      Owner (Admin)
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">admin@nasr.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Amrsono (Customer) */}
              <button
                type="button"
                disabled={!!activeQuickLoggingEmail}
                onClick={() => handleQuickLogin('amrsono@nasr.com', 'customer123')}
                className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left rtl:text-right transition-all group flex items-center justify-between active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    {activeQuickLoggingEmail === 'amrsono@nasr.com' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Amrsono (Customer)
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">amrsono@nasr.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Driver 1 */}
              <button
                type="button"
                disabled={!!activeQuickLoggingEmail}
                onClick={() => handleQuickLogin('driver1@nasr.com', 'driver123')}
                className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-left rtl:text-right transition-all group flex items-center justify-between active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    {activeQuickLoggingEmail === 'driver1@nasr.com' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Car className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300">
                      Driver 1 - Ahmed
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Toyota Corolla</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Driver 2 */}
              <button
                type="button"
                disabled={!!activeQuickLoggingEmail}
                onClick={() => handleQuickLogin('driver2@nasr.com', 'driver123')}
                className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-left rtl:text-right transition-all group flex items-center justify-between active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    {activeQuickLoggingEmail === 'driver2@nasr.com' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Car className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300">
                      Driver 2 - Mahmoud
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Hyundai Elantra</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Driver 3 */}
              <button
                type="button"
                disabled={!!activeQuickLoggingEmail}
                onClick={() => handleQuickLogin('driver3@nasr.com', 'driver123')}
                className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-left rtl:text-right transition-all group flex items-center justify-between active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    {activeQuickLoggingEmail === 'driver3@nasr.com' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Car className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300">
                      Driver 3 - Tarek
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Nissan Sunny</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Driver 4 */}
              <button
                type="button"
                disabled={!!activeQuickLoggingEmail}
                onClick={() => handleQuickLogin('driver4@nasr.com', 'driver123')}
                className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-left rtl:text-right transition-all group flex items-center justify-between active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    {activeQuickLoggingEmail === 'driver4@nasr.com' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Car className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300">
                      Driver 4 - Youssef
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Kia Cerato</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Login / Register Card */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Tabs */}
            <div className="flex rounded-2xl bg-slate-800/80 p-1.5 border border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`w-1/2 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('auth.login')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`w-1/2 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('auth.register')}
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-4 py-2.5 rounded-xl font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">{t('auth.role')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('customer')}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          role === 'customer'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>Customer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('driver')}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          role === 'driver'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <Car className="w-4 h-4" />
                        <span>Driver</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">{t('auth.fullName')}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Amr Mohamed"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">{t('auth.phone')}</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+20 100 123 4567"
                        className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {role === 'driver' && (
                    <div className="space-y-3 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/60">
                      <div className="text-[11px] font-bold text-blue-400 uppercase">Driver Vehicle Details</div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={carModel}
                          onChange={(e) => setCarModel(e.target.value)}
                          placeholder={t('auth.carModel')}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={carPlate}
                          onChange={(e) => setCarPlate(e.target.value)}
                          placeholder={t('auth.carPlate')}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={carColor}
                          onChange={(e) => setCarColor(e.target.value)}
                          placeholder={t('auth.carColor')}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">{t('auth.email')}</label>
                  {mode === 'login' && (
                    <span className="text-[10px] text-slate-400">
                      Demo: <code className="text-emerald-400">admin@nasr.com</code>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">{t('auth.password')}</label>
                  {mode === 'login' && (
                    <span className="text-[10px] text-slate-400">
                      Demo: <code className="text-emerald-400">admin123</code> / <code className="text-emerald-400">customer123</code>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{mode === 'login' ? t('auth.login') : t('auth.register')}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Nasr Ride-Hailing Platform. All rights reserved.
      </div>
    </div>
  );
};
