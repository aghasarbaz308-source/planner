import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Upload,
  Sparkles,
  Code2,
  FileJson,
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { TimeBlock, BlockTemplate, DayKey } from '../types';
import { buildAiPlannerJson, AiPlannerExport } from '../utils/aiJsonHelper';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannerTitle: string;
  weekRange: string;
  blocks: TimeBlock[];
  templates: BlockTemplate[];
  onApplyJsonState: (newState: {
    title?: string;
    weekRange?: string;
    blocks: TimeBlock[];
    templates?: BlockTemplate[];
  }) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({
  isOpen,
  onClose,
  plannerTitle,
  weekRange,
  blocks,
  templates,
  onApplyJsonState,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'editor' | 'file'>('ai');
  const [selectedPromptType, setSelectedPromptType] = useState<'audit' | 'briefing' | 'shift'>('audit');
  const [copiedAi, setCopiedAi] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedPromptOnly, setCopiedPromptOnly] = useState(false);

  // Editor state
  const [editorText, setEditorText] = useState<string>('');
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorSuccess, setEditorSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate the AI JSON structure
  const aiJson = useMemo(() => {
    return buildAiPlannerJson(plannerTitle, weekRange, blocks, templates);
  }, [plannerTitle, weekRange, blocks, templates]);

  const prettyJsonString = useMemo(() => {
    return JSON.stringify(aiJson, null, 2);
  }, [aiJson]);

  // Sync editor with current state on open or tab change
  React.useEffect(() => {
    if (isOpen) {
      setEditorText(prettyJsonString);
      setEditorError(null);
      setEditorSuccess(null);
    }
  }, [isOpen, prettyJsonString]);

  if (!isOpen) return null;

  // Selected prompt string
  const currentPromptText =
    selectedPromptType === 'audit'
      ? aiJson.ai_assistant_prompts.prompt_for_schedule_audit
      : selectedPromptType === 'briefing'
      ? aiJson.ai_assistant_prompts.prompt_for_daily_briefing
      : aiJson.ai_assistant_prompts.prompt_for_late_shift_rebalance;

  // Copy complete AI Prompt + JSON payload
  const handleCopyAiBundle = async () => {
    const fullPayload = `System Instructions:
${aiJson.ai_assistant_prompts.system_instruction}

Task / User Request:
${currentPromptText}

Weekly Schedule & Cognitive Profile (JSON):
\`\`\`json
${prettyJsonString}
\`\`\``;

    try {
      await navigator.clipboard.writeText(fullPayload);
      setCopiedAi(true);
      onShowToast('پرامپت کامل + ساختار حرفه‌ای JSON برای هوش مصنوعی کپی شد!');
      setTimeout(() => setCopiedAi(false), 2500);
    } catch (err) {
      onShowToast('خطا در کپی کلیپ‌بورد', 'warn');
    }
  };

  // Copy raw JSON only
  const handleCopyRawJson = async () => {
    try {
      await navigator.clipboard.writeText(prettyJsonString);
      setCopiedRaw(true);
      onShowToast('داده‌های خام JSON در کلیپ‌بورد کپی شد.');
      setTimeout(() => setCopiedRaw(false), 2500);
    } catch (err) {
      onShowToast('خطا در کپی کلیپ‌بورد', 'warn');
    }
  };

  // Copy Prompt Only
  const handleCopyPromptOnly = async () => {
    try {
      await navigator.clipboard.writeText(currentPromptText);
      setCopiedPromptOnly(true);
      onShowToast('متن پرامپت اختصاصی کپی شد.');
      setTimeout(() => setCopiedPromptOnly(false), 2500);
    } catch (err) {
      onShowToast('خطا در کپی کلیپ‌بورد', 'warn');
    }
  };

  // Validate and apply edited JSON to live application
  const handleApplyEditor = () => {
    setEditorError(null);
    setEditorSuccess(null);
    try {
      const parsed = JSON.parse(editorText);

      // Support either AI-v2 schema or traditional flat schema
      let newBlocks: TimeBlock[] = [];
      let newTitle = plannerTitle;
      let newWeekRange = weekRange;
      let newTemplates = templates;

      if (parsed.raw_blocks && Array.isArray(parsed.raw_blocks)) {
        newBlocks = parsed.raw_blocks;
      } else if (parsed.blocks && Array.isArray(parsed.blocks)) {
        newBlocks = parsed.blocks;
      } else {
        throw new Error('فیلد blocks یا raw_blocks در ساختار JSON یافت نشد.');
      }

      if (parsed.planner_profile?.title) newTitle = parsed.planner_profile.title;
      else if (parsed.title) newTitle = parsed.title;

      if (parsed.planner_profile?.week_focus_sprint)
        newWeekRange = parsed.planner_profile.week_focus_sprint;
      else if (parsed.weekRange) newWeekRange = parsed.weekRange;

      if (parsed.templates_bank && Array.isArray(parsed.templates_bank)) {
        newTemplates = parsed.templates_bank.map((t: any) => ({
          id: t.id || `tmpl-${Math.random().toString(36).substr(2, 6)}`,
          title: t.title || 'الگو',
          subtitle: t.subtitle || '',
          category: t.category || 'work',
          defaultDuration: t.default_duration_minutes || t.defaultDuration || 60,
          description: t.description || '',
        }));
      } else if (parsed.customTemplates && Array.isArray(parsed.customTemplates)) {
        newTemplates = parsed.customTemplates;
      }

      onApplyJsonState({
        title: newTitle,
        weekRange: newWeekRange,
        blocks: newBlocks,
        templates: newTemplates,
      });

      setEditorSuccess('تغییرات با موفقیت تأیید و در تمام بخش‌های برنامه‌ریز اعمال شد!');
      onShowToast('اطلاعات با موفقیت از ویرایشگر JSON به‌روزرسانی شد.');
    } catch (err: any) {
      setEditorError(`خطا در اعتبارسنجی ساختار JSON: ${err.message}`);
    }
  };

  // Format / Beautify editor JSON
  const handleBeautify = () => {
    try {
      const parsed = JSON.parse(editorText);
      setEditorText(JSON.stringify(parsed, null, 2));
      setEditorError(null);
      setEditorSuccess('کد JSON با موفقیت مرتب و استاندارد شد.');
    } catch (err: any) {
      setEditorError(`نمی‌توان فرمت کرد، ساختار نامعتبر است: ${err.message}`);
    }
  };

  // Download .json file
  const handleDownloadFile = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(prettyJsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `anti-fragile-planner-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('فایل استاندارد JSON دانلود شد.');
  };

  // File upload from disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        setEditorText(JSON.stringify(parsed, null, 2));
        setActiveTab('editor');
        onShowToast('فایل با موفقیت بارگذاری شد؛ برای اعمال روی دکمه ذخیره کلیک کنید.', 'info');
      } catch (err) {
        onShowToast('خطا در خواندن فایل JSON', 'warn');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs no-print animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-white">
                  معماری و پایگاه داده JSON (هوش مصنوعی و تنظیمات کامل)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 font-mono">
                  Schema v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                طراحی‌شده جهت تعامل پیشرفته با هوش مصنوعی (Gemini / ChatGPT / Claude) و ویرایش کامل داده‌ها
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-slate-50/80">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>پرامپت و داده‌های هوش مصنوعی (AI Prompt)</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>ویرایشگر زنده و اعتبارسنجی (Live Editor)</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileJson className="w-4 h-4 text-sky-600" />
            <span>دانلود و بارگذاری فایل (Import/Export)</span>
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/30">
          {/* TAB 1: AI Prompt & Structured Context */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {/* Guidance Banner */}
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    چگونه برنامه خود را به دستیار هوش مصنوعی (Gemini, Claude, ChatGPT) بدهید؟
                  </p>
                  <p className="leading-relaxed text-slate-600">
                    این ساختار JSON شامل تمام متدولوژی‌های ضد شکنندگی، فازهای بیولوژیکی انرژی، تقسیم‌بندی شناختی تسک‌ها، و جدول زمانی روزهاست. با زدن دکمه زیر، هوش مصنوعی بلافاصله کل ریتم کاری، نقاط خستگی، و راهکارهای بهینه‌سازی را بدون نیاز به توضیحات اضافی درک خواهد کرد.
                  </p>
                </div>
              </div>

              {/* Prompt Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  انتخاب نوع مأموریت هوش مصنوعی:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPromptType('audit')}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedPromptType === 'audit'
                        ? 'border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-200 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <span>🔍 ممیزی بار شناختی و ریکاوری</span>
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-2">
                      بررسی تعادل ساعات کار عمیق و جلوگیری از فرسودگی ذهنی
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPromptType('briefing')}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedPromptType === 'briefing'
                        ? 'border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-200 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <span>📋 خلاصه اجرایی و انگیزه روزانه</span>
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-2">
                      برنامه اقدام فازهای شبانه‌روز و اولویت اصلی روز
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPromptType('shift')}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedPromptType === 'shift'
                        ? 'border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-200 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <span>⚡ بازتنظیم در صورت تاخیر یا خواب</span>
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-2">
                      فشرده‌سازی هوشمند تسک‌ها بدون ایجاد حس گناه یا رها کردن روز
                    </span>
                  </button>
                </div>
              </div>

              {/* Prompt Text Box */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    دستور آماده (Prompt) تزریق‌شده به داده‌ها:
                  </span>
                  <button
                    onClick={handleCopyPromptOnly}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPromptOnly ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPromptOnly ? 'کپی شد!' : 'کپی فقط پرامپت'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-left" dir="ltr">
                  {currentPromptText}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleCopyAiBundle}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {copiedAi ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAi ? 'کپی شد! (آماده جای‌گذاری در چت هوش مصنوعی)' : 'کپی پرامپت + ساختار کامل JSON'}</span>
                </button>

                <button
                  onClick={handleCopyRawJson}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  {copiedRaw ? <Check className="w-4 h-4 text-emerald-600" /> : <Code2 className="w-4 h-4" />}
                  <span>کپی فقط داده‌های خالص JSON</span>
                </button>

                <button
                  onClick={handleDownloadFile}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>دانلود فایل JSON</span>
                </button>
              </div>

              {/* JSON Live Code Preview */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  پیش‌نمایش داده‌های تولیدشده (فقط‌خواندنی):
                </span>
                <pre
                  dir="ltr"
                  className="p-3.5 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl max-h-60 overflow-y-auto border border-slate-800 selection:bg-indigo-600"
                >
                  {prettyJsonString}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: Live JSON Editor & Live Schema Configuration */}
          {activeTab === 'editor' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  ویرایشگر مستقیم داده‌های برنامه (کدهای JSON را مستقیماً اصلاح و ذخیره کنید):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBeautify}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    مرتب‌سازی (Format)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorText(prettyJsonString)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    بازنشانی از برنامه فعلی
                  </button>
                </div>
              </div>

              {/* Error or Success notification */}
              {editorError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editorError}</span>
                </div>
              )}
              {editorSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{editorSuccess}</span>
                </div>
              )}

              {/* Textarea */}
              <div className="relative">
                <textarea
                  dir="ltr"
                  value={editorText}
                  onChange={(e) => {
                    setEditorText(e.target.value);
                    if (editorError) setEditorError(null);
                  }}
                  rows={16}
                  className="w-full p-3 font-mono text-xs text-slate-100 bg-slate-900 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-hidden selection:bg-indigo-600 leading-relaxed resize-y"
                  placeholder="کد JSON را در اینجا وارد یا ویرایش نمایید..."
                />
              </div>

              {/* Action */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleApplyEditor}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>اعمال تغییرات روی برنامه</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: File Import / Export */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">
                      دانلود نسخه پشتیبان کامل (Export JSON)
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      تمامی بلوک‌های برنامه‌ریزی‌شده، الگوهای سفارشی، عناوین و تنظیمات هفتگی در یک فایل رسمی ذخیره می‌شوند.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadFile}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>دانلود فایل JSON</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">
                      بارگذاری فایل JSON (Import JSON)
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      فایل‌های ذخیره‌شده قبلی را آپلود کنید تا بلافاصله در ویرایشگر بررسی و روی جدول بارگذاری شوند.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json,application/json"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>انتخاب فایل از سیستم</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
