import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { getSocket, sendDriverStatus } from '../../services/socket';
import { UnifiedMap } from '../map/UnifiedMap';
import { Trip, LocationCoords } from '../../types';
import confetti from 'canvas-confetti';
import {
  Car,
  Power,
  Radio,
  MapPin,
  CheckCircle2,
  DollarSign,
  Phone,
  User as UserIcon,
  Award,
  Wallet,
  TrendingUp,
  Edit3,
  Check,
  Save,
  X,
  Palette,
  Hash,
  UploadCloud,
  Camera,
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const DriverDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t, i18n } = useTranslation();

  const [isOnline, setIsOnline] = useState<boolean>(user?.isOnline ?? true);
  const [queueTrips, setQueueTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [driverTrips, setDriverTrips] = useState<Trip[]>([]);
  
  // Payment Dropoff Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit Profile Modal
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [carModelInput, setCarModelInput] = useState(user?.carDetails?.model || '');
  const [carPlateInput, setCarPlateInput] = useState(user?.carDetails?.plate || '');
  const [carColorInput, setCarColorInput] = useState(user?.carDetails?.color || '');
  const [avatarInput, setAvatarInput] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState(false);

  // File Upload Reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Driver's simulated GPS location
  const currentCoords: LocationCoords = user?.currentLocation || { lat: 30.0444, lng: 31.2357 };

  // Localization Helpers
  const getLocalizedDriverName = (name?: string) => {
    if (!name) return '';
    if (i18n.language === 'ar') {
      if (name.includes('Driver 1') || name.includes('Ahmed')) return 'السائق ١ (أحمد)';
      if (name.includes('Driver 2') || name.includes('Mahmoud')) return 'السائق ٢ (محمود)';
      if (name.includes('Driver 3') || name.includes('Tarek')) return 'السائق ٣ (طارق)';
      if (name.includes('Driver 4') || name.includes('Youssef')) return 'السائق ٤ (يوسف)';
      if (name.startsWith('Driver')) return name.replace('Driver', 'السائق');
    }
    return name;
  };

  const getLocalizedColor = (color?: string) => {
    if (!color) return i18n.language === 'ar' ? 'أبيض' : 'White';
    if (i18n.language === 'ar') {
      const lower = color.toLowerCase();
      if (lower.includes('blue')) return 'أزرق';
      if (lower.includes('white')) return 'أبيض';
      if (lower.includes('black')) return 'أسود';
      if (lower.includes('silver')) return 'فضي';
      if (lower.includes('gray') || lower.includes('grey')) return 'رمادي';
      if (lower.includes('red')) return 'أحمر';
    }
    return color;
  };

  const currencyLabel = t('app.egp');
  const distanceUnit = t('app.km');

  // Load Driver's queue and active trip
  const loadDriverData = async () => {
    try {
      const [queue, active, trips] = await Promise.all([
        api.getDriverQueue().catch(() => []),
        api.getActiveTrip().catch(() => null),
        api.getTrips().catch(() => []),
      ]);
      setQueueTrips(queue);
      setActiveTrip(active);
      setDriverTrips(trips);
    } catch (err) {
      console.error('Error loading driver data', err);
    }
  };

  useEffect(() => {
    loadDriverData();
    const interval = setInterval(loadDriverData, 4000);
    return () => clearInterval(interval);
  }, [user]);

  // Sync edit profile form state when user profile changes
  useEffect(() => {
    if (user) {
      setNameInput(user.name);
      setPhoneInput(user.phone || '');
      setCarModelInput(user.carDetails?.model || '');
      setCarPlateInput(user.carDetails?.plate || '');
      setCarColorInput(user.carDetails?.color || '');
      setAvatarInput(user.avatar || '');
    }
  }, [user]);

  // Real-time Socket Subscriptions
  useEffect(() => {
    const socket = getSocket();

    const handleNewRequest = (newTrip: Trip) => {
      if (isOnline) {
        setQueueTrips((prev) => {
          if (prev.some((t) => t.id === newTrip.id)) return prev;
          return [newTrip, ...prev];
        });
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      }
    };

    const handleTripUpdate = (updatedTrip: Trip) => {
      if (updatedTrip.driverId === user?.id) {
        if (updatedTrip.status === 'DROPPED_OFF') {
          setActiveTrip(null);
          refreshUser();
        } else {
          setActiveTrip(updatedTrip);
        }
      }
      if (updatedTrip.status !== 'REQUESTED') {
        setQueueTrips((prev) => prev.filter((t) => t.id !== updatedTrip.id));
      }
      loadDriverData();
    };

    const handleQueueChange = () => {
      loadDriverData();
    };

    socket.on('trip:new_request', handleNewRequest);
    socket.on('trip:updated', handleTripUpdate);
    socket.on('trip:queue_changed', handleQueueChange);

    return () => {
      socket.off('trip:new_request', handleNewRequest);
      socket.off('trip:updated', handleTripUpdate);
      socket.off('trip:queue_changed', handleQueueChange);
    };
  }, [user, isOnline]);

  // Toggle Online Status
  const handleToggleOnline = async () => {
    if (!user) return;
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    sendDriverStatus(user.id, nextStatus);
    await api.updateMe({ isOnline: nextStatus });
    refreshUser();
  };

  // Accept Ride from Queue (First Come, First Served)
  const handleAcceptTrip = async (tripId: string) => {
    setIsProcessing(true);
    try {
      const accepted = await api.acceptTrip(tripId);
      setActiveTrip(accepted);
      setQueueTrips((prev) => prev.filter((t) => t.id !== tripId));
      loadDriverData();
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'تم قبول الرحلة بواسطة سائق آخر' : 'Trip was already taken by another driver'));
      loadDriverData();
    } finally {
      setIsProcessing(false);
    }
  };

  // Flag Customer Picked Up
  const handlePickup = async () => {
    if (!activeTrip) return;
    setIsProcessing(true);
    try {
      const updated = await api.pickupCustomer(activeTrip.id);
      setActiveTrip(updated);
      loadDriverData();
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'فشل تسجيل ركوب العميل' : 'Failed to mark picked up'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Dropoff Modal
  const handleOpenDropoff = () => {
    if (!activeTrip) return;
    setAmountPaidInput(String(activeTrip.estimatedFare));
    setShowPaymentModal(true);
  };

  // Confirm Dropoff and Enter Amount Paid
  const handleConfirmDropoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    setIsProcessing(true);
    const amount = parseFloat(amountPaidInput) || activeTrip.estimatedFare;
    try {
      await api.dropoffCustomer(activeTrip.id, amount);
      setShowPaymentModal(false);
      setActiveTrip(null);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      await refreshUser();
      loadDriverData();
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'فشل إتمام النزول' : 'Failed to complete drop off'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Local Photo File Selection from Phone/Device
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarInput(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Save Driver Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.updateMe({
        name: nameInput.trim(),
        phone: phoneInput.trim(),
        avatar: avatarInput.trim(),
        carDetails: {
          model: carModelInput.trim() || 'Standard Sedan',
          plate: carPlateInput.trim() || '1234 ABC',
          color: carColorInput.trim() || 'White',
        },
      });
      await refreshUser();
      setProfileSuccessMessage(true);
      setTimeout(() => {
        setProfileSuccessMessage(false);
        setShowEditProfileModal(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'فشل حفظ التعديلات' : 'Failed to update profile'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Driver Bar with Edit Profile Button */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl border-2 border-blue-500/40 object-cover bg-slate-800 shadow-lg"
            />
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="absolute -bottom-1 -right-1 rtl:-left-1 rtl:right-auto p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-transform hover:scale-110"
              title={t('driver.editProfile')}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-black text-white">{getLocalizedDriverName(user?.name)}</h1>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {user?.carDetails?.model || 'Toyota Corolla'}
              </span>
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-0.5 rounded-lg transition-all"
              >
                <Edit3 className="w-3 h-3" />
                <span>{t('driver.editProfile')}</span>
              </button>
            </div>
            
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>{t('customer.plate')}: <b className="text-slate-200 font-mono">{user?.carDetails?.plate || '1234 ABC'}</b></span>
              <span>•</span>
              <span>{t('driver.carColor')}: <b className="text-slate-200">{getLocalizedColor(user?.carDetails?.color)}</b></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold font-mono">
                <Award className="w-3.5 h-3.5 fill-amber-400" /> {user?.rating || 4.9}
              </span>
            </p>
          </div>
        </div>

        {/* Online / Offline Switch */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right rtl:text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-200">
              {isOnline ? t('driver.goOnline') : t('driver.goOffline')}
            </div>
            <div className="text-[10px] text-slate-400">
              {isOnline ? t('driver.onlineDesc') : t('driver.offlineDesc')}
            </div>
          </div>

          <button
            onClick={handleToggleOnline}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
              isOnline
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? t('app.online') : t('app.offline')}</span>
          </button>
        </div>
      </div>

      {/* Driver Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">{t('driver.todayEarnings')}</div>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {user?.totalEarnings || 0} <span className="text-xs text-slate-400 font-sans">{currencyLabel}</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">{t('driver.totalTrips')}</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {user?.totalTrips || driverTrips.length}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">{t('driver.driverRating')}</div>
            <div className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1.5 font-mono">
              {user?.rating || 4.9} <Award className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ACTIVE TRIP IN PROGRESS (FLAG WORKFLOW) */}
      {activeTrip && (
        <div className="bg-slate-900/95 border-2 border-blue-500 rounded-3xl p-6 shadow-2xl shadow-blue-950/40 space-y-6 animate-fadeIn text-left rtl:text-right">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-400 animate-ping" />
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  {t('driver.activeTrip')} #{activeTrip.id.slice(-6)}
                </span>
                <h2 className="text-lg font-black text-white">
                  {activeTrip.status === 'ACCEPTED' && t('customer.driverAssigned')}
                  {activeTrip.status === 'PICKED_UP' && t('customer.pickedUp')}
                </h2>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
              {t(`status.${activeTrip.status}`)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">{activeTrip.customerName}</span>
                  </div>
                  {activeTrip.customerPhone && (
                    <a
                      href={`tel:${activeTrip.customerPhone}`}
                      className="flex items-center gap-1 text-xs text-blue-400 font-bold hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="font-mono">{activeTrip.customerPhone}</span>
                    </a>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{t('driver.pickup')}</span>
                      <p className="text-slate-200 font-semibold">{activeTrip.pickupAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{t('driver.destination')}</span>
                      <p className="text-slate-200 font-semibold">{activeTrip.destinationAddress}</p>
                    </div>
                  </div>
                </div>

                {activeTrip.notes && (
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs text-amber-300">
                    <b>{t('customer.notes')}:</b> {activeTrip.notes}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs">
                  <span className="text-slate-400">{t('driver.distance')}: <b className="text-slate-200 font-mono">{activeTrip.distanceKm} {distanceUnit}</b></span>
                  <span className="text-slate-400">{t('driver.estFare')}: <b className="text-emerald-400 text-sm font-mono">{activeTrip.estimatedFare} {currencyLabel}</b></span>
                </div>
              </div>

              {/* ACTION BUTTON WORKFLOW */}
              <div className="space-y-3">
                {activeTrip.status === 'ACCEPTED' && (
                  <div className="space-y-2">
                    <button
                      onClick={handlePickup}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-600/20 active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t('driver.step1Pickup')}</span>
                    </button>
                    <p className="text-[11px] text-slate-400 text-center">
                      {t('driver.step1PickupDesc')}
                    </p>
                  </div>
                )}

                {activeTrip.status === 'PICKED_UP' && (
                  <div className="space-y-2">
                    <button
                      onClick={handleOpenDropoff}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black text-sm shadow-xl shadow-blue-600/20 active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-5 h-5" />
                      <span>{t('driver.step2Dropoff')}</span>
                    </button>
                    <p className="text-[11px] text-slate-400 text-center">
                      {t('driver.step2DropoffDesc')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-6">
              <UnifiedMap
                pickupCoords={activeTrip.pickupCoords}
                destinationCoords={activeTrip.destinationCoords}
                driverCoords={currentCoords}
                height="320px"
                zoom={13}
              />
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH RADAR / QUEUE */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5 text-left rtl:text-right">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>{t('driver.tripRadar')}</span>
            </h2>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 font-semibold font-mono">
            {queueTrips.length} {t('driver.waitingInQueue')}
          </span>
        </div>

        {queueTrips.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {t('driver.noQueue')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queueTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-slate-800/90 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {t('driver.firstCome')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      #{trip.id.slice(-6)}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>{trip.customerName}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="truncate text-slate-300">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">{t('driver.pickup')}</span>
                        {trip.pickupAddress}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="truncate text-slate-300">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">{t('driver.destination')}</span>
                        {trip.destinationAddress}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/80 text-xs">
                    <span className="text-slate-400">{t('driver.distance')}: <b className="text-slate-200 font-mono">{trip.distanceKm} {distanceUnit}</b></span>
                    <span className="text-slate-400">{t('driver.estFare')}: <b className="text-emerald-400 text-sm font-mono">{trip.estimatedFare} {currencyLabel}</b></span>
                  </div>
                </div>

                <button
                  onClick={() => handleAcceptTrip(trip.id)}
                  disabled={isProcessing || !isOnline || !!activeTrip}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                    !isOnline || !!activeTrip
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>{t('driver.acceptTrip')}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DROP-OFF & AMOUNT PAID MODAL */}
      {showPaymentModal && activeTrip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp text-left rtl:text-right">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">{t('driver.enterPayment')}</h3>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <span>{t('driver.customer')}:</span>
                <b className="text-slate-200">{activeTrip.customerName}</b>
              </p>
            </div>

            <form onSubmit={handleConfirmDropoff} className="space-y-4">
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-medium">{t('driver.estFare')}:</span>
                  <span className="text-slate-200 font-bold font-mono">
                    {activeTrip.estimatedFare} {currencyLabel}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-medium">{t('driver.distance')}:</span>
                  <span className="text-slate-200 font-bold font-mono">
                    {activeTrip.distanceKm} {distanceUnit}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  {t('driver.amountPaid')} ({currencyLabel})
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="w-full bg-slate-800 border-2 border-emerald-500/60 focus:border-emerald-400 rounded-xl ltr:pl-4 ltr:pr-16 rtl:pr-4 rtl:pl-16 py-3 text-lg font-black text-emerald-400 focus:outline-none text-left rtl:text-right"
                    required
                  />
                  <span className="absolute ltr:right-4 rtl:left-4 text-xs font-bold text-slate-400 pointer-events-none select-none font-sans">
                    {currencyLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-1/2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('driver.confirmPayment')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER EDIT PROFILE & VEHICLE MODAL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp my-8 text-left rtl:text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{t('driver.editProfile')}</h3>
                  <p className="text-[11px] text-slate-400">{t('driver.editProfileDesc')}</p>
                </div>
              </div>

              <button
                onClick={() => setShowEditProfileModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Avatar Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  {t('driver.avatar')}
                </label>
                
                {/* Current Avatar Preview & Preset picker */}
                <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                  <div className="relative group">
                    <img
                      src={avatarInput || `https://api.dicebear.com/7.x/bottts/svg?seed=${nameInput}`}
                      alt="Preview"
                      className="w-16 h-16 rounded-2xl border-2 border-blue-500/50 object-cover bg-slate-900 shrink-0 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-opacity"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {t('driver.avatarPresets')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarInput(preset)}
                          className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-all ${
                            avatarInput === preset
                              ? 'border-blue-500 scale-110 shadow-md shadow-blue-500/30'
                              : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LOCATE PICTURE FROM PHONE / DEVICE STORAGE */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border-2 border-dashed border-blue-500/50 hover:border-blue-400 text-blue-300 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.99]"
                >
                  <UploadCloud className="w-4 h-4 text-blue-400" />
                  <span>{t('driver.locatePicture')}</span>
                </button>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('driver.fullName')}</span>
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('driver.phone')}</span>
                  </label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none text-left rtl:text-right font-mono"
                  />
                </div>
              </div>

              {/* Vehicle Info Section */}
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-3">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-4 h-4" />
                  <span>{t('driver.vehicleInfo')}</span>
                </div>

                {/* Car Type / Model */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    {t('driver.carModel')}
                  </label>
                  <input
                    type="text"
                    value={carModelInput}
                    onChange={(e) => setCarModelInput(e.target.value)}
                    placeholder={i18n.language === 'ar' ? 'مثال: تويوتا كورولا ٢٠٢٢' : 'e.g. Toyota Corolla (2022)'}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Car Plate & Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('driver.carPlate')}</span>
                    </label>
                    <input
                      type="text"
                      value={carPlateInput}
                      onChange={(e) => setCarPlateInput(e.target.value)}
                      placeholder={i18n.language === 'ar' ? 'مثال: ١٢٣٤ أ ب ج' : 'e.g. 1234 ABC'}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('driver.carColor')}</span>
                    </label>
                    <input
                      type="text"
                      value={carColorInput}
                      onChange={(e) => setCarColorInput(e.target.value)}
                      placeholder={i18n.language === 'ar' ? 'مثال: أبيض / أسود / فضي' : 'e.g. White / Black / Silver'}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Success Notification */}
              {profileSuccessMessage && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{t('driver.profileSaved')}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-1/2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProfile ? t('common.loading') : t('driver.saveProfile')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
