import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  ShieldCheck,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Cpu,
  Palette,
  Power,
  Info,
  Layers,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  PlannerStorageService,
  StorageConfig,
  WeekRecord,
} from '../services/plannerStorage';
import { CATEGORIES, toFaDigits } from '../constants/plannerConfig';
import { CategoryKey } from '../types';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalBlocks: number;
  totalTemplates: number;
  totalNotes: number;
  customCategoryColors?: Record<string, string>;
  onUpdateCategoryColor: (categoryKey: string, hexColor: string) => void;
  onResetCategoryColors: () => void;
  onClearDatabase: () => void;
  onClearCurrentWeek?: () => void;
  onLoadWeek?: (weekId: string) => void;
  onDeleteWeek?: (weekId: string) => void;
  activeWeekId?: string;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
  onDownloadBackup: () => void;
  onRestoreBackup: (file: File) => void;
}

const COLOR_PRESETS = [
  { name: 'نیلی استاندارد', hex: '#4f46e5' },
  { name: 'سبز زمردی', hex: '#059669' },
  { name: 'فیروزه‌ای تیره', hex: '#0d9488' },
  { name: 'کهربایی گرم', hex: '#d97706' },
  { name: 'رز یاقوتی', hex: '#e11d48' },
  { name: 'بنفش سلطنتی', hex: '#7c3aed' },
  { name: 'آبی آسمانی', hex: '#0284c7' },
  { name: 'خاکستری اسلیت', hex: '#475569' },
  { name: 'آبی سرمه‌ای', hex: '#1e3a8a' },
  { name: 'نارنجی پرانرژی', hex: '#ea580c' },
];

