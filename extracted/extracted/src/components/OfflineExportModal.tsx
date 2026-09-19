import React, { useState } from 'react';
import {
  Laptop,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  X,
  Sparkles,
  FileCode,
  HardDrive,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { TimeBlock, BlockTemplate } from '../types';
import { generateStandaloneHtml } from '../utils/generateStandaloneHtml';

interface OfflineExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannerTitle: string;
  weekRange: string;
  blocks: TimeBlock[];
  templates: BlockTemplate[];
  onShowToast: (msg: string) => void;
}

export const OfflineExportModal: React.FC<OfflineExportModalProps> = ({
  isOpen,
  onClose,
  plannerTitle,
  weekRange,
  blocks,
  templates,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'single_html' | 'node_dev'>('single_html');
  const [isCopiedCmd, setIsCopiedCmd] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // 1. Download Standalone HTML file
  const handleDownloadStandaloneHtml = () => {
    setIsDownloading(true);
    try {
      const htmlContent = generateStandaloneHtml({
        plannerTitle,
        weekRange,
        blocks,
        templates,
      });

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `timeboxing-planner-${dateStr}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      onShowToast('فایل جامع HTML با موفقیت دانلود شد! آماده اجرا با دابل‌کلیک.');
    } catch (e) {
      console.error(e);
      onShowToast('خطا در تولید فایل HTML');
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Download batch script for Windows (run-planner.bat)
  const handleDownloadBat = () => {
    const batContent = `@echo off
chcp 65001 > nul
echo ========================================================
echo   Anti-Fragile Weekly Timeboxing Planner
echo   در حال راه‌اندازی برنامه‌ریز تایم‌باکسینگ در رایانه شما...
echo ========================================================
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطا] لطفاً ابتدا نرم‌افزار Node.js را نصب فرمایید: https://nodejs.org
    pause
    exit /b
)
echo در حال بررسی و نصب پکیج‌ها (تنها بار اول زمان‌بر است)...
call npm install
echo در حال اجرای سرور توسعه...
start http://localhost:3000
call npm run dev
pause
`;
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'run-planner.bat';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onShowToast('اسکریپت ویندوز (run-planner.bat) دانلود شد.');
  };

  // 3. Download shell script for Mac/Linux (run-planner.sh)
  const handleDownloadSh = () => {
    const shContent = `#!/bin/bash
echo "========================================================"
echo "  Anti-Fragile Weekly Timeboxing Planner"
echo "  در حال اجرای برنامه‌ریز تایم‌باکسینگ روی مک و لینوکس..."
echo "========================================================"
if ! command -v npm &> /dev/null
then
    echo "[خطا] ابتدا Node.js را نصب کنید: https://nodejs.org"
    exit 1
fi
npm install
open http://localhost:3000 || xdg-open http://localhost:3000 || true
npm run dev
`;
    const blob = new Blob([shContent], { type: 'application/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'run-planner.sh';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onShowToast('اسکریپت لینوکس/مک (run-planner.sh) دانلود شد.');
  };

  const copyCommands = async () => {
    const text = 'npm install\nnpm run dev';
    await navigator.clipboard.writeText(text);
    setIsCopiedCmd(true);
    onShowToast('دستورات ترمینال کپی شدند!');
    setTimeout(() => setIsCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center shadow-xs">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-white">
                  اجرا در کامپیوتر شخصی و خروجی کامل HTML
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  آفلاین و ۱۰۰٪ مستقل
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                برنامه را به صورت فایل تکی با دابل‌کلیک باز کنید یا سورس کامل را با Node.js اجرا فرمایید
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

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/70 px-5 pt-2">
          <button
            onClick={() => setActiveTab('single_html')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'single_html'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-600" />
            <span>روش ۱: تک‌فایل HTML مستقل (ساده‌ترین روش - با دابل‌کلیک)</span>
          </button>

          <button
            onClick={() => setActiveTab('node_dev')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'node_dev'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>روش ۲: اجرای کد منبع (با Node.js و اسکریپت)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* TAB 1: STANDALONE HTML FILE */}
          {activeTab === 'single_html' && (
            <div className="space-y-4">
              {/* Highlight Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 space-y-1">
                  <h4 className="font-extrabold text-sm text-emerald-900">
                    بدون نیاز به نصب حتی یک برنامه اضافی!
                  </h4>
                  <p className="leading-relaxed">
                    یک فایل <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold text-emerald-900">.html</code> مستقل دریافت می‌کنید که تمامی استایل‌ها، فونت فارسی وزیرمتن، کدهای ری‌اکت و <strong>تمامی اطلاعات فعلی برنامه‌ریزی شما</strong> داخل آن تعبیه شده است.
                  </p>
                </div>
              </div>

              {/* Big Download Button */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                <button
                  onClick={handleDownloadStandaloneHtml}
                  disabled={isDownloading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>دانلود فایل تکی HTML مستقل (آماده اجرا با دابل‌کلیک)</span>
                </button>
                <p className="text-[11px] text-slate-500">
                  حجم تقریبی: ~۱۵ کیلوبایت • سازگار با ویندوز، مک، لینوکس و گوشی تلفن همراه
                </p>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  چگونه در کامپیوتر شخصی اجرا کنم؟
                </h4>
                <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed pr-1">
                  <li>
                    روی دکمه بالا کلیک کنید تا فایل <span className="font-mono font-bold text-slate-900">timeboxing-planner.html</span> دانلود شود.
                  </li>
                  <li>
                    فایل را در هر کجای کامپیوترتان که دوست دارید (مثلاً روی دسکتاپ یا پوشه کارهای روزانه) قرار دهید.
                  </li>
                  <li>
                    روی فایل <strong>دوبار کلیک کنید (Double Click)</strong>؛ در مرورگر شما (کروم، فایرفاکس، مایکروسافت اج یا سافاری) باز می‌شود.
                  </li>
                  <li>
                    تمام امکانات (جابجایی بلوک‌ها، تغییر زمان، ذخیره‌سازی خودکار در هارد دیسک مرورگر، خروجی چاپی و گزارش روزانه) به صورت کامل کار می‌کنند.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: NODE.JS / SOURCE CODE DEV */}
          {activeTab === 'node_dev' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
                <HardDrive className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 space-y-1">
                  <h4 className="font-extrabold text-sm text-indigo-900">
                    اجرای کامل به همراه سرور توسعه محلی (Vite + TypeScript)
                  </h4>
                  <p className="leading-relaxed">
                    اگر می‌خواهید کدهای پروژه را با VS Code باز کرده یا سرور توسعه را روی سیستم اجرا کنید، از اسکریپت‌های زیر استفاده فرمایید.
                  </p>
                </div>
              </div>

              {/* Automatic Quick Launch Scripts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">ویندوز (Windows)</span>
                    <span className="text-[10px] font-mono text-slate-500">.bat script</span>
                  </div>
                  <button
                    onClick={handleDownloadBat}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>دانلود اسکریپت run-planner.bat</span>
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">مک و لینوکس (Mac / Linux)</span>
                    <span className="text-[10px] font-mono text-slate-500">.sh script</span>
                  </div>
                  <button
                    onClick={handleDownloadSh}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>دانلود اسکریپت run-planner.sh</span>
                  </button>
                </div>
              </div>

              {/* Terminal Commands */}
              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">اجرا در ترمینال (Bash / PowerShell):</span>
                  <button
                    onClick={copyCommands}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {isCopiedCmd ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedCmd ? 'کپی شد' : 'کپی دستورات'}</span>
                  </button>
                </div>
                <pre className="font-mono text-xs bg-black/40 p-3 rounded-xl overflow-x-auto text-emerald-400 select-all" dir="ltr">
{`npm install
npm run dev`}
                </pre>
                <p className="text-[11px] text-slate-400">
                  سپس در مرورگر به آدرس <code className="text-indigo-300 font-mono">http://localhost:3000</code> بروید.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            تمامی داده‌ها مستقیماً در رایانه شما محفوظ می‌مانند.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
