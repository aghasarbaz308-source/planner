import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Database,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  Trash2,
  Download,
  Upload,
  Search,
  ChevronRight,
  TrendingUp,
  Brain,
  Sparkles,
  FileText,
  AlertCircle,
  Copy,
  Filter,
} from 'lucide-react';
import { DailyReportCard, DayKey } from '../types';
import { PlannerStorageService } from '../services/plannerStorage';
import { DAYS, toFaDigits, formatDurationFa } from '../constants/plannerConfig';

interface DailyAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDailyReportForDay: (day: DayKey) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const DailyAuditHistoryModal: React.FC<DailyAuditHistoryModalProps> = ({
  isOpen,
  onClose,
  onOpenDailyReportForDay,
  onShowToast,
}) => {
  const [cardsMap, setCardsMap] = useState<Record<string, DailyReportCard>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedCardDetail, setSelectedCardDetail] = useState<DailyReportCard | null>(null);

  const loadData = () => {
    const data = PlannerStorageService.getDailyAuditCards();
    setCardsMap(data);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const cardsList = useMemo(() => {
    return (Object.values(cardsMap) as DailyReportCard[]).sort((a, b) => {
      return (b.createdAt || b.date).localeCompare(a.createdAt || a.date);
    });
  }, [cardsMap]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cardsList.filter((card) => {
      const matchesGrade =
        selectedGradeFilter === 'all' || card.grade === selectedGradeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        card.date.includes(searchQuery) ||
        (card.insights && card.insights.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (card.lessonsLearned && card.lessonsLearned.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesGrade && matchesSearch;
    });
  }, [cardsList, searchQuery, selectedGradeFilter]);

  // Aggregate Metrics
  const aggregateMetrics = useMemo(() => {
    if (cardsList.length === 0) {
      return { totalDays: 0, avgScore: 0, totalDeepWorkHours: 0, totalCompletedTasks: 0 };
    }
    const totalScore = cardsList.reduce((acc, c) => acc + (c.disciplineScore || 0), 0);
    const totalDeepHours = cardsList.reduce((acc, c) => acc + (c.deepWorkHours || 0), 0);
    const totalTasks = cardsList.reduce((acc, c) => acc + (c.completedTasksCount || 0), 0);

    return {
      totalDays: cardsList.length,
      avgScore: Math.round(totalScore / cardsList.length),
      totalDeepWorkHours: Math.round(totalDeepHours * 10) / 10,
      totalCompletedTasks: totalTasks,
    };
  }, [cardsList]);

  if (!isOpen) return null;

  const handleDeleteCard = (cardId: string) => {
    if (confirm('آیا از حذف این گزارش ممیزی از دیتابیس اطمینان دارید؟')) {
      const ok = PlannerStorageService.deleteDailyAuditCard(cardId);
      if (ok) {
        onShowToast('گزارش با موفقیت از پایگاه داده حذف شد.', 'info');
        loadData();
        if (selectedCardDetail?.id === cardId) {
          setSelectedCardDetail(null);
        }
      }
    }
  };

  const handleExportJson = () => {
    PlannerStorageService.exportAuditDatabase();
    onShowToast('پایگاه داده کارنامه‌ها با موفقیت به صورت JSON دانلود شد.', 'success');
  };

  const handleExportCsv = () => {
    if (cardsList.length === 0) {
      onShowToast('داده‌ای برای صدور وجود ندارد.', 'warn');
      return;
    }
    try {
      const headers = ['تاریخ', 'روز هفته', 'نمره انضباط', 'گرید', 'ساعت کار عمیق', 'تسک‌های انجام‌شده', 'تفاوت زمانی (دقیقه)'];
      const rows = cardsList.map((c) => {
        const dayObj = DAYS.find((d) => d.id === c.dayKey);
        return [
          c.date,
          dayObj?.nameFa || c.dayKey,
          c.disciplineScore,
          c.grade,
          c.deepWorkHours,
          `${c.completedTasksCount}/${c.totalTasksCount}`,
          c.timeDeltaMinutes,
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-audit-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowToast('فایل اکسل/CSV کارنامه‌ها دانلود شد.', 'success');
    } catch {
      onShowToast('خطا در صدور فایل CSV', 'warn');
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const parsed = JSON.parse(content);
        const count = PlannerStorageService.importAuditDatabase(parsed);
        loadData();
        onShowToast(`${count} کارنامه جدید با موفقیت به پایگاه داده اضافه شد.`, 'success');
      } catch {
        onShowToast('فایل واردشده معتبر نیست.', 'warn');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Vazirmatn',sans-serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>پایگاه داده کارنامه‌ها و گزارش‌های روزانه</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                  {cardsList.length} رکورد ماندگار
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                آرشیو کامل تاریخچه انضباط شخصی، کار عمیق و درس‌های آموخته‌شده به همراه خروجی اکسل و JSON
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div className="flex items-center justify-between text-indigo-700 mb-1">
                <span className="text-xs font-bold">کل روزهای ممیزی‌شده</span>
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-indigo-950">
                {toFaDigits(aggregateMetrics.totalDays)} <span className="text-xs font-bold">روز</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-xs font-bold">میانگین انضباط</span>
                <Award className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-emerald-950">
                {toFaDigits(aggregateMetrics.avgScore)} <span className="text-xs font-bold">از ۱۰۰</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
              <div className="flex items-center justify-between text-purple-700 mb-1">
                <span className="text-xs font-bold">ساعات کار عمیق ثبت‌شده</span>
                <Brain className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-purple-950">
                {toFaDigits(aggregateMetrics.totalDeepWorkHours)} <span className="text-xs font-bold">ساعت</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <span className="text-xs font-bold">تسک‌های تکمیل‌شده</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-amber-950">
                {toFaDigits(aggregateMetrics.totalCompletedTasks)} <span className="text-xs font-bold">بلوک</span>
              </div>
            </div>
          </div>

          {/* Action Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در درس‌های آموخته‌شده، تاریخ، یا بینش‌ها..."
                className="w-full pr-9 pl-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Filter by Grade */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>گرید:</span>
              </span>
              {['all', 'A+', 'A', 'B', 'C'].map((gr) => (
                <button
                  key={gr}
                  type="button"
                  onClick={() => setSelectedGradeFilter(gr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedGradeFilter === gr
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {gr === 'all' ? 'همه' : gr}
                </button>
              ))}
            </div>

            {/* Export / Import Database Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                title="خروجی جدول اکسل"
              >
                <Download className="w-3.5 h-3.5" />
                <span>اکسل / CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                title="پشتیبان‌گیری کامل پایگاه داده"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی JSON</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>بازیابی</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* List of Cards */}
          {filteredCards.length === 0 ? (
            <div className="p-10 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-sm font-bold text-slate-700">هنوز کارنامه‌ای در دیتابیس ثبت نشده است</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                هر شب در پایان کارهای روزانه، با زدن دکمه «کارنامه روز» در هدر، نتایج و دستاوردهای
                روزت را ممیزی و ذخیره کن تا در این دیتابیس ماندگار بماند.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDailyReportForDay('sat');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>ثبت اولین کارنامه روزانه</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCards.map((card) => {
                const dayObj = DAYS.find((d) => d.id === card.dayKey);
                const scoreColor =
                  card.disciplineScore >= 80
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    : card.disciplineScore >= 60
                    ? 'text-amber-600 bg-amber-50 border-amber-200'
                    : 'text-rose-600 bg-rose-50 border-rose-200';

                return (
                  <div
                    key={card.id || card.date}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div>
                      {/* Card Header: Day, Date, Score */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-sm font-black text-slate-900">
                            {dayObj?.nameFa || card.dayKey}
                          </span>
                          <span className="text-xs font-mono text-slate-500">{card.date}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${scoreColor}`}
                          >
                            {toFaDigits(card.disciplineScore)}٪
                          </span>
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                            {card.grade}
                          </span>
                        </div>
                      </div>

                      {/* Metrics Summary */}
                      <div className="grid grid-cols-3 gap-2 my-2.5 text-center text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-500">کار عمیق</div>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {toFaDigits(card.deepWorkHours)} ساعت
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-500">تسک‌ها</div>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {toFaDigits(card.completedTasksCount)} از {toFaDigits(card.totalTasksCount)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-500">زمان خالص</div>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {toFaDigits(Math.round(card.totalActualMinutes / 60))} ساعت
                          </div>
                        </div>
                      </div>

                      {/* Insights or lessons */}
                      {card.lessonsLearned && (
                        <p className="text-xs text-slate-600 line-clamp-2 bg-amber-50/50 p-2 rounded-xl border border-amber-100/60 font-medium">
                          💡 {card.lessonsLearned}
                        </p>
                      )}
                      {!card.lessonsLearned && card.insights && card.insights.length > 0 && (
                        <p className="text-xs text-slate-600 line-clamp-2 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/60 font-medium">
                          ✨ {card.insights[0]}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedCardDetail(card)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>مشاهده جزئیات کارنامه</span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenDailyReportForDay(card.dayKey);
                          }}
                          className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                          title="باز کردن در مدال کارنامه"
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id || card.date)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="حذف از دیتابیس"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal for Details of a specific card */}
          {selectedCardDetail && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-xl border border-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <span>کارنامه کامل روز</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        نمره: {toFaDigits(selectedCardDetail.disciplineScore)}٪
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selectedCardDetail.date} ({DAYS.find((d) => d.id === selectedCardDetail.dayKey)?.nameFa})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCardDetail(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">اقلام ممیزی‌شده:</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedCardDetail.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-800">{item.title}</span>
                        <span className="text-slate-500 font-mono">
                          {toFaDigits(item.actualMinutes)} دقیقه ({item.focusQuality === 'deep' ? 'عمیق' : 'عادی'})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCardDetail.insights && selectedCardDetail.insights.length > 0 && (
                  <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                    <span className="text-xs font-bold text-indigo-950">بینش‌های ضدشکنندگی روز:</span>
                    <ul className="text-xs text-indigo-900 space-y-1 pr-3 list-disc">
                      {selectedCardDetail.insights.map((ins, i) => (
                        <li key={i}>{ins}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCardDetail(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer"
                  >
                    بستن جزئیات
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            پایگاه داده به صورت همزمان در حافظه محلی و IndexedDB پایدار نگه داشته می‌شود.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
