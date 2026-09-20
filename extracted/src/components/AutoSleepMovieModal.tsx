import React, { useState } from 'react';
import {
  Moon,
  Film,
  Sparkles,
  ShieldCheck,
  Clock,
  Calendar,
  Check,
  X,
  Coffee,
  Trash2,
  Tv,
  BedDouble,
  Info,
} from 'lucide-react';
import { DayKey } from '../types';
import { DAYS, toFaDigits } from '../constants/plannerConfig';
import {
  AutoSleepMovieConfig,
  DEFAULT_SLEEP_MOVIE_CONFIG,
} from '../utils/autoSleepMovieEngine';

interface AutoSleepMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: AutoSleepMovieConfig) => void;
  onClearExisting: () => void;
}

export const AutoSleepMovieModal: React.FC<AutoSleepMovieModalProps> = ({
  isOpen,
  onClose,
  onApply,
  onClearExisting,
}) => {
  const [config, setConfig] = useState<AutoSleepMovieConfig>(DEFAULT_SLEEP_MOVIE_CONFIG);

  if (!isOpen) return null;

  const toggleDay = (list: DayKey[], day: DayKey): DayKey[] => {
    return list.includes(day) ? list.filter((d) => d !== day) : [...list, day];
  };

  const setAllDays = (type: 'sleep' | 'nap' | 'movie') => {
    const all = DAYS.map((d) => d.id);
    if (type === 'sleep') setConfig((prev) => ({ ...prev, nightSleepDays: all }));
    if (type === 'nap') setConfig((prev) => ({ ...prev, powerNapDays: all }));
    if (type === 'movie') setConfig((prev) => ({ ...prev, movieDays: all }));
  };

  const setWeekendDays = (type: 'movie') => {
    if (type === 'movie') setConfig((prev) => ({ ...prev, movieDays: ['thu', 'fri'] }));
  };

  const handleApplyClick = () => {
    onApply(config);
    onClose();
  };

  // Calculate live preview counts
  const totalSleepBlocks = config.enableNightSleep ? config.nightSleepDays.length : 0;
  const totalNapBlocks = config.enablePowerNap ? config.powerNapDays.length : 0;
  const totalMovieBlocks = config.enableMovieTime ? config.movieDays.length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shadow-inner">
              <Moon className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black leading-tight text-white">
                  چینش خودکار زمان خواب و فیلم
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold">
                  هوشمند و ضدتداخل
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5 font-medium">
                تثبیت مرزهای فیزیولوژیک خواب، شارژ مجدد دوپامین و سانس‌های سینمایی هفته
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-800 dark:text-slate-200 text-xs">
          {/* SECTION 1: NIGHT SLEEP ROUTINE */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    خواب عمیق شبانه (Night Bedtime)
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    محافظت قطعی از ملاتونین مغز و پایان فعالیت‌های کاری
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableNightSleep}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, enableNightSleep: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:right-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {config.enableNightSleep && (
              <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                {/* Time Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      ساعت آغاز خاموشی و خواب:
                    </label>
                    <select
                      value={config.nightSleepStartMinutes}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          nightSleepStartMinutes: Number(e.target.value),
                          nightSleepDurationMinutes: 24 * 60 - Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={22 * 60}>ساعت ۲۲:۰۰ (۲ ساعت تا نیمه‌شب)</option>
                      <option value={22 * 60 + 30}>ساعت ۲۲:۳۰ (۱.۵ ساعت تا نیمه‌شب)</option>
                      <option value={23 * 60}>ساعت ۲۳:۰۰ (استاندارد فیزیولوژیک)</option>
                      <option value={23 * 60 + 30}>ساعت ۲۳:۳۰ (نیم‌ساعت تا نیمه‌شب)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      عنوان کارت در تقویم:
                    </label>
                    <input
                      type="text"
                      value={config.nightSleepTitle}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, nightSleepTitle: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Days selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      روزهای اعمال خواب شبانه:
                    </span>
                    <button
                      type="button"
                      onClick={() => setAllDays('sleep')}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      انتخاب تمام روزها (۷ روز)
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((day) => {
                      const selected = config.nightSleepDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              nightSleepDays: toggleDay(prev.nightSleepDays, day.id),
                            }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            selected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                          }`}
                        >
                          {day.nameFa}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: AFTERNOON POWER NAP */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    چرت نیمروزی زیستی (Power Nap)
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ریست سریع سیستم عصبی و افزایش قوای شناختی عصرگاهی
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enablePowerNap}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, enablePowerNap: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:right-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {config.enablePowerNap && (
              <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      زمان چرت روزانه:
                    </label>
                    <select
                      value={`${config.powerNapStartMinutes}-${config.powerNapDurationMinutes}`}
                      onChange={(e) => {
                        const [start, dur] = e.target.value.split('-').map(Number);
                        setConfig((prev) => ({
                          ...prev,
                          powerNapStartMinutes: start,
                          powerNapDurationMinutes: dur,
                        }));
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    >
                      <option value={`${13 * 60 + 30}-30`}>۱۳:۳۰ تا ۱۴:۰۰ (۳۰ دقیقه سریع)</option>
                      <option value={`${14 * 60}-45`}>۱۴:۰۰ تا ۱۴:۴۵ (۴۵ دقیقه استاندارد)</option>
                      <option value={`${14 * 60}-60`}>۱۴:۰۰ تا ۱۵:۰۰ (۶۰ دقیقه ریکاوری عمیق)</option>
                      <option value={`${14 * 60 + 30}-45`}>۱۴:۳۰ تا ۱۵:۱۵ (۴۵ دقیقه بعد ناهار)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      عنوان کارت چرت:
                    </label>
                    <input
                      type="text"
                      value={config.powerNapTitle}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, powerNapTitle: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Days selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      روزهای چرت نیمروزی:
                    </span>
                    <button
                      type="button"
                      onClick={() => setAllDays('nap')}
                      className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                    >
                      انتخاب تمام روزها
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((day) => {
                      const selected = config.powerNapDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              powerNapDays: toggleDay(prev.powerNapDays, day.id),
                            }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            selected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                          }`}
                        >
                          {day.nameFa}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: CINEMA & MOVIE TIME */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    سینما و تماشای فیلم (Movie / Cinema Time)
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    دوپامین سالم، استراحت عمیق ذهنی و تفریح هفتگی متوازن
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableMovieTime}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, enableMovieTime: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:right-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {config.enableMovieTime && (
              <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      ساعت شروع فیلم:
                    </label>
                    <select
                      value={config.movieStartMinutes}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          movieStartMinutes: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={19 * 60 + 30}>ساعت ۱۹:۳۰ عصر</option>
                      <option value={20 * 60}>ساعت ۲۰:۰۰ شب</option>
                      <option value={20 * 60 + 30}>ساعت ۲۰:۳۰ شب (استاندارد)</option>
                      <option value={21 * 60}>ساعت ۲۱:۰۰ شب</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      مدت سانس فیلم:
                    </label>
                    <select
                      value={config.movieDurationMinutes}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          movieDurationMinutes: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={90}>۹۰ دقیقه (۱.۵ ساعت)</option>
                      <option value={120}>۱۲۰ دقیقه (۲ ساعت - استاندارد سینما)</option>
                      <option value={150}>۱۵۰ دقیقه (۲.۵ ساعت فیلم بلند)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      عنوان کارت فیلم:
                    </label>
                    <input
                      type="text"
                      value={config.movieTitle}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, movieTitle: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Movie Days selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      روزهای سانس فیلم:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWeekendDays('movie')}
                        className="text-[10px] text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
                      >
                        پنج‌شنبه و جمعه (پیش‌فرض)
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={() => setAllDays('movie')}
                        className="text-[10px] text-slate-500 dark:text-slate-400 font-bold hover:underline cursor-pointer"
                      >
                        همه روزها
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((day) => {
                      const selected = config.movieDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              movieDays: toggleDay(prev.movieDays, day.id),
                            }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            selected
                              ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                          }`}
                        >
                          {day.nameFa}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: COLLISION AND STRATEGY */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-extrabold text-xs">استراتژی چینش و کنترل تداخل</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                  config.strategy === 'strict_cascade'
                    ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-2xs'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value="strict_cascade"
                  checked={config.strategy === 'strict_cascade'}
                  onChange={() =>
                    setConfig((prev) => ({ ...prev, strategy: 'strict_cascade' }))
                  }
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    اولویت قطعی سلامت و خواب (توصیه‌شده)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                    ساعات خواب و فیلم تثبیت می‌شوند و تسک‌های متداخل قبلی بدون حذف، مرتباً به عقب هل داده می‌شوند.
                  </span>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                  config.strategy === 'safe_fit'
                    ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-2xs'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value="safe_fit"
                  checked={config.strategy === 'safe_fit'}
                  onChange={() => setConfig((prev) => ({ ...prev, strategy: 'safe_fit' }))}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    چینش فقط در فضاهای خالی
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                    اگر در ساعت موردنظر تسکی باشد، بدون تغییر می‌ماند و خواب/فیلم فقط در روزهای آزاد می‌نشیند.
                  </span>
                </div>
              </label>
            </div>

            {/* Smart overwrite previous */}
            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.clearExistingSleepMovieFirst}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      clearExistingSleepMovieFirst: e.target.checked,
                    }))
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  به‌روزرسانی تمیز: خواب‌ها و فیلم‌های قبلی را جایگزین کن (جلوگیری از کارت تکراری)
                </span>
              </label>

              <button
                type="button"
                onClick={onClearExisting}
                className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 font-bold cursor-pointer"
                title="حذف فوری تمام بلوک‌های خواب و فیلم از تقویم"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف بلوک‌های فعلی</span>
              </button>
            </div>
          </div>

          {/* LIVE SUMMARY BADGE */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>خلاصه چینش:</span>
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                {config.enableNightSleep && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300">
                    {toFaDigits(totalSleepBlocks)} شب خواب
                  </span>
                )}
                {config.enablePowerNap && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">
                    {toFaDigits(totalNapBlocks)} چرت نیمروزی
                  </span>
                )}
                {config.enableMovieTime && (
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300">
                    {toFaDigits(totalMovieBlocks)} سانس فیلم
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              با قابلیت بازگشت کامل (Ctrl + Z)
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleApplyClick}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-black shadow-md hover:shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>چینش دقیق و اعمال به تقویم</span>
          </button>
        </div>
      </div>
    </div>
  );
};
