import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { UnifiedMap } from '../map/UnifiedMap';
import { Trip, LocationCoords } from '../../types';
import confetti from 'canvas-confetti';
import {
  MapPin,
  Navigation,
  Clock,
  Car,
  Phone,
  Star,
  CheckCircle,
  XCircle,
  Sparkles,
  History,
} from 'lucide-react';

const PRESET_LOCATIONS: { nameEn: string; nameAr: string; addressEn: string; addressAr: string; coords: LocationCoords }[] = [
  { nameEn: 'Tahrir Square (Downtown)', nameAr: 'ميدان التحرير (وسط البلد)', addressEn: 'Tahrir Square, Downtown Cairo', addressAr: 'ميدان التحرير، وسط البلد، القاهرة', coords: { lat: 30.0444, lng: 31.2357 } },
  { nameEn: 'Cairo Airport Terminal 3', nameAr: 'مطار القاهرة مبنى ٣', addressEn: 'Cairo International Airport, Terminal 3', addressAr: 'مطار القاهرة الدولي، صالة ٣', coords: { lat: 30.1219, lng: 31.4056 } },
  { nameEn: 'Citystars Mall (Nasr City)', nameAr: 'سيتي ستارز (مدينة نصر)', addressEn: 'Citystars Mall, Omar Ibn El-Khattab, Nasr City', addressAr: 'سيتي ستارز مول، شارع عمر بن الخطاب، مدينة نصر', coords: { lat: 30.0735, lng: 31.3456 } },
  { nameEn: 'Zamalek (Gezira Island)', nameAr: 'حي الزمالك', addressEn: '26th of July St, Zamalek, Cairo', addressAr: 'شارع ٢٦ يوليو، الزمالك، القاهرة', coords: { lat: 30.0617, lng: 31.2195 } },
  { nameEn: 'New Cairo (5th Settlement)', nameAr: 'التجمع الخامس (شارع التسعين)', addressEn: '90th Street, 5th Settlement, New Cairo', addressAr: 'شارع التسعين، التجمع الخامس، القاهرة الجديدة', coords: { lat: 30.0167, lng: 31.4397 } },
  { nameEn: 'Maadi Corniche', nameAr: 'كورنيش المعادي', addressEn: 'Corniche El Maadi, Cairo', addressAr: 'كورنيش المعادي، القاهرة', coords: { lat: 29.9602, lng: 31.2569 } },
  { nameEn: 'Giza Pyramids', nameAr: 'أهرامات الجيزة', addressEn: 'Al Haram, Giza Governorate', addressAr: 'منطقة الأهرامات، الهرم، الجيزة', coords: { lat: 29.9792, lng: 31.1342 } },
];

