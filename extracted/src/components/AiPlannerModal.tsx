import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Key,
  Trash2,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Plus,
  AlertCircle,
  HelpCircle,
  Clock,
  Calendar,
  Layers,
  Zap,
  Check,
  ExternalLink,
  ShieldCheck,
  XCircle,
  Circle,
} from 'lucide-react';
import { TimeBlock, DayKey } from '../types';
import {
  DAYS,
  CATEGORIES,
  toFaDigits,
  minutesToTimeString,
  formatDurationFa,
} from '../constants/plannerConfig';
import {
  normalizeAction,
  parseLocalUserScheduleIntent,
  AiAction,
} from '../utils/aiActionNormalizer';

export type { AiAction };

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  actions?: AiAction[];
  actionsApplied?: boolean;
  isError?: boolean;
  failedPrompt?: string;
  isTemporary?: boolean;
}

interface AiPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimeBlock[];
  onApplyActions: (actions: AiAction[]) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warn') => void;
  currentDayKey?: DayKey;
}

const STORAGE_KEY_API_KEY = 'anti_fragile_gemini_api_key';
const STORAGE_KEY_CHAT_HISTORY = 'anti_fragile_ai_chat_history';

const PROMPT_TEMPLATES = [
  'یکشنبه ساعت ۱۵ تا ۱۷ برام کار عمیق برنامه‌نویسی بچین',
  'کل شنبه رو بر اساس ریتم شبانه‌روزی (انرژی بالا صبح، سبک عصر) برنامه‌ریزی کن',
  'سه‌شنبه ۲ ساعت وقت خالی بین تسک‌ها دارم، یک برنامه ورزش و استراحت بذار',
  'تعادل برنامه‌های این هفته من رو تحلیل کن و پیشنهاد بهبود بده',
];

