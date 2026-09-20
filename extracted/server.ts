import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Parse JSON payloads
  app.use(express.json({ limit: '5mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Planner Endpoint using @google/genai with gemini-3.8-flash
  app.post('/api/ai/plan', async (req, res) => {
    try {
      const {
        apiKey,
        message,
        history = [],
        currentSchedule = [],
        plannerContext = {},
      } = req.body;

      // Determine active API key (from client header/body or server environment)
      const effectiveApiKey =
        (req.headers['x-gemini-api-key'] as string) ||
        apiKey ||
        process.env.GEMINI_API_KEY;

      if (!effectiveApiKey) {
        return res.status(401).json({
          error: 'NO_API_KEY',
          message:
            'کلید API جمینای تنظیم نشده است. لطفاً کلید معتبر خود را از Google AI Studio وارد نمایید.',
        });
      }

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'INVALID_MESSAGE',
          message: 'متن پیام یا دستور برای هوش مصنوعی الزامی است.',
        });
      }

      // Initialize Gemini Client with server telemetry header
      const ai = new GoogleGenAI({
        apiKey: effectiveApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Compact, token-saving summary of user schedule
      const compactScheduleSummary = (Array.isArray(currentSchedule) ? currentSchedule : [])
        .slice(0, 30)
        .map((b: any) => {
          const h = Math.floor((b.startMinutes || 0) / 60);
          const m = (b.startMinutes || 0) % 60;
          const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          return `- ${b.day || 'sat'}: ${timeStr} (${b.durationMinutes || 60}m) "${(b.title || '').slice(0, 30)}" [${b.category || 'deep_work'}]`;
        })
        .join('\n');

      // Super-complete system instruction trained on timeboxing, circadian biology, and schedule manipulation
      const systemInstruction = `
شما یک دستیار ارشد هوش مصنوعی و کوچ فوق‌حرفه‌ای برنامه‌ریزی هفتگی، مدیریت زمان به سبک تایم‌باکسینگ (Timeboxing) و بیولوژی ریتم شبانه‌روزی (Circadian Biology) برای نرم‌افزار "Anti-Fragile Weekly Planner" هستید.

وظیفه شما:
۱. تحلیل تقویم و برنامه‌ریزی هوشمند، انعطاف‌پذیر و پایدار برای کاربر.
۲. ایجاد بلوک‌های زمانی، ویرایش، بهینه‌سازی و حذف تداخل‌ها دقیقاً طبق دستور کاربر.
۳. در نظر گرفتن سطوح انرژی شناختی:
   - صبح زود و اواسط صبح (۰۸:۰۰ تا ۱۲:۰۰): بیشترین انرژی شناختی برای کار عمیق (deep_work)، کدنویسی و یادگیری سنگین (learning).
   - بعدازظهر (۱۳:۰۰ تا ۱۵:۰۰): افت طبیعی دوپامین و کورتیزول، مناسب برای کارهای سبک (light_work)، جلسات و کارهای روتین اداری (admin/chores).
   - عصر (۱۶:۰۰ تا ۱۹:۰۰): بازگشت تمرکز ثانویه یا مناسب برای ورزش (exercise) و کارهای خلاقانه.
   - شب (۲۰:۰۰ به بعد): استراحت، ریکاوری (recovery)، مطالعه سبک (reading) و آمادگی خواب.

مشخصات ساختار زمان و روزها:
- روزهای هفته در جدول و شناسه‌های معتبر:
  - شنبه: "sat"
  - یکشنبه: "sun"
  - دوشنبه: "mon"
  - سه‌شنبه: "tue"
  - چهارشنبه: "wed"
  - پنجشنبه: "thu"
  - جمعه: "fri"
- ساعات کاری جدول: بین ساعت ۰۷:۰۰ صبح (۴۲۰ دقیقه) تا ۲۴:۰۰ شب (۱۴۴۰ دقیقه).
- فرمت زمان‌ها در سیستم: بر حسب دقیقه از نیمه‌شب (startMinutes). به عنوان مثال:
  - 08:00 = 480
  - 09:30 = 570
  - 12:00 = 720
  - 15:00 = 900
  - 18:30 = 1110
- دسته‌بندی‌های دقیق و مجاز سیستم (category) - فقط از این شناسه‌ها استفاده کن:
  - "python" : یادگیری و برنامه‌نویسی پایتون
  - "pytorch" : یادگیری عمیق، تنسورها و هوش مصنوعی
  - "work" : پروژه‌های کاری، لینوکس و گیت
  - "university" : دانشگاه، تکالیف و کلاس‌ها
  - "recovery" : استراحت، ریکاوری، قهوه، ناهار و تنفس
  - "habit" : عادت خرد روزانه (مطالعه زبان و غیره)
  - "gaming" : تفریح، سرگرمی و بازی
  - "meeting" : جلسات کاری و هماهنگی
- اولویت‌ها (priority): "low", "medium", "high", "urgent"

اطلاعات خلاصه جدول فعلی کاربر:
${compactScheduleSummary || 'جدول در حال حاضر خالی است.'}

قوانین حیاتی و قطعی خروجی (بسیار مهم):
۱. قانون تعداد بلوک‌ها: هرگز برای یک بازه زمانی کوتاه (مثلاً ۲ ساعت) نباید ده‌ها بلوک تکه‌تکه یا تکراری بسازی!
   - اگر کاربر گفت: «شنبه از ساعت ۱۳ تا ۱۵ با استراحت کوتاه بینش پایتون بگذار»:
     کل این بازه (۲ ساعت = ۱۲۰ دقیقه از ۷۸۰ تا ۹۰۰) دقیقاً شامل ۳ بلوک معقول و استاندارد است:
     بلوک ۱ (پایتون): startMinutes: 780 (13:00)، durationMinutes: 50، category: "python"، title: "برنامه‌نویسی پایتون"
     بلوک ۲ (استراحت): startMinutes: 830 (13:50)، durationMinutes: 15، category: "recovery"، title: "استراحت و تنفس"
     بلوک ۳ (پایتون): startMinutes: 845 (14:05)، durationMinutes: 55، category: "python"، title: "تمرین پایتون"
     تعداد کل اکشن‌ها در این حالت حداکثر ۲ تا ۳ اکشن است، نه ۱۰ اکشن تکراری!
۲. عنوان فعالیت (title): باید دقیقاً یک عبارت تمیز ۲ تا ۳ کلمه‌ای فارسی باشد (مثلاً: «برنامه‌نویسی پایتون»، «استراحت کوتاه»، «پروژه کاری»). تکرار کلمات یا نوشتن متن‌های طولانی در title اکیداً ممنوع است.
۳. زیرعنوان (subtitle): حداکثر ۲ کلمه (مثلاً «تمرکز بالا»، «نوشیدنی و کشش») یا خالی.
۴. پاسخ متنی (reply): فقط ۱ الی ۲ جمله کوتاه و مؤدبانه فارسی که بگوید چه مواردی تنظیم شد.
۵. اکشن‌ها (actions):
   - افزودن بلوک: {"type": "add_block", "id": "ai_" + Math.random().toString(36).slice(2, 7), "day": "sat", "title": "برنامه‌نویسی پایتون", "subtitle": "تمرکز بالا", "startMinutes": 780, "durationMinutes": 50, "category": "python"}
   - خالی کردن روز: {"type": "clear_day", "day": "sat"}
   - حذف بلوک: {"type": "delete_block", "id": "..."}
   - ویرایش بلوک: {"type": "update_block", "id": "...", ...}
`;

      // Build conversation contents including history (last 4 turns to save tokens)
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      for (const h of history.slice(-4)) {
        if (h.role === 'user' || h.role === 'model') {
          contents.push({
            role: h.role,
            parts: [{ text: String(h.text || '').slice(0, 400) }],
          });
        }
      }

      // Append current user message
      contents.push({
        role: 'user',
        parts: [{ text: String(message || '').slice(0, 800) }],
      });

      // Helper function with exponential backoff and fallback models
      async function callGeminiWithFallback(params: {
        contents: any[];
        config: any;
      }) {
        const candidateModels = [
          'gemini-3.8-flash',
          'gemini-flash-latest',
          'gemini-3.1-flash-lite',
        ];

        let lastErr: any = null;

        for (let i = 0; i < candidateModels.length; i++) {
          const modelName = candidateModels[i];
          // Try each model up to 2 times for transient 503/429
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const res = await ai.models.generateContent({
                model: modelName,
                contents: params.contents,
                config: params.config,
              });
              return res;
            } catch (err: any) {
              lastErr = err;
              const errMsg = String(err?.message || '') + ' ' + String(err?.status || '');
              const isAuthError =
                err?.status === 400 ||
                err?.status === 403 ||
                errMsg.includes('API_KEY_INVALID') ||
                errMsg.includes('API key not valid');

              if (isAuthError) {
                throw err;
              }

              const isTransient =
                err?.status === 503 ||
                err?.status === 429 ||
                err?.code === 503 ||
                errMsg.includes('503') ||
                errMsg.includes('UNAVAILABLE') ||
                errMsg.includes('high demand') ||
                errMsg.includes('Resource has been exhausted');

              if (isTransient && attempt === 0) {
                console.warn(
                  `[Gemini] ${modelName} returned 503/high demand. Backing off 1200ms and retrying...`
                );
                await new Promise((r) => setTimeout(r, 1200));
                continue;
              }

              // Otherwise break inner loop to try next fallback model
              console.warn(`[Gemini] Switching from ${modelName} to next fallback model...`);
              break;
            }
          }
        }

        throw lastErr;
      }

      // Query Gemini with resilience, deterministic low temperature and token cap
      const response = await callGeminiWithFallback({
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'پیام بسیار کوتاه ۱ الی ۲ جمله فارسی برای گزارش تغییرات اعمال شده به کاربر',
              },
              actions: {
                type: Type.ARRAY,
                description: 'لیست عملیات‌های قابل اعمال روی جدول برنامه‌ریزی',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: 'نوع عملیات: add_block | update_block | delete_block | clear_day',
                    },
                    day: { type: Type.STRING, description: 'شناسه روز مانند sat, sun, mon, tue, wed, thu, fri' },
                    id: { type: Type.STRING, description: 'شناسه بلوک' },
                    title: { type: Type.STRING, description: 'عنوان بسیار کوتاه فقط ۲ الی ۳ کلمه فارسی مثل برنامه‌نویسی یا مطالعه' },
                    subtitle: { type: Type.STRING, description: 'زیرعنوان خیلی کوتاه حداکثر ۲ کلمه' },
                    startMinutes: { type: Type.INTEGER, description: 'دقیقه شروع از نیمه‌شب' },
                    durationMinutes: { type: Type.INTEGER, description: 'مدت زمان به دقیقه' },
                    category: { type: Type.STRING, description: 'دسته‌بندی بلوک' },
                    priority: { type: Type.STRING, description: 'اولویت بلوک' },
                    energyLevel: { type: Type.STRING, description: 'سطح انرژی مورد نیاز' },
                  },
                  required: ['type'],
                },
              },
              suggestions: {
                type: Type.ARRAY,
                description: 'حداکثر ۲ پیشنهاد هوشمند برای پرامپت بعدی کاربر',
                items: { type: Type.STRING },
              },
            },
            required: ['reply', 'actions'],
          },
        },
      });

      const responseText = response.text || '{}';
      let parsed: any;

      // Robust JSON parser with fallback extraction so raw JSON is NEVER shown
      try {
        parsed = JSON.parse(responseText);
      } catch {
        // Strip potential markdown fences
        const cleanText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        try {
          parsed = JSON.parse(cleanText);
        } catch {
          // Extract reply string via regex
          const replyMatch = responseText.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const extractedReply = replyMatch
            ? replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
            : 'برنامه شما با موفقیت پردازش شد.';

          // Extract any completed actions
          const actions: any[] = [];
          const actMatches = responseText.matchAll(/\{\s*"type"\s*:\s*"(add_block|update_block|delete_block|clear_day)"[^\}]*\}/g);
          for (const m of actMatches) {
            try {
              actions.push(JSON.parse(m[0]));
            } catch {}
          }

          parsed = {
            reply: extractedReply,
            actions: actions,
            suggestions: [],
          };
        }
      }

      // If reply is accidentally a JSON string, unwrap it
      if (typeof parsed.reply === 'string') {
        const trimmed = parsed.reply.trim();
        if (trimmed.startsWith('{') && (trimmed.includes('"reply"') || trimmed.includes('"actions"'))) {
          try {
            const inner = JSON.parse(trimmed);
            if (inner.reply) parsed.reply = inner.reply;
            if (Array.isArray(inner.actions) && (!parsed.actions || parsed.actions.length === 0)) {
              parsed.actions = inner.actions;
            }
          } catch {
            const match = trimmed.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (match && match[1]) {
              parsed.reply = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }
          }
        }
      }

      // Title & Subtitle Sanitizers - enforce clean concise Persian titles (max 3 words)
      function cleanBlockTitle(raw: string): string {
        if (!raw) return 'فعالیت جدید';
        let cleaned = String(raw).replace(/\([^)]*\)/g, '').trim();
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        const words = cleaned.split(' ').filter(Boolean);
        if (words.length > 4) {
          cleaned = words.slice(0, 3).join(' ');
        }
        if (cleaned.length > 25) {
          cleaned = cleaned.slice(0, 25).trim();
        }
        return cleaned || 'فعالیت جدید';
      }

      function cleanSubtitle(raw: string): string {
        if (!raw) return '';
        let cleaned = String(raw).replace(/\([^)]*\)/g, '').trim();
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        const words = cleaned.split(' ').filter(Boolean);
        if (words.length > 3) {
          cleaned = words.slice(0, 2).join(' ');
        }
        return cleaned.slice(0, 25);
      }

      if (Array.isArray(parsed.actions)) {
        // Day mapping to ensure Persian and full English names map strictly to DayKey ('sat'|'sun'|'mon'|'tue'|'wed'|'thu'|'fri')
        const dayMap: Record<string, string> = {
          'sat': 'sat',
          'saturday': 'sat',
          'شنبه': 'sat',
          'sun': 'sun',
          'sunday': 'sun',
          'یکشنبه': 'sun',
          'یک‌شنبه': 'sun',
          'mon': 'mon',
          'monday': 'mon',
          'دوشنبه': 'mon',
          'دو‌شنبه': 'mon',
          'tue': 'tue',
          'tuesday': 'tue',
          'سه شنبه': 'tue',
          'سه‌شنبه': 'tue',
          'wed': 'wed',
          'wednesday': 'wed',
          'چهارشنبه': 'wed',
          'چهار‌شنبه': 'wed',
          'thu': 'thu',
          'thursday': 'thu',
          'پنجشنبه': 'thu',
          'پنج‌شنبه': 'thu',
          'fri': 'fri',
          'friday': 'fri',
          'جمعه': 'fri',
        };

        // Safe mapping of legacy/generic categories to valid app category keys
        const categoryMap: Record<string, string> = {
          deep_work: 'work',
          learning: 'python',
          light_work: 'work',
          reading: 'habit',
          exercise: 'recovery',
          chores: 'recovery',
          admin: 'work',
          buffer: 'recovery',
        };

        const seenKeys = new Set<string>();
        const filteredActions: any[] = [];

        for (const act of parsed.actions) {
          if (!act || !act.type) continue;
          if (act.day) {
            const rawDay = String(act.day).trim().toLowerCase();
            const normalizedDay = dayMap[rawDay] || (dayMap[rawDay.replace(/[\u200B-\u200D\uFEFF]/g, '')] || 'sat');
            act.day = normalizedDay;
          } else {
            act.day = 'sat';
          }
          if (act.title) {
            act.title = cleanBlockTitle(act.title);
          }
          if (act.subtitle) {
            act.subtitle = cleanSubtitle(act.subtitle);
          }
          if (act.startMinutes !== undefined) {
            act.startMinutes = Math.max(0, Math.min(1439, Number(act.startMinutes) || 0));
          }
          if (act.durationMinutes !== undefined) {
            act.durationMinutes = Math.max(15, Math.min(480, Number(act.durationMinutes) || 60));
          }
          if (act.category && categoryMap[act.category]) {
            act.category = categoryMap[act.category];
          }

          // Deduplicate consecutive identical block spam
          const dedupeKey = `${act.type}_${act.day}_${act.startMinutes}_${act.durationMinutes}_${act.title}`;
          if (seenKeys.has(dedupeKey)) {
            continue; // Skip exact clone
          }
          seenKeys.add(dedupeKey);
          filteredActions.push(act);
        }

        parsed.actions = filteredActions.slice(0, 8);
      }

      return res.json(parsed);
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      const errStr = String(err?.message || '') + ' ' + String(err?.status || '');
      const isAuthError =
        err?.status === 400 ||
        err?.status === 403 ||
        errStr.includes('API_KEY_INVALID') ||
        errStr.includes('API key not valid');

      const isHighDemand =
        err?.status === 503 ||
        err?.code === 503 ||
        errStr.includes('503') ||
        errStr.includes('UNAVAILABLE') ||
        errStr.includes('high demand') ||
        errStr.includes('Resource has been exhausted');

      let responseStatus = err?.status || 500;
      let errorCode = 'AI_ERROR';
      let userFriendlyMessage = err?.message || 'خطا در ارتباط با هوش مصنوعی جمینای';

      if (isAuthError) {
        responseStatus = 401;
        errorCode = 'INVALID_API_KEY';
        userFriendlyMessage =
          'کلید API جمینای وارد شده معتبر نیست یا دسترسی آن محدود شده است. لطفاً کلید معتبری وارد کنید.';
      } else if (isHighDemand) {
        responseStatus = 503;
        errorCode = 'HIGH_DEMAND_TEMPORARY';
        userFriendlyMessage =
          'سرورهای هوش مصنوعی در حال حاضر با تقاضای بسیار بالایی مواجه هستند (کد ۵۰۳). این وضعیت گذرا و موقتی است؛ لطفاً چند ثانیه دیگر دکمه «تلاش مجدد» را فشار دهید.';
      }

      return res.status(responseStatus).json({
        error: errorCode,
        message: userFriendlyMessage,
        isTemporary: isHighDemand,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Timeboxing Planner Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
