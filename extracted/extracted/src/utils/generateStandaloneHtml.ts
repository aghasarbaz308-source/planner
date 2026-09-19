import { TimeBlock, BlockTemplate } from '../types';

interface GenerateHtmlParams {
  plannerTitle: string;
  weekRange: string;
  blocks: TimeBlock[];
  templates: BlockTemplate[];
}

export function generateStandaloneHtml({
  plannerTitle,
  weekRange,
  blocks,
  templates,
}: GenerateHtmlParams): string {
  const serializedState = JSON.stringify({
    title: plannerTitle,
    weekRange,
    blocks,
    templates,
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(plannerTitle)} - نسخه آفلاین و اجرایی</title>
  
  <!-- Tailwind CSS & Persian Vazirmatn & Vazirmatn-RD Rounded Font CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-RD-font-face.css" rel="stylesheet" type="text/css" />

  <!-- React 18 & Babel Standalone for Instant Native PC Execution -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    * {
      font-family: 'Vazirmatn RD', 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-feature-settings: 'ss01' 1, 'cv01' 1, 'kern' 1, 'liga' 1, 'tnum' 1 !important;
      letter-spacing: 0px !important;
      -webkit-font-smoothing: antialiased !important;
    }
    .font-mono {
      font-family: 'Vazirmatn RD', 'Vazirmatn', monospace !important;
      font-feature-settings: 'ss01' 1, 'tnum' 1 !important;
    }
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; padding: 0 !important; }
      @page { size: A4 landscape; margin: 5mm; }
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  </style>
</head>
<body class="bg-slate-100/70 text-slate-900 min-h-screen">
  <div id="root"></div>

  <script id="initial-planner-data" type="application/json">
    ${serializedState}
  </script>

  <script type="text/babel">
    const { useState, useEffect, useMemo, useRef } = React;

    // Constants & Configurations
    const DAYS = [
      { id: 'sat', nameFa: 'شنبه', nameEn: 'Saturday', mood: 'شروع قدرتمند و تمرکز عمیق', dotColor: '#3b82f6' },
      { id: 'sun', nameFa: 'یکشنبه', nameEn: 'Sunday', mood: 'تثبیت تسک‌های سنگین فنی', dotColor: '#6366f1' },
      { id: 'mon', nameFa: 'دوشنبه', nameEn: 'Monday', mood: 'تعادل دانشگاه و پروژه‌های اصلی', dotColor: '#8b5cf6' },
      { id: 'tue', nameFa: 'سه‌شنبه', nameEn: 'Tuesday', mood: 'اسپرینت کدنویسی و دیباگ', dotColor: '#0ea5e9' },
      { id: 'wed', nameFa: 'چهارشنبه', nameEn: 'Wednesday', mood: 'جمع‌بندی و تحویل مایلستون‌ها', dotColor: '#10b981' },
      { id: 'thu', nameFa: 'پنج‌شنبه', nameEn: 'Thursday', mood: 'مرور هفتگی و مطالعه آزاد', dotColor: '#f59e0b' },
      { id: 'fri', nameFa: 'جمعه', nameEn: 'Friday', mood: 'ریکاوری کامل و بازیابی انرژی', dotColor: '#ec4899' },
    ];

    const START_HOUR = 7;
    const END_HOUR = 24;
    const SLOT_INTERVAL = 30;
    const SLOT_HEIGHT_PX = 32;

    const CATEGORIES = {
      pytorch: { label: 'یادگیری عمیق (PyTorch)', bgClass: 'bg-rose-50', borderClass: 'border-rose-300', textClass: 'text-rose-950', dotColor: '#e11d48' },
      work: { label: 'پروژه و کار عمیق (Deep Work)', bgClass: 'bg-blue-50', borderClass: 'border-blue-300', textClass: 'text-blue-950', dotColor: '#2563eb' },
      python: { label: 'پایتون و نرم‌افزار', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-300', textClass: 'text-emerald-950', dotColor: '#059669' },
      uni: { label: 'دانشگاه و آموزش', bgClass: 'bg-purple-50', borderClass: 'border-purple-300', textClass: 'text-purple-950', dotColor: '#7c3aed' },
      recovery: { label: 'ریکاوری و استراحت', bgClass: 'bg-teal-50', borderClass: 'border-teal-300', textClass: 'text-teal-950', dotColor: '#0d9488' },
      gaming: { label: 'گیمینگ و تفریح', bgClass: 'bg-amber-50', borderClass: 'border-amber-300', textClass: 'text-amber-950', dotColor: '#d97706' },
      daily: { label: 'کارهای روتین و اداری', bgClass: 'bg-slate-50', borderClass: 'border-slate-300', textClass: 'text-slate-950', dotColor: '#475569' },
      custom: { label: 'سفارشی', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-300', textClass: 'text-indigo-950', dotColor: '#4f46e5' },
    };

    function toFaDigits(num) {
      if (num === undefined || num === null) return '';
      const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return String(num).replace(/[0-9]/g, (w) => fa[Number(w)]);
    }

    function minutesToTimeString(m) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
    }

    function formatDurationFa(mins) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0 && m > 0) return toFaDigits(h) + ' ساعت و ' + toFaDigits(m) + ' دقیقه';
      if (h > 0) return toFaDigits(h) + ' ساعت';
      return toFaDigits(m) + ' دقیقه';
    }

    // App Main Component
    function App() {
      const initialRaw = document.getElementById('initial-planner-data')?.textContent;
      const initialData = initialRaw ? JSON.parse(initialRaw) : {};

      const [plannerTitle, setPlannerTitle] = useState(() => localStorage.getItem('local_planner_title') || initialData.title || 'برنامه‌ریز هفتگی تایم‌باکسینگ');
      const [weekRange, setWeekRange] = useState(() => localStorage.getItem('local_planner_range') || initialData.weekRange || 'اسپرینت لینوکس و یادگیری عمیق');
      const [blocks, setBlocks] = useState(() => {
        const saved = localStorage.getItem('local_planner_blocks');
        return saved ? JSON.parse(saved) : (initialData.blocks || []);
      });
      const [templates, setTemplates] = useState(() => {
        const saved = localStorage.getItem('local_planner_templates');
        return saved ? JSON.parse(saved) : (initialData.templates || []);
      });

      const [selectedBlock, setSelectedBlock] = useState(null);
      const [editingTemplate, setEditingTemplate] = useState(null);
      const [showDailyReport, setShowDailyReport] = useState(false);
      const [reportDay, setReportDay] = useState('sat');
      const [toastMessage, setToastMessage] = useState('');

      const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
      };

      // Auto-save to PC LocalStorage
      useEffect(() => {
        localStorage.setItem('local_planner_title', plannerTitle);
        localStorage.setItem('local_planner_range', weekRange);
        localStorage.setItem('local_planner_blocks', JSON.stringify(blocks));
        localStorage.setItem('local_planner_templates', JSON.stringify(templates));
      }, [plannerTitle, weekRange, blocks, templates]);

      // Move Block
      const handleMoveBlock = (blockId, targetDay, targetMinutes) => {
        setBlocks(prev => prev.map(b => {
          if (b.id !== blockId) return b;
          const maxAvail = END_HOUR * 60 - targetMinutes;
          return {
            ...b,
            day: targetDay,
            startMinutes: targetMinutes,
            durationMinutes: Math.min(b.durationMinutes, Math.max(30, maxAvail))
          };
        }));
        showToast('زمان بلوک تغییر یافت.');
      };

      // Update Block (Handles both edit and creation of new blocks)
      const handleUpdateBlock = (updated, updateMatching = false) => {
        setBlocks(prev => {
          const exists = prev.some(b => b.id === updated.id);
          if (!exists) {
            return [...prev, updated];
          }
          if (updateMatching) {
            const old = prev.find(b => b.id === updated.id);
            const oldTitle = old ? old.title : updated.title;
            return prev.map(b => {
              if (b.id === updated.id) return updated;
              if (b.title === oldTitle) {
                return { ...b, title: updated.title, subtitle: updated.subtitle, category: updated.category, note: updated.note };
              }
              return b;
            });
          }
          return prev.map(b => b.id === updated.id ? updated : b);
        });
        showToast('تغییرات با موفقیت ذخیره شد.');
      };

      // Delete Block
      const handleDeleteBlock = (id) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        showToast('بلوک حذف شد.');
      };

      // Late Shift
      const handleLateShift = () => {
        const shiftAmount = 60; // 1 hour shift
        const curDayName = DAYS.find(d => d.id === reportDay)?.nameFa || 'امروز';
        const confirmShift = confirm('آیا می‌خواهید برنامه‌های باز ' + curDayName + ' را ۱ ساعت به جلو شیفت دهید؟ (اصل ۱ بزرگ‌تر از ۰ است)');
        if (confirmShift) {
          setBlocks(prev => prev.map(b => {
            if (b.day === reportDay && !b.completed) {
              const newStart = b.startMinutes + shiftAmount;
              if (newStart < END_HOUR * 60) {
                return { ...b, startMinutes: newStart };
              }
            }
            return b;
          }));
          showToast('برنامه‌های ' + curDayName + ' با موفقیت شیفت داده شد!');
        }
      };

      // Export JSON
      const handleExportJson = () => {
        const data = { title: plannerTitle, weekRange, blocks, templates, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timeboxing-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('فایل پشتیبان JSON دانلود شد.');
      };

      // Print
      const handlePrint = () => {
        window.print();
      };

      return (
        <div className="flex flex-col min-h-screen">
          {/* Top Offline Header */}
          <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs no-print">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  ⏱️
                </div>
                <div>
                  <input
                    type="text"
                    value={plannerTitle}
                    onChange={(e) => setPlannerTitle(e.target.value)}
                    className="font-black text-sm sm:text-base text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-slate-50 px-1 py-0.5 rounded outline-none"
                  />
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-emerald-700 font-bold">● نسخه آفلاین محلی (کامپیوتر شخصی)</span>
                    <span>•</span>
                    <input
                      type="text"
                      value={weekRange}
                      onChange={(e) => setWeekRange(e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 px-1 text-slate-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleLateShift}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                  title="شیفت برنامه در صورت بیدار شدن دیرتر"
                >
                  <span>🤝 شیفت ضداضطراب (Late Shift)</span>
                </button>

                <button
                  onClick={() => setShowDailyReport(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>📋 گزارش روزانه</span>
                </button>

                <button
                  onClick={handleExportJson}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>💾 ذخیره JSON</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>🖨️ چاپ A4 / PDF</span>
                </button>
              </div>
            </div>
          </header>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
              <span>✓</span>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Main Layout: Sidebar + Canvas */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Sidebar Templates */}
            <aside className="w-full lg:w-72 bg-white border-l border-slate-200 p-3.5 space-y-3 no-print overflow-y-auto max-h-[85vh] lg:max-h-none">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-extrabold text-xs text-slate-800">بانک الگوهای زمانی</span>
                <span className="text-[10px] text-slate-500 font-mono">{toFaDigits(templates.length)} الگو</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                الگوها را بگیرید و روی روزهای هفته بکشید، یا مستقیماً روی هر بلوک جدول کلیک کنید تا آن را ویرایش نمایید.
              </p>
              <div className="space-y-2">
                {templates.map(tmpl => {
                  const cat = CATEGORIES[tmpl.category] || CATEGORIES.custom;
                  return (
                    <div
                      key={tmpl.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/template-data', JSON.stringify(tmpl));
                      }}
                      className={"p-2.5 rounded-xl border " + cat.bgClass + " " + cat.borderClass + " cursor-grab active:cursor-grabbing hover:shadow-sm transition-all"}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{tmpl.title}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-white rounded border text-slate-700">
                          {formatDurationFa(tmpl.defaultDuration)}
                        </span>
                      </div>
                      {tmpl.subtitle && (
                        <p className="text-[10px] text-slate-600 mt-1">{tmpl.subtitle}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Time Grid Canvas */}
            <main className="flex-1 bg-white overflow-auto p-2 sm:p-4">
              <div className="min-w-[700px]">
                {/* 7 Days Header */}
                <div className="grid grid-cols-7 gap-2 mb-2 pb-2 border-b border-slate-200">
                  {DAYS.map(d => {
                    const dayBlocks = blocks.filter(b => b.day === d.id);
                    return (
                      <div key={d.id} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.dotColor }}></span>
                          <span className="font-black text-xs text-slate-800">{d.nameFa}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                          {toFaDigits(dayBlocks.length)} بلوک
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Grid Columns */}
                <div className="grid grid-cols-7 gap-2 relative min-h-[650px] bg-slate-50/50 rounded-xl p-2 border border-slate-200">
                  {DAYS.map(day => {
                    const dayBlocks = blocks.filter(b => b.day === day.id);
                    return (
                      <div
                        key={day.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const rawTmpl = e.dataTransfer.getData('text/template-data');
                          const moveId = e.dataTransfer.getData('text/move-id');
                          if (moveId) {
                            handleMoveBlock(moveId, day.id, 9 * 60);
                            return;
                          }
                          if (rawTmpl) {
                            try {
                              const tmpl = JSON.parse(rawTmpl);
                              const newB = {
                                id: 'block-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                                day: day.id,
                                startMinutes: 9 * 60,
                                durationMinutes: tmpl.defaultDuration,
                                title: tmpl.title,
                                subtitle: tmpl.subtitle,
                                category: tmpl.category,
                                note: tmpl.description,
                                completed: false
                              };
                              setBlocks(prev => [...prev, newB]);
                              showToast('بلوک به ' + day.nameFa + ' اضافه شد.');
                            } catch (err) {}
                          }
                        }}
                        className="flex flex-col gap-2 min-h-[500px] bg-white rounded-lg p-1.5 border border-slate-200/80"
                      >
                        {dayBlocks.map(block => {
                          const cat = CATEGORIES[block.category] || CATEGORIES.custom;
                          const startStr = minutesToTimeString(block.startMinutes);
                          const endStr = minutesToTimeString(block.startMinutes + block.durationMinutes);
                          const timeRange = toFaDigits(startStr) + ' - ' + toFaDigits(endStr);
                          return (
                            <div
                              key={block.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/move-id', block.id);
                              }}
                              onClick={() => setSelectedBlock(block)}
                              className={"p-2 rounded-xl border " + cat.bgClass + " " + cat.borderClass + " cursor-pointer shadow-2xs hover:shadow-md transition-all relative group"}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className={"font-black text-xs leading-snug " + (block.completed ? 'line-through text-slate-400' : 'text-slate-900')}>
                                  {block.title}
                                </span>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 shrink-0">
                                  {timeRange}
                                </span>
                              </div>
                              {block.subtitle && (
                                <p className="text-[10px] text-slate-600 mt-1 truncate">{block.subtitle}</p>
                              )}
                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 text-[9px]">
                                <span className="font-mono text-slate-500 font-bold">{formatDurationFa(block.durationMinutes)}</span>
                                <span className={"font-bold px-1.5 py-0.5 rounded " + (block.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
                                  {block.completed ? 'انجام شد' : 'در انتظار'}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Block to Column Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const newB = {
                              id: 'block-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                              day: day.id,
                              startMinutes: 9 * 60,
                              durationMinutes: 60,
                              title: 'فعالیت جدید',
                              subtitle: '',
                              category: 'work',
                              note: '',
                              completed: false
                            };
                            setSelectedBlock(newB);
                          }}
                          className="mt-auto w-full py-1.5 px-2 text-[11px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>+</span>
                          <span>افزودن فعالیت</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </main>
          </div>

          {/* Edit Block Modal */}
          {selectedBlock && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-black text-sm text-slate-900">
                    {blocks.some(b => b.id === selectedBlock.id) ? 'ویرایش بلوک زمانی' : 'افزودن بلوک زمانی جدید'}
                  </h3>
                  <button onClick={() => setSelectedBlock(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">عنوان فعالیت</label>
                  <input
                    type="text"
                    value={selectedBlock.title}
                    onChange={(e) => setSelectedBlock({ ...selectedBlock, title: e.target.value })}
                    className="w-full p-2 text-xs border rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">برچسب تمرکز / زیرعنوان</label>
                  <input
                    type="text"
                    value={selectedBlock.subtitle || ''}
                    onChange={(e) => setSelectedBlock({ ...selectedBlock, subtitle: e.target.value })}
                    className="w-full p-2 text-xs border rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">روز</label>
                    <select
                      value={selectedBlock.day}
                      onChange={(e) => setSelectedBlock({ ...selectedBlock, day: e.target.value })}
                      className="w-full p-2 text-xs border rounded-xl bg-white"
                    >
                      {DAYS.map(d => <option key={d.id} value={d.id}>{d.nameFa}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">مدت زمان (دقیقه)</label>
                    <input
                      type="number"
                      step="15"
                      min="15"
                      value={selectedBlock.durationMinutes}
                      onChange={(e) => setSelectedBlock({ ...selectedBlock, durationMinutes: Number(e.target.value) })}
                      className="w-full p-2 text-xs border rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border">
                  <input
                    type="checkbox"
                    id="compl-check"
                    checked={selectedBlock.completed}
                    onChange={(e) => setSelectedBlock({ ...selectedBlock, completed: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <label htmlFor="compl-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                    علامت‌گذاری به عنوان انجام شده
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  {blocks.some(b => b.id === selectedBlock.id) ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteBlock(selectedBlock.id);
                        setSelectedBlock(null);
                      }}
                      className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg"
                    >
                      حذف بلوک
                    </button>
                  ) : <div />}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBlock(null)}
                      className="text-xs font-semibold text-slate-600 px-3 py-1.5 rounded-lg"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateBlock(selectedBlock);
                        setSelectedBlock(null);
                      }}
                      className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-xs"
                    >
                      ذخیره تغییرات
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Report Modal */}
          {showDailyReport && (() => {
            const curDayObj = DAYS.find(d => d.id === reportDay) || DAYS[0];
            const dayBlocks = blocks
              .filter(b => b.day === reportDay)
              .sort((a, b) => a.startMinutes - b.startMinutes);

            const totalMins = dayBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
            const totalHours = (totalMins / 60).toFixed(1);
            const deepWorkMins = dayBlocks
              .filter(b => b.category === 'work' || b.category === 'pytorch' || b.category === 'python')
              .reduce((acc, b) => acc + b.durationMinutes, 0);
            const deepWorkHours = (deepWorkMins / 60).toFixed(1);
            const completedCount = dayBlocks.filter(b => b.completed).length;

            const textSummary = [
              '🎯 گزارش روزانه: ' + curDayObj.nameFa + ' (' + curDayObj.mood + ')',
              '━━━━━━━━━━━━━━━━━━━━━━━━━',
              '⏱ مجموع زمان: ' + toFaDigits(totalHours) + ' ساعت | تمرکز عمیق: ' + toFaDigits(deepWorkHours) + ' ساعت',
              '📊 انجام شده: ' + toFaDigits(completedCount) + ' از ' + toFaDigits(dayBlocks.length) + ' فعالیت',
              '',
              '📍 جدول زمان‌بندی:',
              ...dayBlocks.map(b => {
                const s = minutesToTimeString(b.startMinutes);
                const e = minutesToTimeString(b.startMinutes + b.durationMinutes);
                const status = b.completed ? '✅' : '▫️';
                return status + ' ' + toFaDigits(s) + ' - ' + toFaDigits(e) + ' | ' + b.title + (b.subtitle ? ' (' + b.subtitle + ')' : '');
              }),
              '',
              '💡 اصل ضداضطراب: ۱ همیشه بزرگ‌تر از ۰ است.'
            ].join('\\n');

            return (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-5 space-y-4 max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b pb-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        📋
                      </div>
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-slate-900">گزارش و نقشه اجرایی روزانه</h3>
                        <p className="text-[11px] text-slate-500">انتخاب روز، مشاهده پیشرفت و کپی متن شکیل</p>
                      </div>
                    </div>
                    <button onClick={() => setShowDailyReport(false)} className="text-slate-400 hover:text-slate-600 p-1 text-base">✕</button>
                  </div>

                  {/* Day Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
                    {DAYS.map(d => {
                      const count = blocks.filter(b => b.day === d.id).length;
                      const isActive = reportDay === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setReportDay(d.id)}
                          className={"px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer " + 
                            (isActive ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.dotColor }}></span>
                          <span>{d.nameFa}</span>
                          <span className={"text-[10px] px-1 rounded-sm " + (isActive ? 'bg-white/20' : 'bg-slate-200 text-slate-600')}>
                            {toFaDigits(count)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Day Metrics */}
                  <div className="grid grid-cols-3 gap-2 shrink-0">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">کل ساعات</span>
                      <strong className="text-sm font-black text-slate-900">{toFaDigits(totalHours)} س</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                      <span className="text-[10px] text-blue-700 block">کار عمیق</span>
                      <strong className="text-sm font-black text-blue-950">{toFaDigits(deepWorkHours)} س</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-[10px] text-emerald-700 block">وضعیت اجرا</span>
                      <strong className="text-sm font-black text-emerald-950">{toFaDigits(completedCount)} / {toFaDigits(dayBlocks.length)}</strong>
                    </div>
                  </div>

                  {/* Text Briefing Preview */}
                  <div className="flex-1 min-h-[140px] overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap select-all">
                    {textSummary}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(textSummary);
                        showToast('متن گزارش با موفقیت کپی شد.');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>📋 کپی متن گزارش روزانه</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDailyReport(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      بستن
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      );
    }

    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
