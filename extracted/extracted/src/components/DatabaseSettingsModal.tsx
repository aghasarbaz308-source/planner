import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  PlannerStorageService,
  StorageConfig,
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
  onShowToast,
  onDownloadBackup,
  onRestoreBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'db' | 'colors'>('db');
  const [confirmClearText, setConfirmClearText] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(() =>
    PlannerStorageService.getConfig()
  );

  const stats = PlannerStorageService.getStorageStats();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>تنظیمات پیشرفته پایگاه داده و رنگ‌بندی</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Anti-Fragile DB v3
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                موتور دوگانه ذخیره‌سازی ابدی IndexedDB + LocalStorage و شخصی‌سازی ظاهر
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
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('db')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'db'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>پایگاه داده و پایداری حافظه</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'colors'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>رنگ‌بندی و پالت‌های منظم</span>
          </button>
        </div>

        {/* Tab 1: Database Management */}
        {activeTab === 'db' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Engine Status Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-black text-emerald-950">
                  موتور دوگانه ذخیره‌سازی مقاوم و بدون باگ (Fail-Safe Dual Engine)
                </h4>
                <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                  برنامه به صورت هم‌زمان از <strong>IndexedDB بومی مرورگر</strong> (غیرقابل پاک‌شدن با خالی‌کردن عادی کش) و <strong>LocalStorage همگام</strong> استفاده می‌کند. با ریفرش، بستن مرورگر یا روشن ماندن سیستم برای روزها، هیچ داده‌ای از بین نخواهد رفت.
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">کارت‌های ثبت‌شده</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {toFaDigits(totalBlocks)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">الگوهای بانک</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {toFaDigits(totalTemplates)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">نوت‌های اولویت‌دار</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {toFaDigits(totalNotes)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">حجم اشغال‌شده</span>
                <span className="text-base font-black text-indigo-700 font-mono">
                  {toFaDigits((stats.storageUsedBytes / 1024).toFixed(1))} KB
                </span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">ذخیره‌سازی خودکار (Auto-Save)</h5>
                  <p className="text-[11px] text-slate-500">
                    ذخیره آنی هر جابجایی کارت یا ویرایش به صورت خودکار
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
                  <h5 className="text-xs font-bold text-slate-900">استفاده از دیتابیس محلی</h5>
                  <p className="text-[11px] text-slate-500">
                    در صورت خاموش بودن، هیچ فایلی در حافظه مرورگر ذخیره نخواهد شد
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

            {/* Backup & Restore Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={onDownloadBackup}
                className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>دانلود فایل پشتیبان کامل (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>بازیابی فایل پشتیبان</span>
              </button>
            </div>

            {/* Clear Database Danger Zone */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>منطقه حساس: حذف و پاک‌سازی دیتابیس</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                با حذف دیتابیس، تمام کارت‌ها، ریتم‌های روزانه، نوت‌ها و الگوهای سفارشی از حافظه پاک شده و برنامه به حالت خام اولیه برمی‌گردد.
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
                    برای تأیید قطعی، عبارت «<span className="text-rose-600">حذف دیتابیس</span>» را تایپ کنید:
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
                      تأیید و حذف
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

        {/* Tab 2: Custom Colors & Themes */}
        {activeTab === 'colors' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            تغییرات شما بلادرنگ در IndexedDB و LocalStorage ذخیره می‌شوند.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
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
