import { ReminderConfig, TimeBlock } from '../types';

const REMINDER_CONFIG_KEY = 'anti_fragile_reminder_config_v2';
const LAST_ALERTED_KEY = 'anti_fragile_last_alerted_timestamps';

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: true,
  soundEnabled: true,
  volume: 0.75,
  soundType: 'zen',
  blockAlertLeadMinutes: 0, // alert at exact start
  dailyAuditReminderEnabled: true,
  dailyAuditReminderTime: '22:00', // Nightly audit before bed/movie
  movieSleepReminderEnabled: true,
  movieSleepReminderTime: '23:30',
  browserNotificationEnabled: false,
};

export interface ActiveAlertNotification {
  id: string;
  type: 'block_start' | 'daily_audit' | 'movie_sleep' | 'break_needed';
  title: string;
  message: string;
  timestamp: string;
  timeString: string;
  categoryLabel?: string;
  actionLabel?: string;
  actionType?: 'open_daily_report' | 'view_block' | 'dismiss';
}

class AudioChimeEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Play crystal-clear soothing synthesized sound based on user preference
   */
  public play(soundType: ReminderConfig['soundType'] = 'zen', volume: number = 0.75) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const safeVol = Math.max(0, Math.min(1, volume));
      const now = ctx.currentTime;

      if (soundType === 'zen') {
        // Soothing Zen Singing Bowl / Gong (528 Hz Solfeggio frequency + gentle harmonics)
        const fundamental = 528; // Hz
        const harmonics = [1, 2.01, 3.02, 4.2];
        const gains = [0.6, 0.25, 0.1, 0.05];

        harmonics.forEach((ratio, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(fundamental * ratio, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(gains[idx] * safeVol, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 2.85);
        });
      } else if (soundType === 'marimba') {
        // Ascending pleasant Marimba Chime: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.5)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const noteStart = now + idx * 0.12;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0, noteStart);
          gain.gain.linearRampToValueAtTime(0.5 * safeVol, noteStart + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteStart);
          osc.stop(noteStart + 0.82);
        });
      } else if (soundType === 'bell') {
        // Clear focus bell (880 Hz A5 with sparkle)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1760, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.6 * safeVol, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.65);
        osc2.stop(now + 1.65);
      } else {
        // Evening deep calming chime (432 Hz warm healing tone)
        const osc = ctx.createOscillator();
        const oscWarm = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, now);

        oscWarm.type = 'triangle';
        oscWarm.frequency.setValueAtTime(216, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.55 * safeVol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(gain);
        oscWarm.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        oscWarm.start(now);
        osc.stop(now + 3.25);
        oscWarm.stop(now + 3.25);
      }
    } catch (e) {
      console.warn('Audio chime play error', e);
    }
  }
}

export const chimeEngine = new AudioChimeEngine();

export class ReminderService {
  private static alertListeners: Array<(alert: ActiveAlertNotification) => void> = [];

  public static getConfig(): ReminderConfig {
    try {
      const str = localStorage.getItem(REMINDER_CONFIG_KEY);
      if (str) {
        return { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(str) };
      }
    } catch {}
    return DEFAULT_REMINDER_CONFIG;
  }

