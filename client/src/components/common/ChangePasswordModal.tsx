import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { User } from '../../types';
import { Lock, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, X, Shield } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, user }) => {
  const { t, i18n } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !user) return null;

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 4) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(t('auth.passwordChangedSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(
        err.message ||
          (i18n.language === 'ar'
            ? 'فشل تغيير كلمة المرور. يرجى التأكد من كلمة المرور الحالية.'
            : 'Failed to update password. Please check your current password.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp text-left rtl:text-right">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">{t('auth.changePassword')}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{user.name}</span>
              <span className="text-slate-600">•</span>
              <span className="capitalize font-semibold text-emerald-400">{t(`roles.${user.role}`)}</span>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{t('auth.currentPassword')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute ltr:left-3.5 rtl:right-3.5 top-3" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl ltr:pl-10 ltr:pr-10 rtl:pr-10 rtl:pl-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none text-left"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute ltr:right-3 rtl:left-3 top-2.5 text-slate-400 hover:text-slate-200 p-0.5"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{t('auth.newPassword')}</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute ltr:left-3.5 rtl:right-3.5 top-3" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl ltr:pl-10 ltr:pr-10 rtl:pr-10 rtl:pl-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none text-left"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute ltr:right-3 rtl:left-3 top-2.5 text-slate-400 hover:text-slate-200 p-0.5"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{t('auth.confirmNewPassword')}</label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute ltr:left-3.5 rtl:right-3.5 top-3" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl ltr:pl-10 ltr:pr-10 rtl:pr-10 rtl:pl-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none text-left"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute ltr:right-3 rtl:left-3 top-2.5 text-slate-400 hover:text-slate-200 p-0.5"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t('auth.savePassword')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