export const AiPlannerModal: React.FC<AiPlannerModalProps> = ({
  isOpen,
  onClose,
  blocks,
  onApplyActions,
  onShowToast,
  currentDayKey = 'sat',
}) => {
  // API Key state
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  });
  const [showKeySettings, setShowKeySettings] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');

  // Chat memory state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT_HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [
      {
        id: 'welcome_msg',
        role: 'model',
        text: 'سلام! من دستیار هوشمند برنامه‌ریزی ضد شکننده شما هستم. می‌تونید به زبان محاوره‌ای بگید چه برنامه‌ای مد نظرتونه؛ مثلاً:\n«یکشنبه ساعت ۳ بعدازظهر ۲ ساعت کدنویسی عمیق برام بذار» یا «شنبه صبح رو با مطالعه و ورزش پر کن». من خودکار بهترین ریتم شبانه‌روزی رو براتون طراحی می‌کنم!',
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(1);
  const [loadingElapsed, setLoadingElapsed] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Live progress step advancement and seconds elapsed ticker
  useEffect(() => {
    let timer: any;
    if (isLoading) {
      setLoadingElapsed(0);
      setLoadingStep(1);
      timer = setInterval(() => {
        setLoadingElapsed((prev) => {
          const next = prev + 1;
          if (next >= 2 && next < 5) setLoadingStep(2);
          else if (next >= 5) setLoadingStep(3);
          return next;
        });
      }, 1000);
    } else {
      setLoadingElapsed(0);
      setLoadingStep(1);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // Immediate cancel handler to prevent token burning or waiting
  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    onShowToast('پردازش متوقف شد (صرفه‌جویی در مصرف API).', 'info');
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading, loadingStep]);

  // Persist messages to memory
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT_HISTORY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Save API Key handler
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim();
    if (!trimmed) {
      onShowToast('لطفاً کلید معتبر وارد کنید.', 'warn');
      return;
    }
    setApiKey(trimmed);
    localStorage.setItem(STORAGE_KEY_API_KEY, trimmed);
    setShowKeySettings(false);
    setInputKey('');
    onShowToast('کلید API جمینای با موفقیت ذخیره شد.', 'success');
  };

  // Remove API Key
  const handleRemoveApiKey = () => {
    setApiKey('');
    localStorage.removeItem(STORAGE_KEY_API_KEY);
    setShowKeySettings(false);
    onShowToast('کلید API از حافظه مرورگر پاک شد.', 'info');
  };

  // Clear Chat History
  const handleClearHistory = () => {
    const defaultMsg: ChatMessage = {
      id: 'welcome_reset',
      role: 'model',
      text: 'حافظه گفتگو پاک شد. هر زمان نیاز به چینش یا بهینه‌سازی برنامه داشتید، بفرمایید!',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([defaultMsg]);
    localStorage.removeItem(STORAGE_KEY_CHAT_HISTORY);
    onShowToast('تاریخچه گفتگو با موفقیت پاک شد.', 'info');
  };

  // Send Message to Gemini via server-side API
  const handleSendMessage = async (textToSend?: string) => {
    const userPrompt = (textToSend || inputMessage).trim();
    if (!userPrompt || isLoading) return;

    // Check if API key is configured (either in local state or assuming server env)
    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => {
      if (controller) controller.abort('TIMEOUT');
    }, 25000); // 25s auto-timeout to prevent token burning or hanging

    try {
      // Build history for context (exclude errors and limit size to avoid prompt poisoning)
      const historyPayload = messages
        .filter((m) => !m.isError && m.role !== 'system')
        .slice(-4)
        .map((m) => ({
          role: m.role,
          text: m.text.slice(0, 300),
        }));

      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey || '',
        },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          message: userPrompt,
          history: historyPayload,
          currentSchedule: blocks.slice(0, 35).map((b) => ({
            id: b.id,
            day: b.day,
            title: (b.title || '').slice(0, 30),
            subtitle: (b.subtitle || '').slice(0, 20),
            startMinutes: b.startMinutes,
            durationMinutes: b.durationMinutes,
            category: b.category,
            priority: b.priority,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'NO_API_KEY' || data.error === 'INVALID_API_KEY') {
          setShowKeySettings(true);
        }
        const customErr: any = new Error(data.message || 'خطا در ارتباط با سرور هوش مصنوعی');
        customErr.isTemporary = data.isTemporary || res.status === 503;
        customErr.errorCode = data.error;
        throw customErr;
      }

      // Robust extraction of reply and actions (prevent any raw JSON leaking)
      let cleanReply = data.reply || 'برنامه شما پردازش شد.';
      let rawActions = Array.isArray(data.actions) ? data.actions : [];

      if (typeof cleanReply === 'string' && cleanReply.trim().startsWith('{')) {
        try {
          const inner = JSON.parse(cleanReply);
          if (inner.reply) cleanReply = inner.reply;
          if (Array.isArray(inner.actions) && rawActions.length === 0) {
            rawActions = inner.actions;
          }
        } catch {
          const match = cleanReply.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          if (match && match[1]) {
            cleanReply = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          }
        }
      }

      // Normalize all actions to guarantee valid DayKey, timestamps, and taxonomy
      const fallbackDay: DayKey = (currentDayKey as DayKey) || 'sat';
      const extractedActions: AiAction[] = rawActions
        .map((a: any) => normalizeAction(a, fallbackDay, blocks))
        .filter((a): a is AiAction => a !== null);

      // If actions exist, auto-apply them directly to the schedule so the user sees results immediately
      let didAutoApply = false;
      if (extractedActions.length > 0) {
        try {
          onApplyActions(extractedActions);
          didAutoApply = true;
          onShowToast(
            `${toFaDigits(extractedActions.length)} تغییر پیشنهادی مستقیماً روی جدول اعمال شد.`,
            'success'
          );
        } catch (e) {
          console.error('Failed to auto-apply actions:', e);
        }
      }

      const botMsg: ChatMessage = {
        id: 'model_' + Date.now(),
        role: 'model',
        text: cleanReply,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        actions: extractedActions.length > 0 ? extractedActions : undefined,
        actionsApplied: didAutoApply,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        const isTimeout = controller.signal?.reason === 'TIMEOUT';
        const cancelMsg: ChatMessage = {
          id: 'abort_' + Date.now(),
          role: 'model',
          text: isTimeout
            ? '⏱️ زمان پردازش از ۲۵ ثانیه فراتر رفت. برای جلوگیری از اتلاف توکن و معطلی، عملیات متوقف شد. می‌توانید با بیان خلاصه‌تر درخواست مجدداً تلاش کنید.'
            : '🛑 پردازش به درخواست شما متوقف شد تا در زمان و سهمیه API صرفه‌جویی شود.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          isError: true,
          failedPrompt: userPrompt,
          isTemporary: true,
        };
        setMessages((prev) => [...prev, cancelMsg]);
        return;
      }

      // Offline / Resilient Local Scheduling Parser Fallback (Zero Regression & High Availability)
      const fallbackDay: DayKey = (currentDayKey as DayKey) || 'sat';
      const localIntent = parseLocalUserScheduleIntent(userPrompt, fallbackDay, blocks);
      if (localIntent && localIntent.actions.length > 0) {
        try {
          onApplyActions(localIntent.actions);
          const fallbackBotMsg: ChatMessage = {
            id: 'model_local_' + Date.now(),
            role: 'model',
            text: `${localIntent.reply}\n\n*(پردازش هوشمند بدون وقفه: به دلیل اختلال موقت شبکه هوش مصنوعی، ساختار زمان‌بندی شما مستقیماً توسط موتور تحلیلی محلی پردازش و روی جدول ثبت گردید)*`,
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            actions: localIntent.actions,
            actionsApplied: true,
          };
          setMessages((prev) => [...prev, fallbackBotMsg]);
          onShowToast('دستور با موفقیت به صورت محلی روی جدول اعمال شد.', 'success');
          return;
        } catch (localApplyErr) {
          console.error('Local intent apply failed:', localApplyErr);
        }
      }

      const isTemporary =
        err?.isTemporary ||
        err?.message?.includes('۵۰۳') ||
        err?.message?.includes('503') ||
        err?.message?.includes('تقاضا');

      const errMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        role: 'model',
        text: isTemporary
          ? `⚡ سرورهای هوش مصنوعی در این لحظه با تقاضای بالایی مواجه شده‌اند (کد ۵۰۳).\nاین حالت موقت است و معمولاً ظرف چند ثانیه برطرف می‌شود. با زدن دکمه زیر پیام شما مجدداً ارسال خواهد شد.`
          : `متأسفانه خطایی رخ داد: ${err.message || 'عدم دسترسی به سرویس جمینای'}.\nاگر کلید API وارد نکرده‌اید یا منقضی شده است، لطفاً از بخش «تنظیم کلید API» آن را ثبت کنید.`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        failedPrompt: userPrompt,
        isTemporary: isTemporary,
      };
      setMessages((prev) => [...prev, errMsg]);
      onShowToast(isTemporary ? 'ترافیک موقت سرور هوش مصنوعی (۵۰۳)' : (err.message || 'خطا در پاسخ هوش مصنوعی'), 'warn');
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // Apply Actions to main schedule
  const handleApplyMessageActions = (messageId: string, actions: AiAction[]) => {
    onApplyActions(actions);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, actionsApplied: true } : m))
    );
    onShowToast(
      `${toFaDigits(actions.length)} تغییر با موفقیت روی جدول برنامه‌ریزی اعمال شد.`,
      'success'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-3xl h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* MODAL HEADER */}
        <header className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-2 ring-white/10">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  دستیار هوشمند برنامه‌ریزی (AI Planner)
                </h2>
                <span className="text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/20">
                  Gemini 3.8
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  حالت کم‌مصرف توکن
                </span>
              </div>
              <p className="text-xs text-slate-400">
                برنامه‌ریزی هوشمند، تنظیم ساعات کار عمیق و بهینه‌سازی ریتم شبانه‌روزی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* API Key settings toggle */}
            <button
              type="button"
              onClick={() => setShowKeySettings(!showKeySettings)}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                apiKey
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              }`}
              title="تنظیم کلید اختصاصی Gemini API"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">
                {apiKey ? 'کلید API فعال' : 'تنظیم کلید API'}
              </span>
            </button>

            {/* Clear History / Chat Button */}
            <button
              type="button"
              onClick={handleClearHistory}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-white/10 hover:border-rose-400/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              title="پاک کردن کامل صفحه گفتگو و شروع مجدد"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>پاک کردن چت</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* API KEY SETTINGS DRAWER */}
        {showKeySettings && (
          <div className="bg-slate-50 border-b border-slate-200 p-4 animate-fade-in text-slate-800 text-xs shrink-0">
            <div className="max-w-xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold flex items-center gap-1.5 text-slate-900">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>تنظیمات کلید Google Gemini API</span>
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-bold"
                >
                  <span>دریافت رایگان کلید API</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                کلید شما به صورت امن و محلی در مرورگر خودتان ذخیره می‌شود و مستقیماً برای برقراری
                ارتباط پایدار با مدل Gemini ارسال می‌گردد. بدون فعال‌سازی کلید، ارتباط هوش مصنوعی به
                صورت خودکار برقرار نمی‌شود.
              </p>

              <form onSubmit={handleSaveApiKey} className="flex items-center gap-2">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder={apiKey ? '••••••••••••••••••••••••' : 'AIzaSy... کلید API را اینجا بچسبانید'}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  ذخیره کلید
                </button>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleRemoveApiKey}
                    className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    حذف کلید
                  </button>
                )}
              </form>
            </div>
          </div>
        )}

        {/* CHAT MESSAGES CONTAINER */}
        <div
          ref={chatScrollRef}
          className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50"
        >
          {/* Quick Clear Chat Bar if multiple messages exist */}
          {messages.length > 1 && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-200/60 hover:bg-slate-200/80 rounded-xl border border-slate-300/60 text-[11px] text-slate-600 transition-colors">
              <span className="font-bold text-slate-700">
                تاریخچه گفتگو ({toFaDigits(messages.length)} پیام فعال)
              </span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-extrabold hover:underline cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs active:scale-95 transition-transform"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>خالی کردن صفحه چت</span>
              </button>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${
                  isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : msg.isError
                      ? 'bg-amber-500 text-white shadow-amber-500/20'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-amber-300'
                  }`}
                >
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : msg.isError ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-amber-50/90 border border-amber-200/90 text-slate-800 rounded-tl-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {/* Text Content */}
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Retry button for transient or temporary errors */}
                  {msg.isError && msg.failedPrompt && (
                    <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSendMessage(msg.failedPrompt)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer text-xs active:scale-95"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>تلاش مجدد</span>
                      </button>
                      <span className="text-[11px] text-slate-500">
                        پیام مجدداً با مدل پشتیبان ارسال خواهد شد
                      </span>
                    </div>
                  )}

                  {/* PROPOSED ACTIONS PREVIEW CARDS */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          <span>تغییرات پیشنهادی ({toFaDigits(msg.actions.length)} مورد):</span>
                        </span>
                        {msg.actionsApplied && (
                          <span className="text-emerald-600 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>اعمال شد</span>
                          </span>
                        )}
                      </div>

                      {/* Action Cards */}
                      <div className="grid grid-cols-1 gap-2">
                        {msg.actions.map((act, idx) => {
                          const dayObj = DAYS.find((d) => d.id === act.day);
                          const catObj = act.category ? CATEGORIES[act.category] : null;

                          let actionTitle = act.title || 'فعالیت جدید';
                          let actionDesc = '';
                          let badgeColor = catObj?.dotColor || '#6366f1';

                          if (act.type === 'clear_day') {
                            actionTitle = `خالی کردن کامل برنامه‌های روز ${dayObj?.nameFa || 'منتخب'}`;
                            actionDesc = 'پاکسازی تمام بلوک‌های این روز';
                            badgeColor = '#ef4444';
                          } else if (act.type === 'delete_block') {
                            actionTitle = `حذف بلوک: ${act.title || 'فعالیت انتخابی'}`;
                            actionDesc = 'برداشتن از جدول زمان‌بندی';
                            badgeColor = '#f43f5e';
                          } else if (act.type === 'update_block') {
                            actionTitle = `ویرایش بلوک: ${act.title || 'فعالیت'}`;
                            badgeColor = '#eab308';
                          } else if (act.type === 'add_block') {
                            actionTitle = `افزودن: ${act.title || 'فعالیت جدید'}`;
                          }

                          const startStr = act.startMinutes !== undefined ? minutesToTimeString(act.startMinutes) : null;
                          const endStr =
                            act.startMinutes !== undefined && act.durationMinutes
                              ? minutesToTimeString(act.startMinutes + act.durationMinutes)
                              : null;

                          return (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2 text-xs shadow-2xs hover:bg-slate-100/70 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-xs"
                                  style={{ backgroundColor: badgeColor }}
                                />
                                <div className="min-w-0">
                                  <div className="font-extrabold text-slate-800 truncate text-[12px] sm:text-[12.5px]">
                                    {actionTitle}
                                  </div>
                                  <div className="text-[10.5px] text-slate-500 flex items-center gap-2 font-medium flex-wrap mt-0.5">
                                    {dayObj && (
                                      <span className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                                        روز: {dayObj.nameFa}
                                      </span>
                                    )}
                                    {startStr && endStr ? (
                                      <span className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold" dir="ltr">
                                        {toFaDigits(startStr)} - {toFaDigits(endStr)}
                                      </span>
                                    ) : startStr ? (
                                      <span className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold" dir="ltr">
                                        ساعت: {toFaDigits(startStr)}
                                      </span>
                                    ) : null}
                                    {act.durationMinutes && (
                                      <span className="text-slate-600 font-bold">
                                        ({formatDurationFa(act.durationMinutes)})
                                      </span>
                                    )}
                                    {catObj && (
                                      <span className="text-indigo-600 text-[10px] font-bold">
                                        [{catObj.label}]
                                      </span>
                                    )}
                                    {actionDesc && (
                                      <span className="text-rose-600 font-bold">
                                        {actionDesc}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Apply Actions Status / Re-apply Button */}
                      {msg.actionsApplied ? (
                        <div className="w-full mt-2 py-1.5 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-bold rounded-xl flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                            <span>این تغییرات روی جدول زمان‌بندی اعمال شده است.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApplyMessageActions(msg.id, msg.actions!)}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                          >
                            اعمال مجدد
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyMessageActions(msg.id, msg.actions!)}
                          className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs active:scale-98"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>اعمال این تغییرات روی جدول زمان‌بندی</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-[9px] mt-1.5 font-mono text-left ${
                      isUser ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Live Multi-Stage Transparent Progress Box */}
          {isLoading && (
            <div className="flex gap-3 max-w-[90%] sm:max-w-[80%] ml-auto animate-fade-in select-none">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border-2 border-indigo-200/90 rounded-2xl rounded-tl-none p-3.5 sm:p-4 shadow-md text-xs text-slate-700 flex-1 space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                    </span>
                    <span className="font-black text-slate-800 text-xs sm:text-sm">
                      دستیار در حال پردازش جدول
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                    <span>⏱️</span>
                    <span dir="ltr">{toFaDigits(loadingElapsed)}s</span>
                  </div>
                </div>

                {/* Step Breakdown */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div
                    className={`flex items-center gap-2 text-[11.5px] ${
                      loadingStep >= 1 ? 'text-indigo-800 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {loadingStep > 1 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                    )}
                    <span>۱. فشرده‌سازی جدول و استخراج درخواست (حالت اقتصادی کم‌مصرف)</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 text-[11.5px] ${
                      loadingStep >= 2 ? 'text-indigo-800 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {loadingStep > 2 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : loadingStep === 2 ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                    <span>۲. سنجش ریتم شبانه‌روزی، انرژی شناختی و پیشگیری از تداخل</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 text-[11.5px] ${
                      loadingStep >= 3 ? 'text-indigo-800 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {loadingStep === 3 ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                    <span>۳. اعتبارسنجی ساختار بلوک‌ها و تدوین پاسخ موجز</span>
                  </div>
                </div>

                {/* Footer with Token Thrift Badge and Instant Cancel Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1 text-[10.5px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>بهینه‌سازی حداکثری توکن فعال است</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelRequest}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
                    title="توقف فوری جهت جلوگیری از معطلی یا مصرف API"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>لغو و توقف فوری</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PROMPT QUICK SUGGESTIONS CHIPS */}
        <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto select-none shrink-0">
          <span className="text-[10.5px] font-extrabold text-slate-400 whitespace-nowrap px-1">
            پیشنهادها:
          </span>
          {PROMPT_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(tmpl)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/70 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {tmpl}
            </button>
          ))}
        </div>

        {/* INPUT FORM */}
        <footer className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="دستور برنامه‌ریزی خود را بنویسید (مثلاً: یکشنبه ساعت ۳ تا ۵ کدنویسی بذار)..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed active:scale-95 shrink-0"
              title="ارسال به هوش مصنوعی"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};
