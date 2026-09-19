import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  ArrowUpDown,
  Share2,
  Copy,
  Printer,
  Check,
  Flame,
  Coffee,
  TrendingUp,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TimeBlock, DayKey, CategoryKey } from '../types';
import {
  DAYS,
  CATEGORIES,
  minutesToTimeString,
  formatDurationFa,
  toFaDigits,
} from '../constants/plannerConfig';
import { CategoryIcon } from './CategoryIcon';

interface SpecialWeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimeBlock[];
  plannerTitle: string;
  weekRange: string;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warn') => void;
  onToggleComplete: (blockId: string) => void;
}

interface ActivityAggregated {
  title: string;
  category: CategoryKey;
  totalMinutes: number;
  sessionCount: number;
  completedCount: number;
  completionRate: number;
  avgMinutesPerSession: number;
  days: { dayKey: DayKey; count: number; completed: number; totalMinutes: number }[];
  sessions: TimeBlock[];
  insight: string;
}

export const SpecialWeeklyReportModal: React.FC<SpecialWeeklyReportModalProps> = ({
  isOpen,
  onClose,
  blocks,
  plannerTitle,
  weekRange,
  onShowToast,
  onToggleComplete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'sessions' | 'completion' | 'alpha'>('time');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Total planned minutes across all blocks
  const totalWeekMinutes = useMemo(() => {
    return blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  }, [blocks]);

  const totalCompletedMinutes = useMemo(() => {
    return blocks
      .filter((b) => b.completed)
      .reduce((acc, b) => acc + b.durationMinutes, 0);
  }, [blocks]);

  const overallCompletionRate = totalWeekMinutes > 0
    ? Math.round((totalCompletedMinutes / totalWeekMinutes) * 100)
    : 0;

  // Aggregate by unique card title
  const aggregatedActivities = useMemo(() => {
    const map = new Map<string, ActivityAggregated>();

    blocks.forEach((block) => {
      const normTitle = block.title.trim();
      const existing = map.get(normTitle);

      if (!existing) {
        map.set(normTitle, {
          title: normTitle,
          category: block.category,
          totalMinutes: block.durationMinutes,
          sessionCount: 1,
          completedCount: block.completed ? 1 : 0,
          completionRate: block.completed ? 100 : 0,
          avgMinutesPerSession: block.durationMinutes,
          days: [{ dayKey: block.day, count: 1, completed: block.completed ? 1 : 0, totalMinutes: block.durationMinutes }],
          sessions: [block],
          insight: '',
        });
      } else {
        existing.totalMinutes += block.durationMinutes;
        existing.sessionCount += 1;
        if (block.completed) existing.completedCount += 1;
        existing.completionRate = Math.round((existing.completedCount / existing.sessionCount) * 100);
        existing.avgMinutesPerSession = Math.round(existing.totalMinutes / existing.sessionCount);

        const dayEntry = existing.days.find((d) => d.dayKey === block.day);
        if (dayEntry) {
          dayEntry.count += 1;
          dayEntry.totalMinutes += block.durationMinutes;
          if (block.completed) dayEntry.completed += 1;
        } else {
          existing.days.push({
            dayKey: block.day,
            count: 1,
            completed: block.completed ? 1 : 0,
            totalMinutes: block.durationMinutes,
          });
        }

        existing.sessions.push(block);
      }
    });

    // Assign thoughtful insights
    const list = Array.from(map.values()).map((act) => {
      let insight = '';
      if (act.category === 'recovery' || act.category === 'gaming') {
        insight = `🌿 شارژ عصبی: ${formatDurationFa(act.totalMinutes)} زمان استراحت برای محافظت از مغز در برابر فرسودگی.`;
      } else if (act.totalMinutes >= 360) {
        insight = `🔥 سرمایه‌گذاری سنگین: بیش از ۶ ساعت تمرکز در هفته؛ مهارت کلیدی شما در این دوره.`;
      } else if (act.completionRate === 100) {
        insight = `✅ تعهد کامل: تمام ${toFaDigits(act.sessionCount)} جلسه به طور ۱۰۰٪ انجام شد.`;
      } else if (act.sessionCount >= 4) {
        insight = `⚡ اثر مرکب: مداومت بالا در ${toFaDigits(act.days.length)} روز هفته.`;
      } else {
        insight = `🎯 اختصاص ${formatDurationFa(act.totalMinutes)} زمان در هفته (میانگین ${formatDurationFa(act.avgMinutesPerSession)} در هر نوبت).`;
      }
      return { ...act, insight };
    });

    return list;
  }, [blocks]);

  // Filter and sort
  const filteredActivities = useMemo(() => {
    let list = aggregatedActivities.filter((act) => {
      const matchSearch =
        !searchQuery.trim() ||
        act.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedFilterCategory === 'all' || act.category === selectedFilterCategory;
      return matchSearch && matchCat;
    });

    if (sortBy === 'time') {
      list.sort((a, b) => b.totalMinutes - a.totalMinutes);
    } else if (sortBy === 'sessions') {
      list.sort((a, b) => b.sessionCount - a.sessionCount);
    } else if (sortBy === 'completion') {
      list.sort((a, b) => b.completionRate - a.completionRate);
    } else if (sortBy === 'alpha') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'fa'));
    }

    return list;
  }, [aggregatedActivities, searchQuery, selectedFilterCategory, sortBy]);

  // Peak day calculation
  const peakDay = useMemo(() => {
    const dayTotals: Record<DayKey, number> = {
      sat: 0,
      sun: 0,
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
    };
    blocks.forEach((b) => {
      dayTotals[b.day] = (dayTotals[b.day] || 0) + b.durationMinutes;
    });
    let maxDay: DayKey = 'sat';
    let maxMins = 0;
    Object.entries(dayTotals).forEach(([day, mins]) => {
      if (mins > maxMins) {
        maxMins = mins;
        maxDay = day as DayKey;
      }
    });
    const found = DAYS.find((d) => d.id === maxDay);
    return { nameFa: found?.nameFa || 'شنبه', minutes: maxMins };
  }, [blocks]);

  // Copy structured report to clipboard
  const handleCopyReport = () => {
    let reportText = `📊 گزارش ویژه هفتگی: ${plannerTitle}\n🗓️ بازه زمانی: ${weekRange}\n`;
    reportText += `⏱️ کل ساعات برنامه‌ریزی: ${formatDurationFa(totalWeekMinutes)} | انجام شده: ${formatDurationFa(totalCompletedMinutes)} (${toFaDigits(overallCompletionRate)}٪)\n\n`;
    reportText += `📋 تفکیک دقیق هر کارت در کل هفته:\n`;
    reportText += `─────────────────────────\n`;

    filteredActivities.forEach((act, idx) => {
      const pct = totalWeekMinutes > 0 ? Math.round((act.totalMinutes / totalWeekMinutes) * 100) : 0;
      reportText += `${toFaDigits(idx + 1)}. ${act.title}:\n`;
      reportText += `   • مجموع زمان: ${formatDurationFa(act.totalMinutes)} (${toFaDigits(pct)}٪ کل هفته)\n`;
      reportText += `   • جلسات: ${toFaDigits(act.sessionCount)} جلسه | انجام شده: ${toFaDigits(act.completedCount)} (${toFaDigits(act.completionRate)}٪)\n`;
      const daysStr = act.days
        .map((d) => {
          const dayName = DAYS.find((x) => x.id === d.dayKey)?.nameFa;
          return `${dayName} (${formatDurationFa(d.totalMinutes)})`;
        })
        .join('، ');
      reportText += `   • توزیع در روزها: ${daysStr}\n\n`;
    });

    reportText += `─────────────────────────\nتولید شده توسط تایم‌باکسینگ اختصاصی`;

    navigator.clipboard.writeText(reportText);
    setIsCopied(true);
    onShowToast('گزارش تحلیلی جامع در کلیپ‌بورد کپی شد.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-md no-print select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header Bar */}
          <div className="px-6 py-4.5 bg-gradient-to-l from-indigo-50/90 via-slate-50 to-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                <BrainCircuit className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    گزارش ویژه و هوش تحلیلی کارت‌ها
                  </h2>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    کل هفته
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  تفکیک ساعت به ساعت تمام کارت‌ها، درصد سهم هر فعالیت و ارزیابی عمق تمرکز
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs transition-colors cursor-pointer"
                title="کپی متن شکیل این گزارش"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700">کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>کپی متن گزارش</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Golden Highlights Bar */}
          <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {/* Total Planned */}
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>کل زمان هفته</span>
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-base font-black text-slate-900 font-mono">
                {formatDurationFa(totalWeekMinutes)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {toFaDigits(aggregatedActivities.length)} کارت موضوعی مجزا
              </span>
            </div>

            {/* Total Done */}
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>پیشرفت تحقق</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-base font-black text-emerald-700 font-mono">
                {toFaDigits(overallCompletionRate)}٪
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">
                {formatDurationFa(totalCompletedMinutes)} انجام شده
              </span>
            </div>

            {/* Peak Day */}
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>اوج فعالیت</span>
                <Flame className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-base font-black text-slate-900">
                {peakDay.nameFa}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {formatDurationFa(peakDay.minutes)} بار کاری
              </span>
            </div>

            {/* Neuro Balance */}
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>سهم استراحت</span>
                <Coffee className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div className="text-base font-black text-orange-950 font-mono">
                {formatDurationFa(
                  blocks
                    .filter((b) => b.category === 'recovery' || b.category === 'gaming')
                    .reduce((acc, b) => acc + b.durationMinutes, 0)
                )}
              </div>
              <span className="text-[10px] text-orange-700 font-medium">
                محافظت از تمرکز پایدار
              </span>
            </div>
          </div>

          {/* Filter & Sort Controls Bar */}
          <div className="px-6 py-2.5 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در نام کارت‌ها..."
                className="w-full pr-8 pl-3 py-1 text-xs rounded-xl bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-hidden transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-mono"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <button
                onClick={() => setSelectedFilterCategory('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFilterCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                همه ({toFaDigits(aggregatedActivities.length)})
              </button>
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const count = aggregatedActivities.filter((a) => a.category === key).length;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedFilterCategory(key)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedFilterCategory === key
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: cat.dotColor }}
                    />
                    <span>{cat.label}</span>
                    <span className="text-[10px] font-mono opacity-80">({toFaDigits(count)})</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>ترتیب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="time">بیشترین ساعت کل</option>
                <option value="sessions">بیشترین تعداد جلسه</option>
                <option value="completion">بالاترین درصد تکمیل</option>
                <option value="alpha">الفبایی</option>
              </select>
            </div>
          </div>

          {/* Main Card List with Staggered Motion */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                کارتی با این فیلتر یا نام پیدا نشد.
              </div>
            ) : (
              filteredActivities.map((act, index) => {
                const theme = CATEGORIES[act.category] || CATEGORIES.custom;
                const percentOfWeek =
                  totalWeekMinutes > 0
                    ? Math.round((act.totalMinutes / totalWeekMinutes) * 100)
                    : 0;
                const isExpanded = expandedActivity === act.title;

                return (
                  <motion.div
                    key={act.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className={`rounded-2xl border transition-all duration-200 ${
                      isExpanded
                        ? 'bg-white shadow-md border-indigo-200 ring-1 ring-indigo-200/50'
                        : 'bg-white hover:bg-slate-50/70 border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    {/* Main Row */}
                    <div
                      onClick={() => setExpandedActivity(isExpanded ? null : act.title)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                    >
                      {/* Left Title & Tags */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0"
                          style={{
                            backgroundColor: `${theme.dotColor}20`,
                            color: theme.dotColor,
                          }}
                        >
                          <CategoryIcon category={act.category} className="w-5 h-5 stroke-[2.2]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">
                              {act.title}
                            </h3>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${theme.badgeClass} font-mono`}
                            >
                              {theme.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{toFaDigits(act.sessionCount)} جلسه در هفته</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-slate-600">
                              میانگین هر جلسه: {formatDurationFa(act.avgMinutesPerSession)}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span
                              className={`font-bold font-mono text-[11px] ${
                                act.completionRate === 100
                                  ? 'text-emerald-700'
                                  : act.completionRate > 50
                                  ? 'text-indigo-700'
                                  : 'text-slate-600'
                              }`}
                            >
                              تکمیل: {toFaDigits(act.completedCount)} از {toFaDigits(act.sessionCount)} ({toFaDigits(act.completionRate)}٪)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Metrics & Progress */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Time & Weekload Share */}
                        <div className="text-left">
                          <div className="text-sm sm:text-base font-black text-slate-900 font-mono">
                            {formatDurationFa(act.totalMinutes)}
                          </div>
                          <div className="text-[10px] text-indigo-700 font-bold font-mono">
                            {toFaDigits(percentOfWeek)}٪ از کل هفته
                          </div>
                        </div>

                        {/* Expand Icon */}
                        <div className="text-slate-400 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="px-4 pb-2">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.max(3, percentOfWeek))}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: theme.dotColor }}
                        />
                      </div>
                    </div>

                    {/* Expandable Session Breakdown */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 pt-2 border-t border-slate-100 overflow-hidden space-y-3"
                        >
                          {/* Intelligent Neuro Insight */}
                          <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100/80 text-xs text-indigo-900 font-medium flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>{act.insight}</span>
                          </div>

                          {/* Days Presence Pills */}
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                              روزهای حضور این فعالیت در جدول:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {DAYS.map((day) => {
                                const match = act.days.find((d) => d.dayKey === day.id);
                                return (
                                  <span
                                    key={day.id}
                                    className={`text-[10px] font-bold px-2 py-0.8 rounded-lg flex items-center gap-1 ${
                                      match
                                        ? 'bg-slate-900 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-400 opacity-60'
                                    }`}
                                  >
                                    <span>{day.nameFa}</span>
                                    {match && (
                                      <span className="font-mono text-[9px] opacity-80">
                                        ({formatDurationFa(match.totalMinutes)})
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Sessions List */}
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                              جلسات ثبت‌شده و وضعیت انجام:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {act.sessions.map((sess) => {
                                const startStr = toFaDigits(minutesToTimeString(sess.startMinutes));
                                const endStr = toFaDigits(
                                  minutesToTimeString(sess.startMinutes + sess.durationMinutes)
                                );
                                const dayObj = DAYS.find((d) => d.id === sess.day);

                                return (
                                  <div
                                    key={sess.id}
                                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-800">
                                          {dayObj?.nameFa}
                                        </span>
                                        <span className="text-[11px] font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                          {startStr} تا {endStr}
                                        </span>
                                      </div>
                                      {sess.subtitle && (
                                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                          {sess.subtitle}
                                        </p>
                                      )}
                                    </div>

                                    <button
                                      onClick={() => onToggleComplete(sess.id)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                                        sess.completed
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                      }`}
                                    >
                                      <CheckCircle2
                                        className={`w-3 h-3 ${
                                          sess.completed ? 'text-emerald-700' : 'text-slate-400'
                                        }`}
                                      />
                                      <span>{sess.completed ? 'انجام شد' : 'در انتظار'}</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer with Summary Status */}
          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 shrink-0">
            <span className="font-medium">
              نمایش {toFaDigits(filteredActivities.length)} کارت موضوعی از مجموع {toFaDigits(blocks.length)} بلوک زمانی تقویم
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              بستن گزارش
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
