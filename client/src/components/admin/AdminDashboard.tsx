import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { UnifiedMap } from '../map/UnifiedMap';
import { Trip, AdminMetrics, DriverWithStats } from '../../types';
import {
  Shield,
  DollarSign,
  TrendingUp,
  Car,
  Clock,
  Search,
  Settings as SettingsIcon,
  MapPin,
  Star,
  Key,
  Save,
  Check,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { settings, refreshSettings } = useAuth();
  const { t, i18n } = useTranslation();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<DriverWithStats[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'drivers' | 'settings'>('overview');

  // Settings State
  const [apiKeyInput, setApiKeyInput] = useState(settings?.googleMapsApiKey || '');
  const [baseFareInput, setBaseFareInput] = useState(String(settings?.baseFare || 20));
  const [perKmInput, setPerKmInput] = useState(String(settings?.perKmRate || 6.5));
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currencyLabel = t('app.egp');
  const distanceUnit = t('app.km');

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

  const loadAdminData = async () => {
    try {
      const [m, tList, dList] = await Promise.all([
        api.getAdminMetrics().catch(() => null),
        api.getTrips().catch(() => []),
        api.getAdminDrivers().catch(() => []),
      ]);
      if (m) setMetrics(m);
      setTrips(tList);
      setDrivers(dList);
    } catch (err) {
      console.error('Error fetching admin data', err);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (settings) {
      setApiKeyInput(settings.googleMapsApiKey || '');
      setBaseFareInput(String(settings.baseFare));
      setPerKmInput(String(settings.perKmRate));
    }
  }, [settings]);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => loadAdminData();

    socket.on('trip:created', handleUpdate);
    socket.on('trip:updated', handleUpdate);
    socket.on('admin:driver_status_changed', handleUpdate);

    return () => {
      socket.off('trip:created', handleUpdate);
      socket.off('trip:updated', handleUpdate);
      socket.off('admin:driver_status_changed', handleUpdate);
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.updateSettings({
        googleMapsApiKey: apiKeyInput,
        baseFare: parseFloat(baseFareInput),
        perKmRate: parseFloat(perKmInput),
      });
      await refreshSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesStatus = statusFilter === 'ALL' || trip.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      trip.customerName.toLowerCase().includes(q) ||
      (trip.driverName && trip.driverName.toLowerCase().includes(q)) ||
      trip.pickupAddress.toLowerCase().includes(q) ||
      trip.destinationAddress.toLowerCase().includes(q) ||
      trip.id.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const driverMapList = drivers.map((d) => ({
    id: d.id,
    name: getLocalizedDriverName(d.name),
    coords: d.currentLocation || { lat: 30.0444, lng: 31.2357 },
    isOnline: d.isOnline,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header & Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>{t('admin.dashboard')}</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            {i18n.language === 'ar' ? 'مركز عمليات وتحكم أسطول نصر' : 'Nasr Fleet Command Center'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {i18n.language === 'ar'
              ? 'متابعة قائمة الانتظار الحية، تتبع حركة السائقين على الخريطة، وسجل الإيرادات'
              : 'Monitor real-time dispatch queue, live fleet positions, trip history, and business earnings.'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('admin.overview')}
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'trips'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('admin.allTrips')} ({trips.length})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'drivers'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('admin.driverManagement')} ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 inline mr-1 rtl:ml-1 rtl:mr-0" />
            {t('admin.settings')}
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">{t('admin.totalRevenue')}</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 font-mono">
              {metrics?.totalRevenue || 0} <span className="text-xs text-slate-400 font-sans">{currencyLabel}</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">{t('admin.totalTrips')}</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
              {metrics?.totalTrips || trips.length}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">{t('admin.activeTrips')}</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1 font-mono">
              {metrics?.activeTrips || 0}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">{t('admin.activeDrivers')}</div>
            <div className="text-xl sm:text-2xl font-black text-teal-400 mt-1 font-mono">
              {metrics?.onlineDrivers || 4} / {metrics?.totalDrivers || 4}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400">
            <Car className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & LIVE DISPATCH MAP */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 text-left rtl:text-right">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>{t('admin.liveMap')}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{t('admin.liveMapDesc')}</p>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('admin.liveGps')}
              </span>
            </div>

            <UnifiedMap
              otherDrivers={driverMapList}
              height="440px"
              zoom={12}
            />
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 text-left rtl:text-right">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {t('admin.recentActivity')}
              </h3>
              <button
                onClick={() => setActiveTab('trips')}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                {t('admin.viewFullLog')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/60 space-y-2 text-left rtl:text-right">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 font-mono">#{trip.id.slice(-6)}</span>
                    <span className="text-[10px] font-bold text-slate-400">{t(`status.${trip.status}`)}</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">
                    {trip.customerName} → {getLocalizedDriverName(trip.driverName) || (i18n.language === 'ar' ? 'في قائمة الانتظار' : 'In Queue')}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {trip.pickupAddress}
                  </div>
                  <div className="text-xs font-bold text-emerald-400 pt-1 border-t border-slate-700 flex items-center justify-between">
                    <span>{t('common.fare')}:</span>
                    <span className="font-mono">{trip.finalFare || trip.estimatedFare} {currencyLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL TRIPS LOG */}
      {activeTab === 'trips' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5 text-left rtl:text-right">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{t('admin.allTrips')}</span>
            </h2>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3 rtl:right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('admin.search')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-left rtl:text-right"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">{t('admin.all')}</option>
                <option value="REQUESTED">{t('status.REQUESTED')}</option>
                <option value="ACCEPTED">{t('status.ACCEPTED')}</option>
                <option value="PICKED_UP">{t('status.PICKED_UP')}</option>
                <option value="DROPPED_OFF">{t('status.DROPPED_OFF')}</option>
                <option value="CANCELLED">{t('status.CANCELLED')}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-800/80 rounded-xl">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl rtl:rounded-l-none rtl:rounded-r-xl">ID</th>
                  <th className="py-3 px-4">{t('common.date')}</th>
                  <th className="py-3 px-4">{t('common.customer')}</th>
                  <th className="py-3 px-4">{t('common.driver')}</th>
                  <th className="py-3 px-4">{t('common.route')}</th>
                  <th className="py-3 px-4">{t('common.distance')}</th>
                  <th className="py-3 px-4">{t('common.fare')}</th>
                  <th className="py-3 px-4 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      #{trip.id.slice(-6)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(trip.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {trip.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {trip.driverName ? (
                        <span className="font-semibold text-blue-400">{getLocalizedDriverName(trip.driverName)}</span>
                      ) : (
                        <span className="text-amber-400 italic">{i18n.language === 'ar' ? 'في الانتظار' : 'In Queue'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-300">
                      <div className="truncate font-semibold">{trip.pickupAddress}</div>
                      <div className="truncate text-[11px] text-slate-500">→ {trip.destinationAddress}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap font-mono">
                      {trip.distanceKm} {distanceUnit}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 whitespace-nowrap font-mono">
                      {trip.finalFare || trip.estimatedFare} {currencyLabel}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          trip.status === 'DROPPED_OFF'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : trip.status === 'CANCELLED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : trip.status === 'REQUESTED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
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
        </div>
      )}

      {/* TAB 3: DRIVER MANAGEMENT */}
      {activeTab === 'drivers' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 text-left rtl:text-right">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>{t('admin.driverManagement')}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 shadow-lg space-y-4 flex flex-col justify-between text-left rtl:text-right"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <img
                        src={driver.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${driver.name}`}
                        alt={driver.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-900"
                      />
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          driver.isOnline
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-700 text-slate-400 border-slate-600'
                        }`}
                      >
                        {driver.isOnline ? t('app.online') : t('app.offline')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white">{getLocalizedDriverName(driver.name)}</h3>
                      <p className="text-xs text-slate-400 font-mono">{driver.email}</p>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 text-xs space-y-1">
                      <div className="text-slate-300 font-semibold">{driver.carDetails?.model || 'Sedan'}</div>
                      <div className="text-[11px] text-slate-400">
                        {t('customer.plate')}: <b className="text-slate-200 font-mono">{driver.carDetails?.plate}</b> • {getLocalizedColor(driver.carDetails?.color)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t('driver.totalTrips')}:</span>
                      <b className="text-white font-mono">{driver.totalTrips || driver.completedTripsCount}</b>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t('driver.todayEarnings')}:</span>
                      <b className="text-emerald-400 font-mono">{driver.totalEarnings || driver.totalEarned} {currencyLabel}</b>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t('driver.driverRating')}:</span>
                      <span className="flex items-center gap-1 text-amber-400 font-bold font-mono">
                        <Star className="w-3 h-3 fill-amber-400" /> {driver.rating || 4.9}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM & GOOGLE MAPS CONFIGURATION */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl max-w-2xl mx-auto space-y-6 text-left rtl:text-right">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <span>{t('admin.settings')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {i18n.language === 'ar'
                ? 'إعداد مفتاح Google Maps API، أسعار فتح العداد وسعر الكيلومتر والعملة'
                : 'Configure Google Maps API key, base pricing, rates per kilometer, and company details.'}
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>{t('admin.googleMapsKey')}</span>
              </label>
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none text-left"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('admin.googleMapsKeyDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">{t('admin.baseFare')} ({currencyLabel})</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={baseFareInput}
                  onChange={(e) => setBaseFareInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono text-left rtl:text-right"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">{t('admin.ratePerKm')} ({currencyLabel})</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={perKmInput}
                  onChange={(e) => setPerKmInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono text-left rtl:text-right"
                  required
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{i18n.language === 'ar' ? 'تم حفظ التعديلات بنجاح!' : 'Settings saved successfully!'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingSettings}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? t('common.loading') : t('admin.saveSettings')}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