export const CustomerDashboard: React.FC = () => {
  const { user, settings } = useAuth();
  const { t, i18n } = useTranslation();

  const [pickupAddress, setPickupAddress] = useState(
    i18n.language === 'ar' ? 'ميدان التحرير، وسط البلد، القاهرة' : 'Tahrir Square, Downtown Cairo'
  );
  const [pickupCoords, setPickupCoords] = useState<LocationCoords>({ lat: 30.0444, lng: 31.2357 });

  const [destAddress, setDestAddress] = useState(
    i18n.language === 'ar' ? 'سيتي ستارز مول، شارع عمر بن الخطاب، مدينة نصر' : 'Citystars Mall, Omar Ibn El-Khattab, Nasr City'
  );
  const [destCoords, setDestCoords] = useState<LocationCoords>({ lat: 30.0735, lng: 31.3456 });

  const [mapMode, setMapMode] = useState<'pickup' | 'destination' | 'view'>('view');
  const [notes, setNotes] = useState('');
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [driverLocation, setDriverLocation] = useState<LocationCoords | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hasRated, setHasRated] = useState(false);

  const currencyLabel = t('app.egp');
  const distanceUnit = t('app.km');

  // Calculate distance & estimated fare
  const calculateDistance = (p1: LocationCoords, p2: LocationCoords): number => {
    const R = 6371;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const distanceKm = Math.max(1.5, calculateDistance(pickupCoords, destCoords));
  const baseFare = settings?.baseFare || 20;
  const perKm = settings?.perKmRate || 6.5;
  const estimatedFare = Math.round(baseFare + distanceKm * perKm);

  // Load Active Trip and History
  const loadData = async () => {
    try {
      const [active, history] = await Promise.all([
        api.getActiveTrip().catch(() => null),
        api.getTrips().catch(() => []),
      ]);

      setActiveTrip((prev) => {
        if (!active && prev && ['REQUESTED', 'ACCEPTED', 'PICKED_UP'].includes(prev.status)) {
          const fromHistory = history.find((t) => t.id === prev.id);
          if (fromHistory) {
            if (fromHistory.status === 'DROPPED_OFF' || fromHistory.status === 'CANCELLED') {
              return fromHistory.status === 'DROPPED_OFF' ? fromHistory : null;
            }
          }
          return prev;
        }
        return active;
      });

      setRecentTrips(history);
    } catch (err) {
      console.error('Error fetching customer data', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, []);

  // Socket.IO event subscriptions for real-time updates
  useEffect(() => {
    const socket = getSocket();

    const handleTripUpdate = (updatedTrip: Trip) => {
      if (updatedTrip.customerId === user?.id) {
        setActiveTrip((prev) => {
          if (updatedTrip.status === 'DROPPED_OFF' && prev?.status !== 'DROPPED_OFF') {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
          }
          if (updatedTrip.status === 'CANCELLED') {
            return null;
          }
          return updatedTrip;
        });
        loadData();
      }
    };

    const handleDriverLocation = (data: { tripId: string; coords: LocationCoords }) => {
      if (activeTrip && activeTrip.id === data.tripId) {
        setDriverLocation(data.coords);
      }
    };

    socket.on('trip:updated', handleTripUpdate);
    socket.on('trip:driver_location', handleDriverLocation);

    return () => {
      socket.off('trip:updated', handleTripUpdate);
      socket.off('trip:driver_location', handleDriverLocation);
    };
  }, [user, activeTrip]);

  // Request Ride Action
  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newTrip = await api.createTrip({
        pickupAddress,
        pickupCoords,
        destinationAddress: destAddress,
        destinationCoords: destCoords,
        distanceKm,
        notes,
      });
      setActiveTrip(newTrip);
      setHasRated(false);
      loadData();
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'فشل طلب الرحلة' : 'Failed to request ride'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Active Ride
  const handleCancelRide = async () => {
    if (!activeTrip) return;
    const confirmMsg = i18n.language === 'ar' ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this ride?';
    if (!confirm(confirmMsg)) return;
    try {
      await api.cancelTrip(activeTrip.id);
      setActiveTrip(null);
      loadData();
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'فشل الإلغاء' : 'Failed to cancel'));
    }
  };

  // Submit Rating
  const handleRateDriver = async () => {
    if (!activeTrip) return;
    try {
      await api.rateTrip(activeTrip.id, selectedRating);
      setHasRated(true);
      setTimeout(() => {
        setActiveTrip(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'فشل إرسال التقييم' : 'Failed to submit rating'));
    }
  };

  const getLocalizedDriverName = (name?: string | null) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Welcome Bar */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{i18n.language === 'ar' ? `أهلاً بك، ${user?.name === 'Amrsono' ? 'عمرو سونو' : user?.name}` : `Welcome back, ${user?.name}`}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white">
            {t('customer.bookRide')}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {i18n.language === 'ar'
              ? 'حدد نقطة الانطلاق والوصول على الخريطة التفاعلية لحجز رحلتك فوراً'
              : 'Pin your pickup and destination on the interactive map to connect with a nearby driver.'}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">{t('admin.baseFare')}</div>
            <div className="text-sm font-black text-white font-mono">{baseFare} {currencyLabel} + {perKm} {currencyLabel}/{distanceUnit}</div>
          </div>
        </div>
      </div>

      {/* ACTIVE TRIP IN PROGRESS BANNER */}
      {activeTrip && (
        <div className="bg-slate-800/95 border-2 border-emerald-500 rounded-3xl p-6 shadow-2xl shadow-emerald-950/40 animate-fadeIn space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {t('app.activeTrip')} #{activeTrip.id.slice(-6)}
                </span>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  {activeTrip.status === 'REQUESTED' && (
                    <span className="text-amber-400 flex items-center gap-2">
                      <Clock className="w-5 h-5 animate-spin" /> {t('customer.searchingDriver')}
                    </span>
                  )}
                  {activeTrip.status === 'ACCEPTED' && (
                    <span className="text-blue-400 flex items-center gap-2">
                      <Car className="w-5 h-5 animate-bounce" /> {t('customer.driverAssigned')}
                    </span>
                  )}
                  {activeTrip.status === 'PICKED_UP' && (
                    <span className="text-emerald-400 flex items-center gap-2">
                      <Navigation className="w-5 h-5 animate-pulse" /> {t('customer.pickedUp')}
                    </span>
                  )}
                  {activeTrip.status === 'DROPPED_OFF' && (
                    <span className="text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> {t('customer.completed')}
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {activeTrip.status === 'REQUESTED' && (
              <button
                onClick={handleCancelRide}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                {t('customer.cancelRide')}
              </button>
            )}
          </div>

          {/* Active Trip Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-slate-900/80 rounded-2xl p-4 border border-slate-700/60 space-y-3 text-left rtl:text-right">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{t('customer.pickupLocation')}</div>
                  <div className="text-xs font-semibold text-slate-200">{activeTrip.pickupAddress}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-rose-400 mt-1 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{t('customer.dropoffLocation')}</div>
                  <div className="text-xs font-semibold text-slate-200">{activeTrip.destinationAddress}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>{t('customer.distance')}:</span>
                  <b className="text-slate-200 font-mono">{activeTrip.distanceKm} {distanceUnit}</b>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>{t('customer.cost')}:</span>
                  <b className="text-emerald-400 text-sm font-mono">
                    {activeTrip.finalFare || activeTrip.estimatedFare} {currencyLabel}
                  </b>
                </div>
              </div>
            </div>

            {activeTrip.driverName ? (
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-blue-500/30 flex flex-col justify-between text-left rtl:text-right">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-blue-400 font-bold uppercase">{t('customer.driverDetails')}</span>
                    <span className="flex items-center gap-1 text-xs text-amber-400 font-bold font-mono">
                      <Star className="w-3 h-3 fill-amber-400" /> 4.9
                    </span>
                  </div>
                  <div className="text-sm font-black text-white">{getLocalizedDriverName(activeTrip.driverName)}</div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-blue-400" />
                    <span>{activeTrip.driverCar || 'Toyota Corolla'}</span>
                  </div>
                </div>

                {activeTrip.driverPhone && (
                  <a
                    href={`tel:${activeTrip.driverPhone}`}
                    className="mt-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all font-mono"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{activeTrip.driverPhone}</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/60 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center animate-pulse mb-2">
                  <Car className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {t('customer.waitingQueue')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {t('customer.waitingQueueDesc')}
                </div>
              </div>
            )}
          </div>

          {activeTrip.status === 'DROPPED_OFF' && (
            <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 p-5 rounded-2xl border border-emerald-500/50 text-center space-y-3">
              <div className="text-sm font-bold text-white">
                🎉 {t('customer.completed')} • {t('common.fare')}: <span className="text-emerald-400 text-lg font-black font-mono">{activeTrip.finalFare || activeTrip.estimatedFare} {currencyLabel}</span>
              </div>

              {!hasRated ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-slate-300">{t('customer.rateDriver')}</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRating(star)}
                        className={`p-1.5 transition-transform hover:scale-125 ${
                          star <= selectedRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleRateDriver}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    {t('customer.submitRating')}
                  </button>
                </div>
              ) : (
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('customer.thankYouRating')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MAIN BOOKING INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5 text-left rtl:text-right">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>{t('customer.bookRide')}</span>
            </h2>

            <form onSubmit={handleRequestRide} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {t('customer.pickupLocation')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setMapMode(mapMode === 'pickup' ? 'view' : 'pickup')}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                      mapMode === 'pickup'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {mapMode === 'pickup' ? '✓ ' + t('customer.pinOnMap') : t('customer.pinOnMap')}
                  </button>
                </div>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder={t('customer.searchAddress')}
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all text-left rtl:text-right"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {t('customer.dropoffLocation')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setMapMode(mapMode === 'destination' ? 'view' : 'destination')}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                      mapMode === 'destination'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                        : 'bg-slate-800 text-rose-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {mapMode === 'destination' ? '✓ ' + t('customer.pinOnMap') : t('customer.pinOnMap')}
                  </button>
                </div>
                <input
                  type="text"
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                  placeholder={t('customer.searchAddress')}
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all text-left rtl:text-right"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  {t('customer.popularLocations')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LOCATIONS.map((preset, idx) => {
                    const presetName = i18n.language === 'ar' ? preset.nameAr : preset.nameEn;
                    const presetAddress = i18n.language === 'ar' ? preset.addressAr : preset.addressEn;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (mapMode === 'pickup') {
                            setPickupAddress(presetAddress);
                            setPickupCoords(preset.coords);
                          } else {
                            setDestAddress(presetAddress);
                            setDestCoords(preset.coords);
                          }
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/70 hover:border-slate-600 transition-colors"
                      >
                        {presetName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">{t('customer.notes')}</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('customer.notesPlaceholder')}
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all resize-none text-left rtl:text-right"
                />
              </div>

              <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{t('customer.distance')}</div>
                  <div className="text-sm font-bold text-slate-200 font-mono">{distanceKm} {distanceUnit}</div>
                </div>
                <div className="text-right rtl:text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{t('customer.estCost')}</div>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {estimatedFare} <span className="text-xs font-sans">{currencyLabel}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !!activeTrip}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                  activeTrip
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.99]'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>{isSubmitting ? t('common.loading') : t('customer.requestRide')}</span>
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 rounded-3xl p-3 border border-slate-800 shadow-xl">
            <UnifiedMap
              pickupCoords={pickupCoords}
              destinationCoords={destCoords}
              driverCoords={driverLocation}
              activeMode={mapMode}
              onPickupChange={(coords) => {
                setPickupCoords(coords);
                setPickupAddress(i18n.language === 'ar' ? `موقع محدد (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : `Pinned Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
              }}
              onDestinationChange={(coords) => {
                setDestCoords(coords);
                setDestAddress(i18n.language === 'ar' ? `موقع محدد (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : `Pinned Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
              }}
              height="480px"
              zoom={12}
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 text-left rtl:text-right">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <span>{t('customer.recentRides')}</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">{recentTrips.length} {t('common.total')}</span>
        </div>

        {recentTrips.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            {t('customer.noRides')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-800/60 rounded-xl">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl rtl:rounded-l-none rtl:rounded-r-xl">ID</th>
                  <th className="py-3 px-4">{t('common.date')}</th>
                  <th className="py-3 px-4">{t('common.driver')}</th>
                  <th className="py-3 px-4">{t('common.route')}</th>
                  <th className="py-3 px-4">{t('common.fare')}</th>
                  <th className="py-3 px-4 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      #{trip.id.slice(-6)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(trip.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {getLocalizedDriverName(trip.driverName) || '—'}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-300">
                      <div className="truncate font-semibold">{trip.pickupAddress}</div>
                      <div className="truncate text-[11px] text-slate-500">→ {trip.destinationAddress}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-200 font-mono">
                      {trip.finalFare || trip.estimatedFare} {currencyLabel}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          trip.status === 'DROPPED_OFF'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : trip.status === 'CANCELLED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {t(`status.${trip.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
