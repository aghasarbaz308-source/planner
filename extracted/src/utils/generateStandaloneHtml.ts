import { TimeBlock, BlockTemplate } from '../types';
import { DAYS, CATEGORIES, minutesToTimeString, toFaDigits, formatDurationFa } from '../constants/plannerConfig';

export interface StandaloneHtmlOptions {
  plannerTitle: string;
  weekRange: string;
  blocks: TimeBlock[];
  templates?: BlockTemplate[];
}

export function generateStandaloneHtml(options: StandaloneHtmlOptions): string {
  const { plannerTitle, weekRange, blocks } = options;

  // Group blocks by day
  const blocksByDay: Record<string, TimeBlock[]> = {};
  DAYS.forEach((d) => {
    blocksByDay[d.id] = blocks
      .filter((b) => b.day === d.id)
      .sort((a, b) => a.startMinutes - b.startMinutes);
  });

  const totalMinutes = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedCount = blocks.filter((b) => b.completed).length;

  const serializedData = JSON.stringify(blocks).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(plannerTitle)} - ${escapeHtml(weekRange)}</title>
  <style>
    :root {
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Vazirmatn", "IRANSans", Tahoma, sans-serif;
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-family);
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 16px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    header {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .header-info h1 {
      font-size: 1.35rem;
      font-weight: 900;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-info p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .header-stats {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .stat-badge {
      background: #f1f5f9;
      border: 1px solid var(--border);
      padding: 8px 14px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 700;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-badge span.val {
      font-size: 1.1rem;
      color: var(--primary);
      font-weight: 900;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    button.btn {
      background: var(--primary);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 10px;
      font-family: inherit;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.2s;
    }

    button.btn:hover {
      background: var(--primary-hover);
    }

    button.btn-outline {
      background: #ffffff;
      color: #334155;
      border: 1px solid var(--border);
    }

    button.btn-outline:hover {
      background: #f8fafc;
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }

    @media (max-width: 768px) {
      .days-grid {
        grid-template-columns: 1fr;
      }
    }

    .day-column {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .day-header {
      padding: 12px 14px;
      background: #f8fafc;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .day-header h3 {
      font-size: 0.95rem;
      font-weight: 800;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .day-header .day-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .day-header .count-badge {
      font-size: 0.75rem;
      color: #64748b;
      background: #ffffff;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--border);
      font-weight: 700;
    }

    .blocks-container {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 200px;
    }

    .block-card {
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(0,0,0,0.08);
      position: relative;
      transition: transform 0.15s, box-shadow 0.15s;
      cursor: pointer;
    }

    .block-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 5px rgba(0,0,0,0.06);
    }

    .block-card.completed {
      opacity: 0.65;
      text-decoration: line-through;
    }

    .block-time {
      font-size: 0.75rem;
      font-weight: 700;
      opacity: 0.85;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .block-title {
      font-size: 0.85rem;
      font-weight: 800;
      line-height: 1.35;
    }

    .block-subtitle {
      font-size: 0.72rem;
      opacity: 0.8;
      margin-top: 2px;
    }

    .block-note {
      font-size: 0.7rem;
      background: rgba(255,255,255,0.6);
      padding: 3px 6px;
      border-radius: 4px;
      margin-top: 5px;
      border: 1px dashed rgba(0,0,0,0.1);
    }

    .empty-day {
      text-align: center;
      padding: 30px 10px;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      header {
        box-shadow: none;
        border: none;
        padding: 10px 0;
      }
      .actions, button {
        display: none !important;
      }
      .days-grid {
        grid-template-columns: repeat(7, 1fr) !important;
        gap: 6px;
      }
      .block-card {
        page-break-inside: avoid;
        box-shadow: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-info">
        <h1>
          <span>📅</span>
          <span>${escapeHtml(plannerTitle)}</span>
        </h1>
        <p>محدوده زمانی: <strong>${escapeHtml(weekRange)}</strong> | سند مستقل آفلاین (بدون نیاز به سرور)</p>
      </div>

      <div class="header-stats">
        <div class="stat-badge">
          <span>مجموع ساعات</span>
          <span class="val">${toFaDigits(totalHours)} س</span>
        </div>
        <div class="stat-badge">
          <span>کل بلوک‌ها</span>
          <span class="val">${toFaDigits(blocks.length)}</span>
        </div>
        <div class="stat-badge">
          <span>انجام‌شده</span>
          <span class="val" id="completed-stat">${toFaDigits(completedCount)}</span>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-outline" onclick="window.print()">
          🖨️ چاپ / ذخیره PDF
        </button>
        <button class="btn" onclick="saveUpdatedState()">
          💾 ذخیره تغییرات
        </button>
      </div>
    </header>

    <main class="days-grid">
      ${DAYS.map((d) => {
        const dayBlocks = blocksByDay[d.id] || [];
        return `
        <div class="day-column" id="day-${d.id}">
          <div class="day-header">
            <h3>
              <span class="day-dot" style="background-color: ${d.dotColor};"></span>
              <span>${d.nameFa}</span>
            </h3>
            <span class="count-badge">${toFaDigits(dayBlocks.length)} بلوک</span>
          </div>

          <div class="blocks-container">
            ${
              dayBlocks.length === 0
                ? `<div class="empty-day">بدون برنامه</div>`
                : dayBlocks
                    .map((b) => {
                      const cat = CATEGORIES[b.category] || CATEGORIES.work;
                      const timeStr = `${toFaDigits(minutesToTimeString(b.startMinutes))} - ${toFaDigits(minutesToTimeString(b.startMinutes + b.durationMinutes))}`;
                      const durationStr = formatDurationFa(b.durationMinutes);
                      const isCompleted = !!b.completed;

                      return `
                      <div
                        class="block-card ${isCompleted ? 'completed' : ''}"
                        id="block-${b.id}"
                        data-block-id="${b.id}"
                        style="background-color: ${cat.printBg || '#f1f5f9'}; border-color: ${cat.printBorder || '#cbd5e1'}; color: ${cat.printText || '#0f172a'};"
                        onclick="toggleBlockComplete('${b.id}')"
                        title="برای تغییر وضعیت انجام‌شده کلیک کنید"
                      >
                        <div class="block-time">
                          <span>${timeStr}</span>
                          <span>${durationStr}</span>
                        </div>
                        <div class="block-title">${escapeHtml(b.title)}</div>
                        ${b.subtitle ? `<div class="block-subtitle">${escapeHtml(b.subtitle)}</div>` : ''}
                        ${b.note ? `<div class="block-note">📌 ${escapeHtml(b.note)}</div>` : ''}
                      </div>
                    `;
                    })
                    .join('')
            }
          </div>
        </div>
        `;
      }).join('')}
    </main>
  </div>

  <script>
    let appBlocks = ${serializedData};

    function toggleBlockComplete(blockId) {
      const block = appBlocks.find(b => b.id === blockId);
      if (!block) return;
      block.completed = !block.completed;
      
      const el = document.getElementById('block-' + blockId);
      if (el) {
        if (block.completed) {
          el.classList.add('completed');
        } else {
          el.classList.remove('completed');
        }
      }

      updateStats();
    }

    function updateStats() {
      const completed = appBlocks.filter(b => b.completed).length;
      const el = document.getElementById('completed-stat');
      if (el) {
        el.innerText = completed.toLocaleString('fa-IR');
      }
    }

    function saveUpdatedState() {
      try {
        localStorage.setItem('anti_fragile_timebox_offline', JSON.stringify(appBlocks));
        alert('وضعیت جدید در حافظه مرورگر با موفقیت ذخیره شد!');
      } catch (e) {
        alert('خطا در ذخیره‌سازی محلی.');
      }
    }

    // Try loading persisted changes if previously saved
    try {
      const saved = localStorage.getItem('anti_fragile_timebox_offline');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            const match = appBlocks.find(b => b.id === p.id);
            if (match && p.completed !== undefined) {
              match.completed = p.completed;
              const el = document.getElementById('block-' + p.id);
              if (el) {
                if (match.completed) el.classList.add('completed');
                else el.classList.remove('completed');
              }
            }
          });
          updateStats();
        }
      }
    } catch (e) {}
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
