import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Zap,
  Brain,
  Moon,
  Clock,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Info,
  PowerOff,
  Power,
  Palmtree,
} from 'lucide-react';
import { PlannerRulesConfig } from '../types';
import { DEFAULT_PLANNER_RULES } from '../constants/defaultPlannerRules';
import { toFaDigits } from '../constants/plannerConfig';

interface PlannerRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: PlannerRulesConfig;
  onSaveRules: (newRules: PlannerRulesConfig) => void;
  onAlignAllDays: () => void;
  hasAnyOverlaps: boolean;
}

export const PlannerRulesModal: React.FC<PlannerRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  onAlignAllDays,
  hasAnyOverlaps,
}) => {
  const [localRules, setLocalRules] = useState<PlannerRulesConfig>({ ...rules });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveRules(localRules);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    setLocalRules({ ...DEFAULT_PLANNER_RULES });
  };

  const handleDisableAll = () => {
    setLocalRules({
      ...localRules,
      strictNonOverlap: false,
      warnDeepWorkOverLimit: false,
      warnUltradianBreakNeeded: false,
      warnNightShieldViolations: false,
      weekendRecoveryEnforced: false,
    });
  };

  const handleEnableAll = () => {
    setLocalRules({
      ...localRules,
      strictNonOverlap: true,
      warnDeepWorkOverLimit: true,
      warnUltradianBreakNeeded: true,
      warnNightShieldViolations: true,
      weekendRecoveryEnforced: true,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-l from-indigo-900 via-slate-900 to-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>موتور قوانین و منطق زمان‌بندی</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 border border-indigo-300/30 font-mono font-bold">
                  Anti-Fragile Logic
                </span>
              </h2>
              <p className="text-[11.5px] text-slate-300 mt-0.5 font-medium">
                تنظیم اصول بیولوژیکی، منع تداخل هم‌زمان و روانشناسی تمرکز پیوسته (با قابلیت خاموش/روشن اختصاصی)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Quick Toggle Toolbar */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-600 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>کنترل یکپارچه قوانین:</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDisableAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              title="خاموش کردن تمام قوانین برای آزادی کامل در چینش دستی"
            >
              <PowerOff className="w-3 h-3" />
              <span>خاموش کردن همه قوانین</span>
            </button>
            <button
              type="button"
              onClick={handleEnableAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              title="فعال‌سازی هوشمند تمام اصول زمان‌بندی بیولوژیک"
            >
              <Power className="w-3 h-3" />
              <span>روشن کردن همه قوانین</span>
            </button>
          </div>
        </div>

        {/* Modal Body with Rules Cards */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800">
          {/* Quick Notice if Overlaps Exist */}
          {hasAnyOverlaps && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
                <span className="font-bold truncate">
                  در حال حاضر تسک‌هایی با تداخل زمانی در جدول وجود دارند!
                </span>
              </div>
              <button
                onClick={() => {
                  onAlignAllDays();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition-colors cursor-pointer shadow-xs text-[11px]"
              >
                ترازبندی و رفع فوری تمام تداخل‌ها
              </button>
            </div>
          )}

          {/* Rule 1: Strict Non-Overlap & Auto Cascade */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 hover:border-indigo-300 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span>قانون ۱: منع قطعی تداخل هم‌زمان و انتقال زنجیره‌ای (Cascade)</span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-bold ${
                        localRules.strictNonOverlap
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {localRules.strictNonOverlap ? 'فعال' : 'خاموش'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    یک انسان در یک لحظه فقط می‌تواند یک کار انجام دهد. با فعال بودن این قانون، هنگام جابجایی یا قرار دادن هر تسک (مثلاً زبان ۲۰ دقیقه‌ای)، تسک بعدی به طور خودکار به انتهای آن منتقل می‌شود و هیچ دو کارتی روی هم نمی‌افتند.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={localRules.strictNonOverlap}
                  onChange={(e) =>
                    setLocalRules((prev) => ({ ...prev, strictNonOverlap: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Buffer between tasks */}
            {localRules.strictNonOverlap && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  فاصله هوشمند تنفس بین دو تسک متوالی:
                </span>
                <div className="flex items-center gap-1.5">
                  {[0, 5, 10].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() =>
                        setLocalRules((prev) => ({
                          ...prev,
                          bufferMinutesBetweenTasks: mins,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        localRules.bufferMinutesBetweenTasks === mins
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mins === 0 ? 'مماس (۰ دقیقه)' : `${toFaDigits(mins)} دقیقه`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rule 2: Cognitive Load & Deep Work Limit */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 hover:border-indigo-300 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Brain className="w-4 h-4 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span>قانون ۲: سقف بار شناختی روزانه (Daily Deep Work Limit)</span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-bold ${
                        localRules.warnDeepWorkOverLimit
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {localRules.warnDeepWorkOverLimit ? 'فعال' : 'خاموش'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    مغز انسان روزانه توانایی حداکثر ۴ تا ۶ ساعت کار با تمرکز عمیق (AI/پایتون) را دارد. کار بیشتر منجر به فرسودگی و کاهش خلاقیت می‌شود.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={localRules.warnDeepWorkOverLimit}
                  onChange={(e) =>
                    setLocalRules((prev) => ({ ...prev, warnDeepWorkOverLimit: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {localRules.warnDeepWorkOverLimit && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">سقف مجاز کار عمیق در شبانه‌روز:</span>
                <div className="flex items-center gap-1.5">
                  {[4, 5, 6, 7].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() =>
                        setLocalRules((prev) => ({
                          ...prev,
                          maxDailyDeepWorkHours: hrs,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        localRules.maxDailyDeepWorkHours === hrs
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {toFaDigits(hrs)} ساعت
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rule 3: Ultradian Rhythm (90-min Break Rule) */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 hover:border-indigo-300 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span>قانون ۳: ریتم اولترادین ۹۰ دقیقه‌ای (Ultradian Focus & Rest)</span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-bold ${
                        localRules.warnUltradianBreakNeeded
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {localRules.warnUltradianBreakNeeded ? 'فعال' : 'خاموش'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    امواج مغزی پس از ۹۰ الی ۱۲۰ دقیقه تمرکز مستمر دچار افت فرکانس می‌شوند. پیشنهاد استراحت و ریکاوری برای بازیابی هوشیاری عصبی ارائه می‌شود.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={localRules.warnUltradianBreakNeeded}
                  onChange={(e) =>
                    setLocalRules((prev) => ({
                      ...prev,
                      warnUltradianBreakNeeded: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            {localRules.warnUltradianBreakNeeded && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">سقف تمرکز پیوسته قبل از استراحت:</span>
                <div className="flex items-center gap-1.5">
                  {[60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() =>
                        setLocalRules((prev) => ({
                          ...prev,
                          maxConsecutiveFocusMinutes: mins,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        localRules.maxConsecutiveFocusMinutes === mins
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {toFaDigits(mins)} دقیقه
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rule 4: Circadian Night Shield */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 hover:border-indigo-300 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Moon className="w-4 h-4 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span>قانون ۴: محافظ ریتم شبانه‌روزی خواب (Circadian Night Shield)</span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-bold ${
                        localRules.warnNightShieldViolations
                          ? 'bg-slate-800 text-amber-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {localRules.warnNightShieldViolations ? 'فعال' : 'خاموش'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    جلوگیری از برنامه‌ریزی کارهای سنگین کدنویسی و دانشگاه در ساعات نزدیک به خواب برای حفظ ترشح هورمون ملاتونین و کیفیت استراحت مغز.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={localRules.warnNightShieldViolations}
                  onChange={(e) =>
                    setLocalRules((prev) => ({
                      ...prev,
                      warnNightShieldViolations: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
              </label>
            </div>

            {localRules.warnNightShieldViolations && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">ساعت آغاز پنجره استراحت و خواب:</span>
                <div className="flex items-center gap-1.5">
                  {[21.5, 22.0, 22.5, 23.0].map((val) => {
                    const hourStr =
                      val === 21.5 ? '۲۱:۳۰' : val === 22.0 ? '۲۲:۰۰' : val === 22.5 ? '۲۲:۳۰' : '۲۳:۰۰';
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          setLocalRules((prev) => ({
                            ...prev,
                            nightShieldStartHour: val,
                          }))
                        }
                        className={`px-2 py-1 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                          localRules.nightShieldStartHour === val
                            ? 'bg-slate-800 text-amber-300 shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {hourStr}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Rule 5: Weekend Recovery Guard */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 hover:border-indigo-300 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Palmtree className="w-4 h-4 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span>قانون ۵: محافظت از تعادل آخر هفته (Weekend Dopamine Reset)</span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-bold ${
                        localRules.weekendRecoveryEnforced
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {localRules.weekendRecoveryEnforced ? 'فعال' : 'خاموش'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    تضمین اختصاص زمان در روز جمعه برای بازتنظیم گیرنده‌های دوپامین مغز، بازیابی انرژی، ورزش و عدم انباشت کارهای سنگین بدون وقفه.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={localRules.weekendRecoveryEnforced}
                  onChange={(e) =>
                    setLocalRules((prev) => ({
                      ...prev,
                      weekendRecoveryEnforced: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
            title="بازنشانی تمام قوانین به مقادیر پیش‌فرض"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی پیش‌فرض‌ها</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>ذخیره شد!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                  <span>اعمال و ذخیره قوانین</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