  public static saveConfig(cfg: ReminderConfig): void {
    try {
      localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(cfg));
    } catch {}
  }

  public static playTestSound(soundType?: ReminderConfig['soundType'], volume?: number): void {
    const cfg = this.getConfig();
    chimeEngine.play(soundType || cfg.soundType, volume !== undefined ? volume : cfg.volume);
  }

  public static subscribe(listener: (alert: ActiveAlertNotification) => void): () => void {
    this.alertListeners.push(listener);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== listener);
    };
  }

  public static triggerAlert(alert: ActiveAlertNotification, soundType?: ReminderConfig['soundType']): void {
    const cfg = this.getConfig();
    if (!cfg.enabled) return;

    // Play chime
    if (cfg.soundEnabled) {
      chimeEngine.play(soundType || cfg.soundType, cfg.volume);
    }

    // Trigger browser notification if allowed
    if (cfg.browserNotificationEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(alert.title, {
            body: alert.message,
            icon: '/favicon.ico',
          });
        } catch {}
      }
    }

    // Notify in-app subscribers
    this.alertListeners.forEach((fn) => {
      try {
        fn(alert);
      } catch (err) {
        console.warn('Error in reminder listener', err);
      }
    });
  }

  /**
   * Evaluates current time vs blocks and daily report schedule, avoiding duplicate alerts
   */
  public static evaluateReminders(blocks: TimeBlock[]): void {
    const cfg = this.getConfig();
    if (!cfg.enabled) return;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const totalMinutesNow = currentHours * 60 + currentMinutes;
    const timeStringNow = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
    const todayDateStr = now.toISOString().split('T')[0];

    // Load record of already fired alerts for today
    let fired: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(LAST_ALERTED_KEY);
      if (raw) fired = JSON.parse(raw);
    } catch {}

    // 1. Daily Audit Report Reminder
    if (cfg.dailyAuditReminderEnabled && cfg.dailyAuditReminderTime) {
      const auditKey = `audit-${todayDateStr}-${cfg.dailyAuditReminderTime}`;
      if (!fired[auditKey]) {
        const [auditH, auditM] = cfg.dailyAuditReminderTime.split(':').map(Number);
        const auditTotalM = auditH * 60 + auditM;
        if (Math.abs(totalMinutesNow - auditTotalM) <= 1) {
          fired[auditKey] = true;
          try {
            localStorage.setItem(LAST_ALERTED_KEY, JSON.stringify(fired));
          } catch {}

          this.triggerAlert(
            {
              id: `alert-audit-${Date.now()}`,
              type: 'daily_audit',
              title: '🌙 زمان ثبت کارنامه امروز فرا رسید!',
              message: 'قبل از استراحت شبانه یا سانس فیلم، ممیزی کارهای امروزت رو تکمیل کن تا روزت با آرامش بسته بشه.',
              timestamp: new Date().toISOString(),
              timeString: timeStringNow,
              actionLabel: 'تکمیل کارنامه روز',
              actionType: 'open_daily_report',
            },
            'evening'
          );
          return;
        }
      }
    }

    // 2. Movie / Sleep Reminder
    if (cfg.movieSleepReminderEnabled && cfg.movieSleepReminderTime) {
      const sleepKey = `sleep-${todayDateStr}-${cfg.movieSleepReminderTime}`;
      if (!fired[sleepKey]) {
        const [sleepH, sleepM] = cfg.movieSleepReminderTime.split(':').map(Number);
        const sleepTotalM = sleepH * 60 + sleepM;
        if (Math.abs(totalMinutesNow - sleepTotalM) <= 1) {
          fired[sleepKey] = true;
          try {
            localStorage.setItem(LAST_ALERTED_KEY, JSON.stringify(fired));
          } catch {}

          this.triggerAlert(
            {
              id: `alert-sleep-${Date.now()}`,
              type: 'movie_sleep',
              title: '🎬 وقت آرامش، فیلم یا آماده‌سازی خواب',
              message: 'روشنایی صفحات نمایش را کم کن و به ریتم ملاتونین بدنت احترام بگذار.',
              timestamp: new Date().toISOString(),
              timeString: timeStringNow,
              actionLabel: 'متوجه شدم',
              actionType: 'dismiss',
            },
            'zen'
          );
          return;
        }
      }
    }

    // 3. Upcoming Time Block Reminder
    // Find Persian day of week (JS: 0=Sun..6=Sat -> sat, sun, mon, tue, wed, thu, fri)
    const dayMap: Record<number, string> = {
      0: 'sun',
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
      6: 'sat',
    };
    const currentDayKey = dayMap[now.getDay()];

    const leadM = cfg.blockAlertLeadMinutes || 0;

    blocks.forEach((block) => {
      if (block.day !== currentDayKey || block.completed) return;
      const targetAlertMinutes = block.startMinutes - leadM;
      if (Math.abs(totalMinutesNow - targetAlertMinutes) <= 1) {
        const blockKey = `block-${todayDateStr}-${block.id}-${block.startMinutes}`;
        if (!fired[blockKey]) {
          fired[blockKey] = true;
          try {
            localStorage.setItem(LAST_ALERTED_KEY, JSON.stringify(fired));
          } catch {}

          const prefix = leadM > 0 ? `${leadM} دقیقه تا شروع:` : 'الان وقت شروع:';
          this.triggerAlert({
            id: `alert-block-${block.id}-${Date.now()}`,
            type: 'block_start',
            title: `🔔 ${prefix} ${block.title}`,
            message: block.subtitle || 'تمرکز عمیق بدون حواس‌پرتی را آغاز کن.',
            timestamp: new Date().toISOString(),
            timeString: timeStringNow,
            actionLabel: 'مشاهده بلوک',
            actionType: 'view_block',
          });
        }
      }
    });
  }

  private static timerId: any = null;

  public static startTick(
    blocks: TimeBlock[],
    onAlert?: (alert: ActiveAlertNotification) => void
  ): () => void {
    if (onAlert) {
      this.subscribe(onAlert);
    }
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    // Check immediately
    this.evaluateReminders(blocks);
    // Check every 30 seconds
    this.timerId = setInterval(() => {
      this.evaluateReminders(blocks);
    }, 30000);

    return () => this.stopTick();
  }

  public static stopTick(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const reminderService = {
  init: (blocks: TimeBlock[], onAlert?: (alert: ActiveAlertNotification) => void) => {
    return ReminderService.startTick(blocks, onAlert);
  },
  destroy: () => {
    ReminderService.stopTick();
  },
  getConfig: () => ReminderService.getConfig(),
  saveConfig: (cfg: ReminderConfig) => ReminderService.saveConfig(cfg),
  playTestSound: (st?: ReminderConfig['soundType'], vol?: number) => ReminderService.playTestSound(st, vol),
  triggerAlert: (alert: ActiveAlertNotification, st?: ReminderConfig['soundType']) => ReminderService.triggerAlert(alert, st),
  subscribe: (listener: (alert: ActiveAlertNotification) => void) => ReminderService.subscribe(listener),
};
