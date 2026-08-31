import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Car, User as UserIcon, Lock, Mail, Phone, Globe, Loader2, Sparkles } from 'lucide-react';

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

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
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
      setError(err.message || (i18n.language === 'ar' ? 'فشل تسجيل الدخول. يرجى التأكد من البيانات.' : 'Authentication failed. Please check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Car className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white block">{t('app.name')}</span>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
              {i18n.language === 'ar' ? 'منصة التوصيل الذكية' : 'Smart Ride Platform'}
            </span>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-all"
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* Centered Modern Auth Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left rtl:text-right">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{i18n.language === 'ar' ? 'أهلاً بك في نصر رايد' : 'Welcome to Nasr Ride'}</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              {mode === 'login' ? t('auth.login') : t('auth.register')}
            </h1>
            <p className="text-xs text-slate-400">
              {mode === 'login'
                ? (i18n.language === 'ar' ? 'أدخل بريدك الإلكتروني وكلمة المرور للمتابعة' : 'Enter your email and password to access your portal')
                : (i18n.language === 'ar' ? 'قم بإنشاء حساب جديد كعميل أو سائق في المنصة' : 'Create a new customer or driver account')}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
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
                      <span>{t('roles.customer')}</span>
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
                      <span>{t('roles.driver')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('auth.fullName')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={i18n.language === 'ar' ? 'الاسم بالكامل' : 'Your Full Name'}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none text-left rtl:text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t('auth.phone')}</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3.5 rtl:right-3.5 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+20 100 123 4567"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono text-left rtl:text-right"
                    />
                  </div>
                </div>

                {role === 'driver' && (
                  <div className="space-y-3 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/60">
                    <div className="text-[11px] font-bold text-blue-400 uppercase">
                      {i18n.language === 'ar' ? 'بيانات سيارة السائق' : 'Driver Vehicle Details'}
                    </div>
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        placeholder={t('auth.carModel')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none text-left rtl:text-right"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={carPlate}
                        onChange={(e) => setCarPlate(e.target.value)}
                        placeholder={t('auth.carPlate')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none text-left rtl:text-right font-mono"
                      />
                      <input
                        type="text"
                        value={carColor}
                        onChange={(e) => setCarColor(e.target.value)}
                        placeholder={t('auth.carColor')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none text-left rtl:text-right"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3.5 rtl:right-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none text-left"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3.5 rtl:right-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none text-left"
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

      {/* Footer */}
      <div className="text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Nasr Ride-Hailing Platform. All rights reserved.
      </div>
    </div>
  );
};
