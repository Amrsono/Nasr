import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Trip, AdminMetrics, DriverWithStats, FixedRoutePrice } from '../../types';
import {
  Shield,
  DollarSign,
  TrendingUp,
  Car,
  Clock,
  Search,
  Settings as SettingsIcon,
  Star,
  Key,
  Save,
  Check,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  CheckCircle2,
  ArrowLeftRight,
  MapPin,
  Plus,
} from 'lucide-react';

const DRIVER_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

const PRESET_ZONE_LOCATIONS = [
  'Ashgar City',
  'Dar Masr',
  'Tahrir Square (Downtown)',
  'Cairo Airport Terminal 3',
  'Citystars Mall (Nasr City)',
  'Zamalek (Gezira Island)',
  'New Cairo (5th Settlement)',
  'Maadi Corniche',
  'Giza Pyramids',
  'Heliopolis (Korba)',
  'Sheikh Zayed (Arkan Plaza)',
  '6th of October City',
  'Mohandessin (Sphinx Square)',
  'Rehab City',
  'Madinaty',
  'Shorouk City',
  'New Administrative Capital',
];

export const AdminDashboard: React.FC = () => {
  const { settings, refreshSettings } = useAuth();
  const { t, i18n } = useTranslation();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<DriverWithStats[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'drivers' | 'pricing' | 'settings'>('overview');

  // Driver Fleet Management Modal States
  const [driverSearch, setDriverSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverWithStats | null>(null);
  const [isProcessingDriver, setIsProcessingDriver] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Add Driver
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addCarModel, setAddCarModel] = useState('');
  const [addCarPlate, setAddCarPlate] = useState('');
  const [addCarColor, setAddCarColor] = useState('White');
  const [addAvatar, setAddAvatar] = useState(DRIVER_AVATARS[0]);
  const [addIsOnline, setAddIsOnline] = useState(true);

  // Form states for Edit Driver
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCarModel, setEditCarModel] = useState('');
  const [editCarPlate, setEditCarPlate] = useState('');
  const [editCarColor, setEditCarColor] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editIsOnline, setEditIsOnline] = useState(true);

  // Route Pricing States
  const [routeSearch, setRouteSearch] = useState('');
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showEditRouteModal, setShowEditRouteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<FixedRoutePrice | null>(null);
  const [isProcessingRoute, setIsProcessingRoute] = useState(false);

  // Form states for Add Route
  const [addPickupName, setAddPickupName] = useState('');
  const [addDestName, setAddDestName] = useState('');
  const [addRoutePrice, setAddRoutePrice] = useState('');
  const [addIsBidirectional, setAddIsBidirectional] = useState(true);
  const [addRouteIsActive, setAddRouteIsActive] = useState(true);

  // Form states for Edit Route
  const [editPickupName, setEditPickupName] = useState('');
  const [editDestName, setEditDestName] = useState('');
  const [editRoutePrice, setEditRoutePrice] = useState('');
  const [editIsBidirectional, setEditIsBidirectional] = useState(true);
  const [editRouteIsActive, setEditRouteIsActive] = useState(true);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setAddName('');
    setAddEmail('');
    setAddPassword('');
    setAddPhone('');
    setAddCarModel('');
    setAddCarPlate('');
    setAddCarColor('White');
    setAddAvatar(DRIVER_AVATARS[0]);
    setAddIsOnline(true);
    setShowAddModal(true);
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) return;
    setIsProcessingDriver(true);
    try {
      await api.createDriver({
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword.trim() || 'driver123',
        phone: addPhone.trim() || '+20 100 000 0000',
        avatar: addAvatar,
        carDetails: {
          model: addCarModel.trim() || 'Toyota Corolla',
          plate: addCarPlate.trim() || '1234 ABC',
          color: addCarColor.trim() || 'White',
        },
        isOnline: addIsOnline,
      });
      setShowAddModal(false);
      await loadAdminData();
      showToast(t('admin.driverAdded'));
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'فشل إضافة السائق' : 'Failed to add driver'));
    } finally {
      setIsProcessingDriver(false);
    }
  };

  const handleOpenEdit = (driver: DriverWithStats) => {
    setSelectedDriver(driver);
    setEditName(driver.name);
    setEditEmail(driver.email);
    setEditPassword('');
    setEditPhone(driver.phone || '');
    setEditCarModel(driver.carDetails?.model || '');
    setEditCarPlate(driver.carDetails?.plate || '');
    setEditCarColor(driver.carDetails?.color || 'White');
    setEditAvatar(driver.avatar || DRIVER_AVATARS[0]);
    setEditIsOnline(driver.isOnline ?? true);
    setShowEditModal(true);
  };

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setIsProcessingDriver(true);
    try {
      await api.updateDriver(selectedDriver.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        password: editPassword.trim() || undefined,
        phone: editPhone.trim(),
        avatar: editAvatar,
        carDetails: {
          model: editCarModel.trim(),
          plate: editCarPlate.trim(),
          color: editCarColor.trim(),
        },
        isOnline: editIsOnline,
      });
      setShowEditModal(false);
      setSelectedDriver(null);
      await loadAdminData();
      showToast(t('admin.driverUpdated'));
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'فشل تحديث بيانات السائق' : 'Failed to update driver'));
    } finally {
      setIsProcessingDriver(false);
    }
  };

  const handleDeleteDriver = async (driver: DriverWithStats) => {
    const confirmText = `${t('admin.deleteDriverConfirm')} (${driver.name})`;
    if (!window.confirm(confirmText)) return;
    try {
      await api.deleteDriver(driver.id);
      await loadAdminData();
      showToast(t('admin.driverDeleted'));
    } catch (err: any) {
      alert(err.message || (i18n.language === 'ar' ? 'فشل حذف السائق' : 'Failed to delete driver'));
    }
  };

  const handleOpenAddRoute = () => {
    setAddPickupName('');
    setAddDestName('');
    setAddRoutePrice('');
    setAddIsBidirectional(true);
    setAddRouteIsActive(true);
    setShowAddRouteModal(true);
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPickupName.trim() || !addDestName.trim() || !addRoutePrice) return;
    setIsProcessingRoute(true);
    try {
      const currentRoutes = settings?.fixedRoutes || [];
      const newRoute: FixedRoutePrice = {
        id: `route_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        pickupName: addPickupName.trim(),
        destinationName: addDestName.trim(),
        price: parseFloat(addRoutePrice) || 0,
        isBidirectional: addIsBidirectional,
        isActive: addRouteIsActive,
        createdAt: new Date().toISOString(),
      };
      const updatedRoutes = [...currentRoutes, newRoute];
      await api.updateSettings({ fixedRoutes: updatedRoutes });
      await refreshSettings();
      setShowAddRouteModal(false);
      showToast(t('admin.routeAdded'));
    } catch (err: any) {
      alert(err.message || 'Failed to create route');
    } finally {
      setIsProcessingRoute(false);
    }
  };

  const handleOpenEditRoute = (route: FixedRoutePrice) => {
    setSelectedRoute(route);
    setEditPickupName(route.pickupName);
    setEditDestName(route.destinationName);
    setEditRoutePrice(String(route.price));
    setEditIsBidirectional(route.isBidirectional ?? true);
    setEditRouteIsActive(route.isActive);
    setShowEditRouteModal(true);
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;
    setIsProcessingRoute(true);
    try {
      const currentRoutes = settings?.fixedRoutes || [];
      const updatedRoutes = currentRoutes.map((r) => {
        if (r.id === selectedRoute.id) {
          return {
            ...r,
            pickupName: editPickupName.trim(),
            destinationName: editDestName.trim(),
            price: parseFloat(editRoutePrice) || 0,
            isBidirectional: editIsBidirectional,
            isActive: editRouteIsActive,
          };
        }
        return r;
      });
      await api.updateSettings({ fixedRoutes: updatedRoutes });
      await refreshSettings();
      setShowEditRouteModal(false);
      setSelectedRoute(null);
      showToast(t('admin.routeUpdated'));
    } catch (err: any) {
      alert(err.message || 'Failed to update route');
    } finally {
      setIsProcessingRoute(false);
    }
  };

  const handleToggleRouteActive = async (route: FixedRoutePrice) => {
    try {
      const currentRoutes = settings?.fixedRoutes || [];
      const updatedRoutes = currentRoutes.map((r) => (r.id === route.id ? { ...r, isActive: !r.isActive } : r));
      await api.updateSettings({ fixedRoutes: updatedRoutes });
      await refreshSettings();
      showToast(t('admin.routeUpdated'));
    } catch (err: any) {
      alert(err.message || 'Failed to update route status');
    }
  };

  const handleDeleteRoute = async (route: FixedRoutePrice) => {
    if (!window.confirm(`${t('admin.deleteRoutePriceConfirm')} (${route.pickupName} ➔ ${route.destinationName})`)) return;
    try {
      const currentRoutes = settings?.fixedRoutes || [];
      const updatedRoutes = currentRoutes.filter((r) => r.id !== route.id);
      await api.updateSettings({ fixedRoutes: updatedRoutes });
      await refreshSettings();
      showToast(t('admin.routeDeleted'));
    } catch (err: any) {
      alert(err.message || 'Failed to delete route');
    }
  };

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

  const filteredDrivers = drivers.filter((d) => {
    const q = driverSearch.toLowerCase();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      (d.phone && d.phone.toLowerCase().includes(q)) ||
      (d.carDetails?.model && d.carDetails.model.toLowerCase().includes(q)) ||
      (d.carDetails?.plate && d.carDetails.plate.toLowerCase().includes(q))
    );
  });

  const filteredRoutes = (settings?.fixedRoutes || []).filter((r) => {
    const q = routeSearch.toLowerCase();
    if (!q) return true;
    return (
      r.pickupName.toLowerCase().includes(q) ||
      r.destinationName.toLowerCase().includes(q) ||
      String(r.price).includes(q)
    );
  });

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
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80">
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
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pricing'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{t('admin.routePricing')}</span>
            <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.2 rounded-full font-mono">
              {(settings?.fixedRoutes || []).length}
            </span>
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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
                <option value="ARRIVED">{t('status.ARRIVED')}</option>
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
                            : trip.status === 'ARRIVED'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse'
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
          {/* Toast Message */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          )}

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6 text-left rtl:text-right">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-emerald-400" />
                  <span>{t('admin.driverManagement')}</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-mono">
                    {filteredDrivers.length} / {drivers.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {i18n.language === 'ar' ? 'إدارة أسطول السائقين، إضافة كباتن جدد، وتعديل بيانات وحالة المركبات' : 'Manage driver fleet, register new drivers, update vehicle details, and track performance.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3 rtl:right-3 top-3" />
                  <input
                    type="text"
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    placeholder={t('admin.searchDrivers')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-left rtl:text-right"
                  />
                </div>

                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('admin.addDriver')}</span>
                </button>
              </div>
            </div>

            {/* Drivers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 shadow-lg space-y-4 flex flex-col justify-between text-left rtl:text-right hover:border-slate-600 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <img
                        src={driver.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${driver.name}`}
                        alt={driver.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-900"
                      />
                      <div className="flex items-center gap-2">
                        {driver.activeTrip && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                            {t(`status.${driver.activeTrip.status}`)}
                          </span>
                        )}
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
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center justify-between">
                        <span>{getLocalizedDriverName(driver.name)}</span>
                      </h3>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{driver.email}</span>
                      </div>
                      {driver.phone && (
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{driver.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 text-xs space-y-1">
                      <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-amber-400" />
                        <span>{driver.carDetails?.model || 'Standard Sedan'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                        <span>{t('customer.plate')}: <b className="text-slate-200 font-mono">{driver.carDetails?.plate || '1234 ABC'}</b></span>
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700">
                          {getLocalizedColor(driver.carDetails?.color)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700 space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-1 text-center bg-slate-900/40 p-2 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">{t('driver.totalTrips')}</div>
                        <div className="text-xs font-bold text-white font-mono mt-0.5">
                          {driver.totalTrips || driver.completedTripsCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">{t('driver.todayEarnings')}</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                          {driver.totalEarnings || driver.totalEarned} {currencyLabel}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">{t('driver.driverRating')}</div>
                        <div className="text-xs font-bold text-amber-400 font-mono flex items-center justify-center gap-0.5 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400" /> {driver.rating || 4.9}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleOpenEdit(driver)}
                        className="py-1.5 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{t('admin.editDriver')}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver)}
                        className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('admin.deleteDriver')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredDrivers.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                {i18n.language === 'ar' ? 'لا يوجد سائقين مطابقين لنتائج البحث' : 'No drivers matching your search.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FIXED ROUTE PRICING */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Toast Message */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          )}

          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6 text-left rtl:text-right">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span>{t('admin.routePricing')}</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-mono">
                    {filteredRoutes.length} / {(settings?.fixedRoutes || []).length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {t('admin.routePricingDesc')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3 rtl:right-3 top-3" />
                  <input
                    type="text"
                    value={routeSearch}
                    onChange={(e) => setRouteSearch(e.target.value)}
                    placeholder={t('admin.searchRoutes')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-left rtl:text-right"
                  />
                </div>

                <button
                  onClick={handleOpenAddRoute}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('admin.addRoutePrice')}</span>
                </button>
              </div>
            </div>

            {/* Routes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoutes.map((route) => (
                <div
                  key={route.id}
                  className={`bg-slate-800/80 rounded-2xl p-5 border shadow-lg space-y-4 flex flex-col justify-between text-left rtl:text-right transition-colors ${
                    route.isActive ? 'border-slate-700/80 hover:border-slate-600' : 'border-slate-800 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <DollarSign className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-white font-mono">
                          #{route.id.slice(-6)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleRouteActive(route)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                          route.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
                        }`}
                      >
                        {route.isActive ? t('admin.activeRoute') : t('admin.inactiveRoute')}
                      </button>
                    </div>

                    {/* Route Locations */}
                    <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700/60 space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">{t('admin.pickupPoint')}</div>
                          <div className="text-slate-200 font-semibold">{route.pickupName}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center my-1">
                        <div className="flex items-center gap-1 text-[10px] text-amber-400/80 font-bold bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
                          <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                          <span>{route.isBidirectional ? t('admin.bidirectional') : '→'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">{t('admin.destinationPoint')}</div>
                          <div className="text-slate-200 font-semibold">{route.destinationName}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">{t('admin.fixedPrice')}:</span>
                      <div className="text-lg font-black text-amber-400 font-mono">
                        {route.price} <span className="text-xs font-bold text-slate-400">{currencyLabel}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleOpenEditRoute(route)}
                        className="py-1.5 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{t('admin.editRoutePrice')}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route)}
                        className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('admin.deleteRoutePrice')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRoutes.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                {i18n.language === 'ar' ? 'لا توجد مسارات مطابقة لبحثك' : 'No routes matching your search.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM & GOOGLE MAPS CONFIGURATION */}
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
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? t('common.loading') : t('admin.saveSettings')}</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL: ADD NEW DRIVER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 text-left rtl:text-right my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  <span>{t('admin.addDriver')}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">{t('admin.addDriverDesc')}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4">
              {/* Avatar Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">{t('admin.driverAvatar')}</label>
                <div className="flex flex-wrap items-center gap-2">
                  {DRIVER_AVATARS.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt={`Avatar ${idx + 1}`}
                      onClick={() => setAddAvatar(av)}
                      className={`w-10 h-10 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                        addAvatar === av ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/30' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t('admin.driverName')}</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Captain Karim Taha"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 text-left rtl:text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t('admin.driverEmail')}</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="driver@nasr.com"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 text-left"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t('admin.driverPassword')}</label>
                  <input
                    type="text"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="driver123"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 text-left"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t('admin.driverPhone')}</label>
                  <input
                    type="text"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 text-left rtl:text-right"
                  />
                </div>
              </div>

              {/* Vehicle Information Section */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>{t('driver.vehicleInfo')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">{t('admin.driverCarModel')}</label>
                    <input
                      type="text"
                      value={addCarModel}
                      onChange={(e) => setAddCarModel(e.target.value)}
                      placeholder="e.g. Toyota Corolla (2023)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 text-left rtl:text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">{t('admin.driverCarPlate')}</label>
                    <input
                      type="text"
                      value={addCarPlate}
                      onChange={(e) => setAddCarPlate(e.target.value)}
                      placeholder="1234 ABC"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 text-left rtl:text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">{t('admin.driverCarColor')}</label>
                    <select
                      value={addCarColor}
                      onChange={(e) => setAddCarColor(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="White">{i18n.language === 'ar' ? 'أبيض (White)' : 'White'}</option>
                      <option value="Black">{i18n.language === 'ar' ? 'أسود (Black)' : 'Black'}</option>
                      <option value="Silver">{i18n.language === 'ar' ? 'فضي (Silver)' : 'Silver'}</option>
                      <option value="Blue">{i18n.language === 'ar' ? 'أزرق (Blue)' : 'Blue'}</option>
                      <option value="Red">{i18n.language === 'ar' ? 'أحمر (Red)' : 'Red'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Online / Offline duty status checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="addDriverOnline"
                  checked={addIsOnline}
                  onChange={(e) => setAddIsOnline(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
                <label htmlFor="addDriverOnline" className="text-xs text-slate-300 cursor-pointer">
                  {t('driver.goOnline')} ({t('admin.driverDutyStatus')})
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isProcessingDriver}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isProcessingDriver ? t('common.loading') : t('admin.createDriver')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DRIVER DETAILS */}
      {showEditModal && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 text-left rtl:text-right my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-400" />
                  <span>{t('admin.editDriver')}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">{t('admin.editDriverDesc')}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDriver} className="space-y-4">
              {/* Avatar Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">{t('admin.driverAvatar')}</label>
                <div className="flex flex-wrap items-center gap-2">
                  {DRIVER_AVATARS.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt={`Avatar ${idx + 1}`}
                      onClick={() => setEditAvatar(av)}
                      className={`w-10 h-10 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                        editAvatar === av ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/30' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t('admin.driverName')}</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left rtl:text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t('admin.driverEmail')}</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 text-left"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t('admin.driverPassword')}</label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder={t('admin.driverPasswordHint')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 text-left"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">{t('admin.driverPhone')}</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 text-left rtl:text-right"
                  />
                </div>
              </div>

              {/* Vehicle Information Section */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>{t('driver.vehicleInfo')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">{t('admin.driverCarModel')}</label>
                    <input
                      type="text"
                      value={editCarModel}
                      onChange={(e) => setEditCarModel(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 text-left rtl:text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">{t('admin.driverCarPlate')}</label>
                    <input
                      type="text"
                      value={editCarPlate}
                      onChange={(e) => setEditCarPlate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 text-left rtl:text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">{t('admin.driverCarColor')}</label>
                    <select
                      value={editCarColor}
                      onChange={(e) => setEditCarColor(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="White">{i18n.language === 'ar' ? 'أبيض (White)' : 'White'}</option>
                      <option value="Black">{i18n.language === 'ar' ? 'أسود (Black)' : 'Black'}</option>
                      <option value="Silver">{i18n.language === 'ar' ? 'فضي (Silver)' : 'Silver'}</option>
                      <option value="Blue">{i18n.language === 'ar' ? 'أزرق (Blue)' : 'Blue'}</option>
                      <option value="Red">{i18n.language === 'ar' ? 'أحمر (Red)' : 'Red'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Online / Offline duty status checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="editDriverOnline"
                  checked={editIsOnline}
                  onChange={(e) => setEditIsOnline(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 bg-slate-800 border-slate-700 focus:ring-blue-500"
                />
                <label htmlFor="editDriverOnline" className="text-xs text-slate-300 cursor-pointer">
                  {t('driver.goOnline')} ({t('admin.driverDutyStatus')})
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isProcessingDriver}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isProcessingDriver ? t('common.loading') : t('admin.saveDriver')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FIXED ROUTE PRICE */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left rtl:text-right my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span>{t('admin.addRoutePrice')}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">{t('admin.addRoutePriceDesc')}</p>
              </div>
              <button
                onClick={() => setShowAddRouteModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('admin.pickupPoint')}</span>
                </label>
                <input
                  type="text"
                  list="pickup-zones-list"
                  value={addPickupName}
                  onChange={(e) => setAddPickupName(e.target.value)}
                  placeholder="e.g. Cairo Airport Terminal 3"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 text-left rtl:text-right"
                />
                <datalist id="pickup-zones-list">
                  {PRESET_ZONE_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={loc} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t('admin.destinationPoint')}</span>
                </label>
                <input
                  type="text"
                  list="dest-zones-list"
                  value={addDestName}
                  onChange={(e) => setAddDestName(e.target.value)}
                  placeholder="e.g. Tahrir Square (Downtown)"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 text-left rtl:text-right"
                />
                <datalist id="dest-zones-list">
                  {PRESET_ZONE_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={loc} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('admin.fixedPrice')} ({currencyLabel})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={addRoutePrice}
                  onChange={(e) => setAddRoutePrice(e.target.value)}
                  placeholder="180"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 text-left rtl:text-right"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="addRouteBidirectional"
                    checked={addIsBidirectional}
                    onChange={(e) => setAddIsBidirectional(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500"
                  />
                  <label htmlFor="addRouteBidirectional" className="text-xs text-slate-300 cursor-pointer">
                    {t('admin.bidirectional')}
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('admin.bidirectionalDesc')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="addRouteActive"
                  checked={addRouteIsActive}
                  onChange={(e) => setAddRouteIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
                <label htmlFor="addRouteActive" className="text-xs text-slate-300 cursor-pointer">
                  {t('admin.activeRoute')}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isProcessingRoute}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isProcessingRoute ? t('common.loading') : t('admin.createRoutePrice')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT FIXED ROUTE PRICE */}
      {showEditRouteModal && selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left rtl:text-right my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-400" />
                  <span>{t('admin.editRoutePrice')}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">{t('admin.editRoutePriceDesc')}</p>
              </div>
              <button
                onClick={() => setShowEditRouteModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRoute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('admin.pickupPoint')}</span>
                </label>
                <input
                  type="text"
                  list="edit-pickup-zones-list"
                  value={editPickupName}
                  onChange={(e) => setEditPickupName(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left rtl:text-right"
                />
                <datalist id="edit-pickup-zones-list">
                  {PRESET_ZONE_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={loc} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t('admin.destinationPoint')}</span>
                </label>
                <input
                  type="text"
                  list="edit-dest-zones-list"
                  value={editDestName}
                  onChange={(e) => setEditDestName(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 text-left rtl:text-right"
                />
                <datalist id="edit-dest-zones-list">
                  {PRESET_ZONE_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={loc} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('admin.fixedPrice')} ({currencyLabel})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={editRoutePrice}
                  onChange={(e) => setEditRoutePrice(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 text-left rtl:text-right"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="editRouteBidirectional"
                    checked={editIsBidirectional}
                    onChange={(e) => setEditIsBidirectional(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-500 bg-slate-800 border-slate-700 focus:ring-blue-500"
                  />
                  <label htmlFor="editRouteBidirectional" className="text-xs text-slate-300 cursor-pointer">
                    {t('admin.bidirectional')}
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('admin.bidirectionalDesc')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editRouteActive"
                  checked={editRouteIsActive}
                  onChange={(e) => setEditRouteIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
                <label htmlFor="editRouteActive" className="text-xs text-slate-300 cursor-pointer">
                  {t('admin.activeRoute')}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditRouteModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isProcessingRoute}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isProcessingRoute ? t('common.loading') : t('admin.saveRoutePrice')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
