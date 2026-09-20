import React, { useState } from 'react';
import {
  X,
  Bell,
  Volume2,
  VolumeX,
  Play,
  Check,
  Moon,
  Clock,
  Sparkles,
  Sliders,
  Shield,
  Film,
} from 'lucide-react';
import { ReminderConfig } from '../types';
import { ReminderService, DEFAULT_REMINDER_CONFIG } from '../services/reminderService';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [config, setConfig] = useState<ReminderConfig>(() => ReminderService.getConfig());
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  if (!isOpen) return null;

  const handleToggleMaster = () => {
    const updated = { ...config, enabled: !config.enabled };
    setConfig(updated);
    ReminderService.saveConfig(updated);
    onShowToast(
      updated.enabled ? 'سیستم یادآور و هشدار صوتی فعال شد.' : 'سیستم یادآورها غیرفعال شد.',
      'info'
    );
  };

  const handleUpdate = <K extends keyof ReminderConfig>(key: K, value: ReminderConfig[K]) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    ReminderService.saveConfig(updated);
  };

  const handleTestSound = () => {
    setIsPlayingTest(true);
    ReminderService.playTestSound(config.soundType, config.volume);
    setTimeout(() => setIsPlayingTest(false), 2000);
  };

  const handleRequestBrowserNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          handleUpdate('browserNotificationEnabled', true);
          onShowToast('مجوز اعلان‌های سیستم مرورگر با موفقیت فعال شد!', 'success');
        } else {
          handleUpdate('browserNotificationEnabled', false);
          onShowToast('مجوز اعلان توسط مرورگر رد شد.', 'warn');
        }
      } catch {
        onShowToast('خطا در درخواست مجوز اعلان مرورگر', 'warn');
      }
    } else {
      onShowToast('مرورگر شما از اعلان‌های سیستم پشتیبانی نمی‌کند.', 'warn');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Vazirmatn',sans-serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>تنظیمات یادآور و هشدارهای صوتی هوشمند</span>
                {config.enabled ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    فعال
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold">
                    غیرفعال
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                پخش صدای آرامش‌بخش برای شروع کارها، یادآوری کارنامه شبانه، و سانس فیلم و خواب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Master Switch Card */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">فعال بودن سیستم یادآور هوشمند</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                در صورت فعال بودن، هنگام رسیدن به سررسید بلوک‌ها و پایان روز به شما هشدار می‌دهد
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleMaster}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                config.enabled ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  config.enabled ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Synthesizer Controls */}
          <div className="p-4 rounded-2xl border border-amber-200/70 bg-amber-50/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span>صدای هشدار و زنگ آرامش‌بخش</span>
              </h3>
              <button
                type="button"
                onClick={handleTestSound}
                disabled={isPlayingTest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300/80 transition-all cursor-pointer shadow-2xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isPlayingTest ? 'در حال پخش...' : 'تست صدای زنگ'}</span>
              </button>
            </div>

            {/* Sound Tone Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'zen', name: 'کاسه تبتی (Zen Bowl)', freq: '۵۲۸ هرتز آرامش' },
                { id: 'marimba', name: 'ماریمبا ملایم', freq: 'آکورد ۴ تایی صعودی' },
                { id: 'bell', name: 'زنگ بلورین هوشیاری', freq: 'فرکانس فوکوس عمیق' },
                { id: 'evening', name: 'ناقوس شبانه', freq: '۴۳۲ هرتز هارمونیک' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleUpdate('soundType', s.id as any)}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    config.soundType === s.id
                      ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50/50'
                  }`}
                >
                  <div className="text-xs">{s.name}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">{s.freq}</div>
                </button>
              ))}
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>بلندی صدا</span>
                <span>{Math.round(config.volume * 100)}٪</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={config.volume}
                onChange={(e) => handleUpdate('volume', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 1: Block Start Reminder */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900">یادآور شروع هر بلوک زمانی</h3>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              چند دقیقه قبل از شروع فعالیت در جدول هشدار داده شود؟
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 0, label: 'دقیقاً در لحظه شروع' },
                { val: 2, label: '۲ دقیقه قبل' },
                { val: 5, label: '۵ دقیقه قبل (پیشنهادی)' },
                { val: 10, label: '۱۰ دقیقه قبل' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => handleUpdate('blockAlertLeadMinutes', item.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    config.blockAlertLeadMinutes === item.val
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Daily Report Audit Reminder (Nightly) */}
          <div className="p-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-indigo-950">
                  یادآور کارنامه شبانه (ثبت گزارش روز)
                </h3>
              </div>
              <input
                type="checkbox"
                checked={config.dailyAuditReminderEnabled}
                onChange={(e) => handleUpdate('dailyAuditReminderEnabled', e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-600">
              قبل از خواب یا رفتن به سانس فیلم و ریلکسیشن، با یک صدای دلنشین به شما یادآوری می‌کند تا
              کارنامه روز را تکمیل کنید.
            </p>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">ساعت هشدار کارنامه:</label>
              <input
                type="time"
                value={config.dailyAuditReminderTime}
                onChange={(e) => handleUpdate('dailyAuditReminderTime', e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 3: Movie / Relaxation / Sleep Reminder */}
          <div className="p-4 rounded-2xl border border-purple-200/80 bg-purple-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-purple-950">یادآور سانس فیلم و خواب عمیق</h3>
              </div>
              <input
                type="checkbox"
                checked={config.movieSleepReminderEnabled}
                onChange={(e) => handleUpdate('movieSleepReminderEnabled', e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-600">
              هشدار برای پایان کارها، خاموش کردن مانیتور و ورود به فاز آرامش و ریکاوری شبانه.
            </p>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">ساعت شروع فیلم/خواب:</label>
              <input
                type="time"
                value={config.movieSleepReminderTime}
                onChange={(e) => handleUpdate('movieSleepReminderTime', e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Browser Notifications Permission */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800">اعلان‌های سیستمی مرورگر</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                حتی اگر تب مرورگر در پس‌زمینه باشد، اعلان تصویری دریافت کنید
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestBrowserNotification}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 transition-colors cursor-pointer"
            >
              درخواست مجوز اعلان
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            تغییرات شما بلافاصله ذخیره و اعمال می‌شوند.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>تایید و ذخیره</span>
          </button>
        </div>
      </div>
    </div>
  );
};
