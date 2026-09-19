import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  Shield,
  Bell,
  Award,
  Flame,
  Palette,
  Layers,
  Zap,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepData {
  id: number;
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  badgeBg: string;
  content: {
    heading: string;
    points: Array<{ title: string; desc: string; icon?: string }>;
    tip: string;
  };
}

const STEPS: StepData[] = [
  {
    id: 1,
    title: 'فلسفه ضدشکنندگی (Anti-Fragility)',
    subtitle: 'چرا تایم‌باکسینگ آرامش می‌آورد و کمال‌گرایی را حذف می‌کند؟',
    icon: Flame,
    iconColor: 'text-amber-500',
    badgeBg: 'bg-amber-100 text-amber-800',
    content: {
      heading: 'قانون طلایی: ۱ همیشه بزرگ‌تر از ۰ است!',
      points: [
        {
          title: 'رهایی از لیست‌های وظایف بی‌پایان (To-Do List)',
          desc: 'لیست‌های سنتی باعث احساس گناه می‌شوند، اما وقتی برای هر کار یک «جعبه زمانی مشخص» (Time Box) می‌گذارید، مغز فقط روی همان لحظه تمرکز می‌کند.',
        },
        {
          title: 'کمال‌گرایی منفی را دور بریزید',
          desc: 'اگر قرار بود ۹۰ دقیقه کار کنی ولی فقط ۳۰ دقیقه توانستی، آن ۳۰ دقیقه یک پیروزی بزرگ است! در سیستم ضد شکننده، تلاش اندک بسیار باارزش‌تر از تسلیم شدن است.',
        },
        {
          title: 'تعادل دوپامین سالم و ریکاوری',
          desc: 'کار عمیق نیاز به استراحت عمیق دارد. بین بلوک‌های سخت، پیاده‌روی، چای و تنفس قرار دهید تا مغز فرسوده نشود.',
        },
      ],
      tip: 'همیشه یک سوم روز را خالی بگذارید؛ بافرها ضربه‌گیرهای روز شما در برابر اتفاقات پیش‌بینی‌نشده هستند.',
    },
  },
  {
    id: 2,
    title: 'چیدن سریع و آسان برنامه',
    subtitle: 'سه روش ساده برای پر کردن جدول در کمتر از ۲ دقیقه',
    icon: Calendar,
    iconColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    content: {
      heading: 'ساده‌ترین راه‌ها برای برنامه‌ریزی روزانه و هفتگی',
      points: [
        {
          title: 'روش اول: کلیک مستقیم روی هر خانه از جدول',
          desc: 'روی هر ساعت از روز (مثلاً شنبه ساعت ۱۰:۰۰) کلیک کنید تا منوی سریع باز شود و با یک کلیک الگوی دلخواه یا تسک جدید را بنشانید.',
        },
        {
          title: 'روش دوم: کشیدن از بانک الگوها (Drag & Drop)',
          desc: 'از سایدبار سمت راست، الگوهای آماده مثل «پروژه کاری»، «پایتورچ»، یا «استراحت» را بگیرید و روی روز و ساعت مدنظر رها کنید.',
        },
        {
          title: 'روش سوم: تکرار سریع برای فردا یا کل هفته',
          desc: 'داخل هر بلوک دکمه «تکرار برای فردا» یا «کپی برای روزهای کاری» قرار دارد تا نیازی به چیدن مجدد روتین‌های روزمره نباشد.',
        },
      ],
      tip: 'برای جا‌به‌جا کردن دو کار با یکدیگر، کافیست کارت اول را بکشید و روی کارت دوم رها کنید تا هوشمندانه با هم جابجا (Swap) شوند.',
    },
  },
  {
    id: 3,
    title: 'گام زمانی قابل تنظیم (۱۵ یا ۳۰ دقیقه)',
    subtitle: 'انعطاف در زمان‌بندی کارهای میکرو یا فوکوس عمیق',
    icon: Clock,
    iconColor: 'text-sky-600',
    badgeBg: 'bg-sky-100 text-sky-800',
    content: {
      heading: 'دقت زمان‌بندی را مطابق سبک زندگی خود تنظیم کنید',
      points: [
        {
          title: 'حالت ۳۰ دقیقه‌ای (پیش‌فرض استاندارد)',
          desc: 'بهترین انتخاب برای کارهای دانشگاهی، برنامه‌نویسی و پروژه‌های کاری عمیق با نمای خلوت‌تر و خواناتر.',
        },
        {
          title: 'حالت ۱۵ دقیقه‌ای (میکرو تسک‌ها)',
          desc: 'امکان برنامه‌ریزی برای کارهای بسیار دقیق مثل جلسات کوتاه ۱۵ دقیقه‌ای، عادات خرد، یا استراحت‌های کوتاه.',
        },
        {
          title: 'تغییر آسان با یک کلیک',
          desc: 'دکمه «گام زمانی» در نوار بالای صفحه به شما امکان می‌دهد در هر لحظه بین رزولوشن ۱۵ و ۳۰ دقیقه جابجا شوید.',
        },
      ],
      tip: 'می‌توانید کارهای مهم را ۹۰ دقیقه‌ای (اولترادین) تعریف کنید و بعد از آن ۱۵ دقیقه ریکاوری مغز بگذارید.',
    },
  },
  {
    id: 4,
    title: 'دسته‌بندی‌های روان‌شناختی',
    subtitle: 'مدیریت بار شناختی و افزودن دسته‌های دلخواه',
    icon: Palette,
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-100 text-purple-800',
    content: {
      heading: 'جدول خود را با رنگ‌ها و حوزه‌های زندگی خودتان تزئین کنید',
      points: [
        {
          title: 'دسته‌بندی‌های آماده سیستم',
          desc: 'کدنویسی، یادگیری هوش مصنوعی (پایتورچ)، تعهدات دانشگاه، جلسات کاری، عادت‌ها و استراحت.',
        },
        {
          title: 'امکان افزودن دسته‌های نامحدود شخصی',
          desc: 'از دکمه «دسته‌بندی‌ها» در هدر استفاده کنید و دسته‌هایی مانند «زبان انگلیسی»، «ورزش و فیتنس» یا «کتابخوانی» را اضافه کنید.',
        },
        {
          title: 'پالت‌های رنگی جذاب و آیکون‌های متنوع',
          desc: 'برای هر دسته، رنگ اختصاصی و بار شناختی (کار عمیق، ریکاوری، محدودیت قطعی) تعیین کنید.',
        },
      ],
      tip: 'رنگ‌های گرم و پررنگ را برای کار عمیق و رنگ‌های سبز و ملایم را برای تفریح و بازیابی ذخیره کنید.',
    },
  },
  {
    id: 5,
    title: 'جاموندن از برنامه اینطوری (دیر بیدار شدم / خستگی)',
    subtitle: 'تنظیم مجدد روز در ۳۰ ثانیه بدون سرزنش و عذاب وجدان',
    icon: Shield,
    iconColor: 'text-rose-600',
    badgeBg: 'bg-rose-100 text-rose-800',
    content: {
      heading: 'وقتی برنامه جابجا شد، روزت رو دور نریز!',
      points: [
        {
          title: 'سناریوی شایع: خواب ماندن یا ۲ ساعت اسکرول گوشی',
          desc: 'در زندگی واقعی، روزها کامل پیش نمی‌روند. دکمه «جاموندن از برنامه اینطوری» را در بالای صفحه بزنید.',
        },
        {
          title: 'شیفت خودکار برنامه (Shift)',
          desc: 'سیستم بلوک‌های باقیمانده را بر اساس ساعت بیداری جدید به جلو می‌کشد تا دوباره روی ریل قرار بگیرید.',
        },
        {
          title: 'فشرده‌سازی هوشمند (Compress)',
          desc: 'کارهای کم‌اهمیت حذف یا فشرده می‌شوند تا مهم‌ترین هدف امروز شما حتی در زمان کم محقق شود.',
        },
      ],
      tip: 'پذیرش واقعیت اولین اصل ضدشکنندگی است. شکست در یک ساعت، دلیلی برای نابودی ۲۳ ساعت دیگر نیست.',
    },
  },
  {
    id: 6,
    title: 'یادآور صوتی و کارنامه شبانه',
    subtitle: 'صدای آرامش‌بخش و پایگاه داده پایدار برای پیشرفت مستمر',
    icon: Bell,
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    content: {
      heading: 'پایان دادن به روز با آرامش و ساخت انضباط ماندگار',
      points: [
        {
          title: 'صدای زنگ دلنشین (کاسه تبتی ۵۲۸ هرتز)',
          desc: 'هنگام رسیدن به وقت شروع هر کار یا زمان ممیزی، سیستم با یک صدای آرامش‌بخش شما را مطلع می‌کند.',
        },
        {
          title: 'ثبت کارنامه پایان روز (Daily Audit)',
          desc: 'هر شب ساعت ۲۲ یا قبل از خواب، دکمه «کارنامه روز» را بزنید و درصد پیشرفت و درس‌های امروزتان را ثبت کنید.',
        },
        {
          title: 'پایگاه داده ماندگار و گزارش تصویری',
          desc: 'تمام کارنامه‌های شما در دیتابیس پایدار ذخیره می‌شوند و می‌توانید نمودارهای رشد و کارنامه تصویری A4 دانلود کنید.',
        },
      ],
      tip: 'هرگز بدون بستن کارنامه شبانه نخوابید؛ ثبت دستاوردها، ناخودآگاه شما را برای یک روز پرانرژی‌تر آماده می‌کند.',
    },
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Vazirmatn',sans-serif] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>راهنمای جامع و ساده تایم‌باکسینگ ضد شکننده</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono font-bold">
                  گام {currentStep.id} از {STEPS.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                آموزش گام‌به‌گام برای یادگیری تمام بخش‌ها در چند دقیقه
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

        {/* Step Progress Indicators */}
        <div className="px-4 sm:px-6 pt-4 pb-2 flex items-center gap-2 border-b border-slate-100 overflow-x-auto">
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                currentStepIndex === idx
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{step.id}.</span>
              <span>{step.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Card Hero Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-100/80 flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0 ${currentStep.iconColor}`}
            >
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${currentStep.badgeBg}`}>
                بخش {currentStep.id}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                {currentStep.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Detailed Points */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {currentStep.content.heading}
            </h4>
            <div className="space-y-2.5">
              {currentStep.content.points.map((pt, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition-all shadow-2xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">{pt.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 pr-6 leading-relaxed">{pt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tip Box */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 leading-relaxed font-medium">
              <strong className="font-black">نکته ضدشکنندگی: </strong>
              {currentStep.content.tip}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentStepIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>گام قبلی</span>
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentStepIndex === i ? 'w-5 bg-indigo-600' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
          >
            <span>{currentStepIndex === STEPS.length - 1 ? 'فهمیدم و شروع کار' : 'گام بعدی'}</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
