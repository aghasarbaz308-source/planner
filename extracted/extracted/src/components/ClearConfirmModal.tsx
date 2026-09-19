import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  Trash2,
  X,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  FileJson,
} from 'lucide-react';
import { TimeBlock, BlockTemplate } from '../types';
import { toFaDigits } from '../constants/plannerConfig';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => void;
  blocks: TimeBlock[];
  templates: BlockTemplate[];
  plannerTitle: string;
  weekRange: string;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
  blocks,
  templates,
  plannerTitle,
  weekRange,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [hasSavedJson, setHasSavedJson] = useState(false);

  if (!isOpen) return null;

  // Handle downloading JSON backup
  const handleDownloadBackup = () => {
    try {
      const backupData = {
        version: '2.0.0',
        title: plannerTitle,
        weekRange,
        exportedAt: new Date().toISOString(),
        blocks,
        templates,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `timeboxing-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setHasSavedJson(true);
    } catch (e) {
      console.error('Backup download error', e);
    }
  };

  const handleProceedToStep2 = () => {
    setStep(2);
  };

  const handleFinalClear = () => {
    onConfirmClear();
    setStep(1);
    setHasSavedJson(false);
    onClose();
  };

  const handleCancel = () => {
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-scale-up">
        {/* Header */}
        <div className="px-5 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                پاک‌سازی تمام بلوک‌های هفته
              </h3>
              <p className="text-[11px] text-rose-700 font-semibold">
                تایید امنیتی مرحله {toFaDigits(step)} از ۲
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* STEP 1: WARNING & BACKUP PROMPT */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">
                    آیا می‌خواهید تمام {toFaDigits(blocks.length)} بلوک زمانی این هفته را حذف کنید؟
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    برای جلوگیری از پریدن و از دست رفتن اطلاعات، حتماً قبل از پاک‌سازی، فایل پشتیبان
                    JSON را ذخیره کنید تا هر زمان مایل بودید بتوانید آن را برگردانید.
                  </p>
                </div>
              </div>

              {/* Download JSON Backup Button */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-indigo-600" />
                    پشتیبان‌گیری از برنامه:
                  </span>
                  {hasSavedJson ? (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      فایل پشتیبان ذخیره شد
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      هنوز ذخیره نشده
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    hasSavedJson
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {hasSavedJson
                      ? 'دانلود مجدد فایل پشتیبان JSON'
                      : 'دانلود و ذخیره فایل پشتیبان JSON (پیشنهاد ضروری)'}
                  </span>
                </button>
              </div>

              {/* Actions Step 1 */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>مرحله بعدی تایید</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FINAL CONFIRMATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-black text-rose-950 text-sm">
                    تایید نهایی: حذف قطعی تمام بلوک‌ها
                  </h4>
                  <p className="text-rose-900 leading-relaxed">
                    با کلیک روی دکمه زیر، تمامی {toFaDigits(blocks.length)} بلوک برنامه‌ریزی‌شده در
                    این هفته کاملاً پاک خواهند شد.
                  </p>
                  {!hasSavedJson && (
                    <div className="p-2 bg-amber-100/80 rounded-lg text-amber-900 font-bold mt-2">
                      ⚠️ شما هنوز فایل JSON پشتیبان را دانلود نکرده‌اید! در صورت پاک‌سازی، اطلاعات قابل بازیابی نیستند.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Step 2 */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  بازگشت به مرحله ۱
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalClear}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>بله، کاملاً پاک کن</span>
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
