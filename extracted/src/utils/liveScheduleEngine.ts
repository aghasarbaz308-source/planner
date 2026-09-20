import { DayKey, TimeBlock } from '../types';
import { START_HOUR, END_HOUR, DAYS } from '../constants/plannerConfig';

export interface LiveScheduleStatus {
  currentDayKey: DayKey;
  currentDayFa: string;
  currentMinutes: number;
  currentSeconds: number;
  formattedTime: string;
  activeBlock: TimeBlock | null;
  nextBlock: TimeBlock | null;
  remainingMinutesInActive: number;
  remainingSecondsInActive: number;
  progressPercent: number;
  isBreakOrRecovery: boolean;
  upcomingToday: TimeBlock[];
}

/**
 * Maps JS Date.getDay() (0=Sun, 1=Mon, ..., 6=Sat) to Persian DayKey
 */
export function getDayKeyFromDate(date: Date): DayKey {
  const jsDay = date.getDay();
  switch (jsDay) {
    case 6:
      return 'sat';
    case 0:
      return 'sun';
    case 1:
      return 'mon';
    case 2:
      return 'tue';
    case 3:
      return 'wed';
    case 4:
      return 'thu';
    case 5:
      return 'fri';
    default:
      return 'sat';
  }
}

/**
 * Evaluates live schedule status given blocks and optional reference date
 */
export function getLiveScheduleStatus(blocks: TimeBlock[], referenceDate: Date = new Date()): LiveScheduleStatus {
  const currentDayKey = getDayKeyFromDate(referenceDate);
  const currentDayFa = DAYS.find((d) => d.id === currentDayKey)?.nameFa || 'امروز';

  const hours = referenceDate.getHours();
  const minutes = referenceDate.getMinutes();
  const seconds = referenceDate.getSeconds();
  const currentMinutes = hours * 60 + minutes;
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  const todayBlocks = blocks
    .filter((b) => b.day === currentDayKey)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  // Active block: start <= currentMinutes < start + duration
  const activeBlock =
    todayBlocks.find(
      (b) => currentMinutes >= b.startMinutes && currentMinutes < b.startMinutes + b.durationMinutes
    ) || null;

  let remainingMinutesInActive = 0;
  let remainingSecondsInActive = 0;
  let progressPercent = 0;
  let isBreakOrRecovery = false;

  if (activeBlock) {
    const endMinutes = activeBlock.startMinutes + activeBlock.durationMinutes;
    const totalBlockSeconds = activeBlock.durationMinutes * 60;
    const elapsedSeconds = (currentMinutes - activeBlock.startMinutes) * 60 + seconds;
    const remainingTotalSec = Math.max(0, totalBlockSeconds - elapsedSeconds);

    remainingMinutesInActive = Math.floor(remainingTotalSec / 60);
    remainingSecondsInActive = remainingTotalSec % 60;

    progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSeconds / totalBlockSeconds) * 100)));

    const cat = activeBlock.category.toLowerCase();
    const title = (activeBlock.title || '').toLowerCase();
    isBreakOrRecovery =
      cat === 'recovery' ||
      cat === 'gaming' ||
      title.includes('استراحت') ||
      title.includes('ناهار') ||
      title.includes('خواب') ||
      title.includes('تفریح');
  }

  // Find next upcoming block today
  const upcomingToday = todayBlocks.filter((b) => b.startMinutes > currentMinutes);
  let nextBlock = upcomingToday.length > 0 ? upcomingToday[0] : null;

  // If no more blocks today, check first block of tomorrow
  if (!nextBlock) {
    const dayIndex = DAYS.findIndex((d) => d.id === currentDayKey);
    const nextDayIndex = (dayIndex + 1) % DAYS.length;
    const nextDayKey = DAYS[nextDayIndex].id;
    const tomorrowBlocks = blocks
      .filter((b) => b.day === nextDayKey)
      .sort((a, b) => a.startMinutes - b.startMinutes);
    if (tomorrowBlocks.length > 0) {
      nextBlock = tomorrowBlocks[0];
    }
  }

  return {
    currentDayKey,
    currentDayFa,
    currentMinutes,
    currentSeconds: seconds,
    formattedTime,
    activeBlock,
    nextBlock,
    remainingMinutesInActive,
    remainingSecondsInActive,
    progressPercent,
    isBreakOrRecovery,
    upcomingToday,
  };
}

/**
 * Client-Side Ambient Sound Synthesizer via Web Audio API
 * Generates White/Brown noise, gentle rain sound, and 432Hz Solfeggio Focus tone safely without external media files.
 */
class AmbientSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private currentMode: 'rain' | 'alpha432' | 'whitenoise' | null = null;

  private initCtx(): AudioContext | null {
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

  public play(mode: 'rain' | 'alpha432' | 'whitenoise', volume = 0.5) {
    this.stop();
    const ctx = this.initCtx();
    if (!ctx) return;

    this.currentMode = mode;
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), ctx.currentTime);
    this.gainNode.connect(ctx.destination);

    if (mode === 'alpha432') {
      // Warm 432 Hz + 442 Hz binaural 10 Hz Alpha beat
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(432, ctx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(442, ctx.currentTime); // 10Hz binaural delta/alpha

      const merger = ctx.createChannelMerger(2);
      osc1.connect(merger, 0, 0);
      osc2.connect(merger, 0, 1);
      merger.connect(this.gainNode);

      osc1.start();
      osc2.start();
      this.noiseNode = osc1; // reference
    } else {
      // Noise buffer (Brown for rain, White for focus)
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (mode === 'rain') {
          // Brownish filter for warm rain
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        } else {
          output[i] = white * 0.15;
        }
      }

      const whiteNoiseSource = ctx.createBufferSource();
      whiteNoiseSource.buffer = noiseBuffer;
      whiteNoiseSource.loop = true;

      // Filter for rain warmth
      if (mode === 'rain') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        whiteNoiseSource.connect(filter);
        filter.connect(this.gainNode);
      } else {
        whiteNoiseSource.connect(this.gainNode);
      }

      whiteNoiseSource.start();
      this.noiseNode = whiteNoiseSource;
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public stop() {
    try {
      if (this.noiseNode) {
        if ('stop' in this.noiseNode) {
          (this.noiseNode as any).stop();
        }
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      this.currentMode = null;
    } catch {}
  }

  public isPlaying(): boolean {
    return this.currentMode !== null;
  }

  public getMode(): 'rain' | 'alpha432' | 'whitenoise' | null {
    return this.currentMode;
  }
}

export const ambientSound = new AmbientSoundSynthesizer();