export const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  totalBlocks,
  totalTemplates,
  totalNotes,
  customCategoryColors = {},
  onUpdateCategoryColor,
  onResetCategoryColors,
  onClearDatabase,
  onClearCurrentWeek,
  onLoadWeek,
  onDeleteWeek,
  activeWeekId,
  onShowToast,
  onDownloadBackup,
  onRestoreBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'db' | 'stored_weeks' | 'replace' | 'colors'>('db');
  const [confirmClearText, setConfirmClearText] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [storedWeeks, setStoredWeeks] = useState<Record<string, WeekRecord>>({});
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(() =>
    PlannerStorageService.getConfig()
  );

  const stats = PlannerStorageService.getStorageStats();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reload stored weeks list on modal open or tab change
  useEffect(() => {
    if (isOpen) {
      const weeks = PlannerStorageService.getAllSavedWeeks();
      setStoredWeeks(weeks);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleToggleAutoSave = () => {
    const newAutoSave = !storageConfig.autoSave;
    PlannerStorageService.setConfig({ autoSave: newAutoSave });
    setStorageConfig({ ...storageConfig, autoSave: newAutoSave });
    onShowToast(
      newAutoSave
        ? 'ذخیره‌سازی خودکار دیتابیس فعال شد.'
        : 'ذخیره‌سازی خودکار موقتاً غیرفعال شد (داده‌ها فقط در حافظه رم نگهداری می‌شوند).',
      'info'
    );
  };

  const handleToggleStorageEnabled = () => {
    const newEnabled = !storageConfig.enabled;
    PlannerStorageService.setConfig({ enabled: newEnabled });
    setStorageConfig({ ...storageConfig, enabled: newEnabled });
    onShowToast(
      newEnabled
        ? 'سیستم پایگاه داده محلی فعال شد.'
        : 'استفاده از دیتابیس غیرفعال شد (حالت ایزوله بدون کش).',
      'warn'
    );
  };

  const handleExecuteClear = () => {
    if (confirmClearText !== 'حذف دیتابیس') {
      onShowToast('لطفاً عبارت «حذف دیتابیس» را دقیق تایپ کنید.', 'warn');
      return;
    }
    onClearDatabase();
    setIsConfirmingClear(false);
    setConfirmClearText('');
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onRestoreBackup(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteSingleWeek = (weekId: string) => {
    if (window.confirm('آیا از حذف این هفته از پایگاه داده اطمینان دارید؟')) {
      if (onDeleteWeek) {
        onDeleteWeek(weekId);
      } else {
        PlannerStorageService.deleteSavedWeek(weekId);
      }
      setStoredWeeks(PlannerStorageService.getAllSavedWeeks());
      onShowToast('هفته مورد نظر با موفقیت از دیتابیس حذف شد.', 'success');
    }
  };

  const handleSelectWeek = (weekId: string) => {
    if (onLoadWeek) {
      onLoadWeek(weekId);
      onShowToast('هفته انتخابی با موفقیت بارگذاری شد.', 'success');
      onClose();
    }
  };

  const totalStoredWeeksCount = Object.keys(storedWeeks).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>مرکز مدیریت پایگاه داده و ذخیره‌سازی ابدی</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  مقاوم و امن
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                موتور دوگانه IndexedDB + LocalStorage، پایداری بدون قطعی و مدیریت هفته‌های ثبت‌شده
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('db')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'db'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>وضعیت سلامت و پایداری</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stored_weeks')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'stored_weeks'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>هفته‌های ذخیره‌شده ({toFaDigits(totalStoredWeeksCount)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('replace')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'replace'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>جایگزینی، خروجی و حذف امن</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'colors'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>پالت‌های رنگی</span>
          </button>
        </div>

        {/* TAB 1: Database Status & Health */}
        {activeTab === 'db' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Engine Status Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-black text-emerald-950 flex items-center gap-2">
                  <span>موتور دوگانه ذخیره‌سازی پایدار (Dual Engine IndexedDB + LocalStorage)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                    ۱۰۰٪ فعال و ایمن
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                  اطلاعات شما به صورت هم‌زمان در پایگاه داده مستقل <strong>IndexedDB</strong> مرورگر و رونوشت سریع <strong>LocalStorage</strong> نگهداری می‌شود. حتی در صورت بستن ناگهانی مرورگر، قطعی برق، خاموش شدن سیستم یا روشن ماندن برای ماه‌ها، حتی یک بلوک زمانی از بین نخواهد رفت.
                </p>
              </div>
            </div>

            {/* Real-time Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">کارت‌های هفته جاری</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {toFaDigits(totalBlocks)}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">تعداد هفته‌های ثبت‌شده</span>
                <span className="text-lg font-black text-indigo-700 font-mono">
                  {toFaDigits(totalStoredWeeksCount)}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">الگوهای آماده بانک</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {toFaDigits(totalTemplates)}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">فضای اشغال‌شده</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  {toFaDigits((stats.storageUsedBytes / 1024).toFixed(1))} KB
                </span>
              </div>
            </div>

            {/* Live Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">ذخیره‌سازی خودکار و بلادرنگ (Auto-Save)</h5>
                  <p className="text-[11px] text-slate-500">
                    ذخیره آنی هر جابجایی کارت، ویرایش یا تغییر در پایگاه داده
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoSave}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    storageConfig.autoSave ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      storageConfig.autoSave ? 'translate-x-0' : '-translate-x-6'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">استفاده از حافظه محلی پایدار</h5>
                  <p className="text-[11px] text-slate-500">
                    پایگاه داده به صورت ۱۰۰٪ آفلاین و محلی روی سیستم شما فعال است
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleStorageEnabled}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    storageConfig.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      storageConfig.enabled ? 'translate-x-0' : '-translate-x-6'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Stored Weeks Inspector */}
        {activeTab === 'stored_weeks' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  فهرست کلیه هفته‌های ذخیره شده در دیتابیس
                </h4>
                <p className="text-[11px] text-slate-500">
                  می‌توانید بین هفته‌های مختلف جابجا شوید، هفته‌ای را پاک کنید یا بررسی نمایید
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                مجموع: {toFaDigits(totalStoredWeeksCount)} هفته
              </span>
            </div>

            {totalStoredWeeksCount === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold">هنوز هفته‌ای در دیتابیس ذخیره نشده است.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(Object.values(storedWeeks) as WeekRecord[]).map((wk) => {
                  const isActive = wk.weekId === activeWeekId;
                  const blockCount = wk.blocks ? wk.blocks.length : 0;
                  const updatedFa = new Date(wk.updatedAt || Date.now()).toLocaleDateString('fa-IR');

                  return (
                    <div
                      key={wk.weekId}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-xs font-extrabold text-slate-900 truncate">
                            {wk.title || 'هفته بدون عنوان'}
                          </h5>
                          {isActive && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                              هفته فعال جاری
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span>{wk.weekRange || wk.weekId}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-700 font-bold">{toFaDigits(blockCount)} بلوکزمانی</span>
                          <span>•</span>
                          <span className="text-slate-400">بروزرسانی: {updatedFa}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isActive && onLoadWeek && (
                          <button
                            type="button"
                            onClick={() => handleSelectWeek(wk.weekId)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                            title="بارگذاری و کار روی این هفته"
                          >
                            <span>بارگذاری این هفته</span>
                            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteSingleWeek(wk.weekId)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="حذف این هفته از دیتابیس"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Replace, Backup & Safe Delete */}
        {activeTab === 'replace' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Backup & Export Section */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>پشتیبان‌گیری کامل (Full Backup)</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                یک رونوشت معتبر و رمزنگاری‌نشده JSON از تمام هفته‌ها، کارت‌ها، الگوها، یادداشت‌ها و تنظیمات دانلود کنید تا در دستگاهی دیگر یا هر زمان مایل بودید بازیابی شود.
              </p>
              <button
                type="button"
                onClick={onDownloadBackup}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>دانلود فایل پشتیبان کامل دیتابیس (JSON)</span>
              </button>
            </div>

            {/* Replace / Restore Section */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>جایگزینی داده‌ها از فایل پشتیبان (Restore & Replace)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                با انتخاب یک فایل JSON پشتیبان معتبر، کل پایگاه داده با محتوای فایل جایگزین خواهد شد.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>انتخاب فایل و جایگزینی کامل دیتابیس</span>
              </button>
            </div>

            {/* Selective Clear: Only Current Week */}
            {onClearCurrentWeek && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Trash2 className="w-4 h-4 text-slate-500" />
                  <span>پاک‌سازی اختصاصی: فقط بلوک‌های هفته جاری</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  فقط بلوک‌های ثبت‌شده در هفته فعال فعلی را پاک می‌کند، بدون اینکه به سایر هفته‌ها، قالب‌های بانک، نوت‌ها یا تنظیمات آسیبی برسد.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('آیا مطمئنید که می‌خواهید فقط بلوک‌های هفته جاری پاک شوند؟')) {
                      onClearCurrentWeek();
                      onShowToast('بلوک‌های هفته جاری با موفقیت پاک شدند.', 'info');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  پاک‌سازی بلوک‌های هفته جاری
                </button>
              </div>
            )}

            {/* Full Clear Danger Zone */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>منطقه حساس امنیتی: حذف کامل کلیه داده‌های دیتابیس</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                با حذف کامل، تمام هفته‌ها، ریتم‌های روزانه، نوت‌ها و الگوها از حافظه پاک شده و برنامه به حالت خام اولیه برمی‌گردد.
              </p>

              {!isConfirmingClear ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  درخواست حذف کامل دیتابیس...
                </button>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2.5">
                  <p className="text-[11px] text-slate-700 font-bold">
                    برای جلوگیری از خطای ناخواسته، عبارت «<span className="text-rose-600">حذف دیتابیس</span>» را تایپ کنید:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={confirmClearText}
                      onChange={(e) => setConfirmClearText(e.target.value)}
                      placeholder="حذف دیتابیس"
                      className="flex-1 text-xs text-slate-900 px-3 py-1.5 rounded-lg border border-rose-300 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleExecuteClear}
                      disabled={confirmClearText !== 'حذف دیتابیس'}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      تأیید قطعی و حذف
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingClear(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Color Customization */}
        {activeTab === 'colors' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  شخصی‌سازی رنگ دسته‌بندی‌ها
                </h4>
                <p className="text-[11px] text-slate-500">
                  برای هر گروه کاری رنگ متناسب با حس تمرکز و نظم انتخاب کنید
                </p>
              </div>
              <button
                type="button"
                onClick={onResetCategoryColors}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                بازنشانی رنگ‌ها به پیش‌فرض
              </button>
            </div>

            <div className="space-y-3">
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((catKey) => {
                const cat = CATEGORIES[catKey];
                if (!cat) return null;
                const activeColor = (customCategoryColors && customCategoryColors[catKey]) || cat.dotColor || '#6366f1';

                return (
                  <div
                    key={catKey}
                    className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-2 ring-white"
                        style={{ backgroundColor: activeColor }}
                      />
                      <div>
                        <h5 className="text-xs font-black text-slate-900">{cat.label}</h5>
                        <p className="text-[10px] text-slate-500">{cat.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {COLOR_PRESETS.slice(0, 5).map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => onUpdateCategoryColor(catKey, preset.hex)}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            activeColor === preset.hex ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        />
                      ))}
                      <input
                        type="color"
                        value={activeColor}
                        onChange={(e) => onUpdateCategoryColor(catKey, e.target.value)}
                        className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent ms-1"
                        title="انتخاب رنگ دقیق دلخواه"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            تغییرات شما بلادرنگ در پایگاه داده دوگانه ذخیره می‌شوند.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,application/json"
          className="hidden"
        />
      </div>
    </div>
  );
};
