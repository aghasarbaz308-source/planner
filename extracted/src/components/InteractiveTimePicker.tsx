import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronUp, ChevronDown, Check, AlertTriangle, Sparkles } from 'lucide-react';
import {
  START_HOUR,
  END_HOUR,
  minutesToTimeString,
  toFaDigits,
  formatDurationFa,
} from '../constants/plannerConfig';
import { TimeBlock, DayKey } from '../types';

interface InteractiveTimePickerProps {
  valueMinutes: number;
  durationMinutes: number;
  onChange: (newMinutes: number) => void;
  day?: DayKey;
  existingBlocks?: TimeBlock[];
  currentBlockId?: string;
  className?: string;
}

export const InteractiveTimePicker: React.FC<InteractiveTimePickerProps> = ({
  valueMinutes,
  durationMinutes,
  onChange,
  day,
  existingBlocks = [],
  currentBlockId,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'hours' | 'minutes'>('hours');
  const [isDialOpen, setIsDialOpen] = useState<boolean>(true);
  const clockRef = useRef<HTMLDivElement>(null);

  // Derive current hour and minute
  const currentHour = Math.floor(valueMinutes / 60);
  const currentMinute = valueMinutes % 60;

  // Collision calculation with other blocks on this day
  const collisions = React.useMemo(() => {
    if (!day || !existingBlocks || existingBlocks.length === 0) return [];
    const blockEnd = valueMinutes + durationMinutes;
    return existingBlocks.filter((b) => {
      if (b.id === currentBlockId) return false;
      if (b.day !== day) return false;
      const bEnd = b.startMinutes + b.durationMinutes;
      return valueMinutes < bEnd && b.startMinutes < blockEnd;
    });
  }, [day, existingBlocks, currentBlockId, valueMinutes, durationMinutes]);

  const hasCollision = collisions.length > 0;

  // Handle setting hour
  const handleSetHour = (h: number) => {
    const clampedH = Math.max(START_HOUR, Math.min(END_HOUR - 1, h));
    const newMinutes = clampedH * 60 + currentMinute;
    onChange(newMinutes);
    // Auto switch to minute picker for intuitive progressive flow
    setActiveTab('minutes');
  };

  // Handle setting minute
  const handleSetMinute = (m: number) => {
    const clampedM = Math.max(0, Math.min(59, m));
    const newMinutes = currentHour * 60 + clampedM;
    onChange(newMinutes);
  };

  // Steppers (+1, -1, +5, -5, +15, -15, +60, -60)
  const handleStep = (deltaMinutes: number) => {
    const minAllowed = START_HOUR * 60;
    const maxAllowed = END_HOUR * 60 - Math.min(durationMinutes, 15);
    const updated = Math.max(minAllowed, Math.min(maxAllowed, valueMinutes + deltaMinutes));
    onChange(updated);
  };

  // Calculate clock hand angle
  // Hour hand: 12-hour or full 24-hour dial. In this planner hours are 07 to 23/24.
  // We can render standard 12-hour dial with morning/afternoon tags, or clean 24-hour dual ring.
  // 12-hour dial angle: (hour % 12) * 30 + minute * 0.5
  const hourAngle = ((currentHour % 12) + currentMinute / 60) * 30;
  // Minute hand angle: minute * 6
  const minuteAngle = currentMinute * 6;

  // Available hours in planner scope: 07:00 to 23:00
  const validHours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  // Common minute presets
  const minutePresets = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Handle clock face click/drag interaction
  const handleClockPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clickX = e.clientX - centerX;
    const clickY = e.clientY - centerY;

    // Calculate angle in degrees from top (12 o'clock = 0 deg)
    let angleRad = Math.atan2(clickY, clickX) + Math.PI / 2;
    if (angleRad < 0) angleRad += 2 * Math.PI;
    const angleDeg = (angleRad * 180) / Math.PI;

    if (activeTab === 'hours') {
      // 12 sectors of 30 degrees
      const rawHour = Math.round(angleDeg / 30) % 12;
      const normalizedHour = rawHour === 0 ? 12 : rawHour;
      
      // Determine if PM or AM based on current selection or dist from center
      const distFromCenter = Math.sqrt(clickX * clickX + clickY * clickY);
      const radius = rect.width / 2;
      let finalHour: number;

      if (distFromCenter < radius * 0.65) {
        // Inner ring: Afternoon / Evening (13 to 23)
        finalHour = normalizedHour === 12 ? 12 : normalizedHour + 12;
      } else {
        // Outer ring: Morning / Early (7 to 12)
        finalHour = normalizedHour;
      }

      if (finalHour < START_HOUR) {
        // If hour < 7, default to afternoon equivalent (e.g. 1 -> 13)
        finalHour = finalHour + 12;
      }
      if (finalHour >= END_HOUR) finalHour = END_HOUR - 1;

      handleSetHour(finalHour);
    } else {
      // Minutes: 60 minutes in 360 degrees (6 deg per minute)
      // Snap to nearest 5 minutes unless precision dragged
      const rawMin = Math.round(angleDeg / 6) % 60;
      handleSetMinute(rawMin);
    }
  };

  return (
    <div className={`bg-slate-50/90 rounded-2xl border border-slate-200/90 p-3.5 space-y-3 font-['Vazirmatn',sans-serif] ${className}`}>
      {/* Top Header Row: Digital Clock Box + Mode Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Clock className="w-4 h-4 text-indigo-600 stroke-[2.2]" />
          <span>انتخاب زمان دقیق:</span>
        </div>

        {/* Digital Time Capsule with High Contrast & Pulsing Glow - Strictly LTR (Hours:Minutes) */}
        <div
          dir="ltr"
          className="flex flex-row items-center justify-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-300 shadow-2xs font-mono select-none"
        >
          {/* Hour Segment (Strictly on left in LTR) */}
          <button
            type="button"
            onClick={() => setActiveTab('hours')}
            className={`px-2 py-0.5 rounded-lg text-sm sm:text-base font-black transition-all cursor-pointer ${
              activeTab === 'hours'
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200 scale-105'
                : 'text-slate-800 hover:bg-slate-100'
            }`}
            title="کلیک برای تنظیم ساعت"
          >
            {toFaDigits(String(currentHour).padStart(2, '0'))}
          </button>

          <span className="text-slate-400 font-bold animate-pulse">:</span>

          {/* Minute Segment (Strictly on right in LTR) */}
          <button
            type="button"
            onClick={() => setActiveTab('minutes')}
            className={`px-2 py-0.5 rounded-lg text-sm sm:text-base font-black transition-all cursor-pointer ${
              activeTab === 'minutes'
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200 scale-105'
                : 'text-slate-800 hover:bg-slate-100'
            }`}
            title="کلیک برای تنظیم دقیقه"
          >
            {toFaDigits(String(currentMinute).padStart(2, '0'))}
          </button>

          <span dir="rtl" className="text-[10px] text-slate-500 font-sans font-bold ms-1">
            {currentHour >= 12 ? 'عصر' : 'صبح'}
          </span>
        </div>
      </div>

      {/* Stepper Buttons for Pinpoint Ergonomic Nudging */}
      <div className="flex items-center justify-between gap-1 flex-wrap text-xs">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500">ساعت:</span>
          <button
            type="button"
            onClick={() => handleStep(-60)}
            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
            title="یک ساعت قبل"
          >
            ۱س-
          </button>
          <button
            type="button"
            onClick={() => handleStep(60)}
            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
            title="یک ساعت بعد"
          >
            ۱س+
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500">دقیقه:</span>
          <button
            type="button"
            onClick={() => handleStep(-15)}
            className="px-1.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
            title="۱۵ دقیقه قبل"
          >
            ۱۵د-
          </button>
          <button
            type="button"
            onClick={() => handleStep(-5)}
            className="px-1.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
            title="۵ دقیقه قبل"
          >
            ۵د-
          </button>
          <button
            type="button"
            onClick={() => handleStep(5)}
            className="px-1.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
            title="۵ دقیقه بعد"
          >
            ۵د+
          </button>
          <button
            type="button"
            onClick={() => handleStep(15)}
            className="px-1.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
            title="۱۵ دقیقه بعد"
          >
            ۱۵د+
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('hours')}
          className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'hours'
              ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          صفحه ساعت (<span dir="ltr">{toFaDigits(currentHour)}:۰۰</span>)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('minutes')}
          className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'minutes'
              ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          صفحه دقیقه (<span dir="ltr">:{toFaDigits(String(currentMinute).padStart(2, '0'))}</span>)
        </button>
      </div>

      {/* Circular Animated Dial Face */}
      {isDialOpen && (
        <div className="flex flex-col items-center justify-center pt-2 pb-1">
          <div
            ref={clockRef}
            onPointerDown={handleClockPointer}
            className="relative w-52 h-52 sm:w-56 sm:h-56 rounded-full bg-white border-2 border-slate-200 shadow-inner flex items-center justify-center select-none cursor-pointer touch-none transition-all hover:border-indigo-300"
            title={activeTab === 'hours' ? 'برای انتخاب ساعت کلیک کنید' : 'برای انتخاب دقیقه کلیک کنید'}
          >
            {/* Center Pivot */}
            <div className="absolute w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-sm z-20" />

            {/* Animated Hand */}
            <div
              className="absolute top-1/2 left-1/2 origin-top -translate-x-1/2 transition-transform duration-300 ease-out pointer-events-none z-10"
              style={{
                height: activeTab === 'hours' && currentHour >= 13 && currentHour <= 23 ? '52px' : '78px',
                transform: `rotate(${activeTab === 'hours' ? hourAngle + 180 : minuteAngle + 180}deg)`,
              }}
            >
              {/* Hand Stem */}
              <div className="w-1 h-full bg-indigo-600 mx-auto rounded-full shadow-2xs" />
              {/* Hand Head Bulb */}
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-md -translate-y-2 -translate-x-2.5 ring-2 ring-indigo-200">
                {toFaDigits(activeTab === 'hours' ? currentHour : currentMinute)}
              </div>
            </div>

            {/* Clock Numbers / Markers */}
            {activeTab === 'hours' ? (
              <>
                {/* 12 Outer Standard Markers (Morning & Noon: 07 to 12) */}
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const radius = 84; // px from center
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const isSelected = currentHour === h;
                  const isAvailable = h >= START_HOUR || h === 12;

                  return (
                    <div
                      key={`outer-${h}`}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-transform ${
                        isSelected
                          ? 'font-black text-indigo-700 scale-125'
                          : isAvailable
                          ? 'text-slate-700 hover:text-indigo-600'
                          : 'text-slate-300'
                      }`}
                    >
                      {toFaDigits(h)}
                    </div>
                  );
                })}

                {/* Inner Ring for Afternoon / 24h (13 to 23) */}
                {[24, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((h, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const radius = 54; // px from center
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const isSelected = currentHour === h;

                  return (
                    <div
                      key={`inner-${h}`}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-[9.5px] font-semibold transition-transform ${
                        isSelected
                          ? 'font-black text-indigo-700 scale-125'
                          : 'text-slate-500 hover:text-indigo-600'
                      }`}
                    >
                      {toFaDigits(h === 24 ? '۰۰' : h)}
                    </div>
                  );
                })}
              </>
            ) : (
              /* Minute Markers (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55) */
              minutePresets.map((m, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const radius = 80;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const isSelected = currentMinute === m;

                return (
                  <div
                    key={`min-${m}`}
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                    className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-mono font-bold transition-transform ${
                      isSelected
                        ? 'font-black text-indigo-700 scale-125'
                        : 'text-slate-600 hover:text-indigo-600'
                    }`}
                  >
                    {toFaDigits(String(m).padStart(2, '0'))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Quick Minute Selection Chips (00, 15, 30, 45, 10, 20, ...) */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
          <span>دقیقه‌های رایج:</span>
          <span dir="ltr" className="text-indigo-600 font-mono inline-block">
            {toFaDigits(minutesToTimeString(valueMinutes))} ({formatDurationFa(durationMinutes)})
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {minutePresets.map((m) => {
            const isMatch = currentMinute === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleSetMinute(m)}
                className={`py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                  isMatch
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span dir="ltr">:{toFaDigits(String(m).padStart(2, '0'))}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Timeline Mini-Bar (Shows other blocks and highlights collisions visually) */}
      {day && (
        <div className="space-y-1 pt-1 border-t border-slate-200/80">
          <div className="flex items-center justify-between text-[9.5px] text-slate-500 font-semibold">
            <span>توزیع زمانی روز (۰۷:۰۰ تا ۲۴:۰۰):</span>
            {hasCollision ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{toFaDigits(collisions.length)} مورد تداخل هم‌پوشانی</span>
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>زمان آزاد و بدون تداخل</span>
              </span>
            )}
          </div>

          <div className="relative h-4 bg-slate-200/90 rounded-md overflow-hidden border border-slate-300/80">
            {/* Hour tick marks */}
            {Array.from({ length: 18 }, (_, idx) => (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-px bg-slate-300/60"
                style={{ left: `${(idx / 17) * 100}%` }}
              />
            ))}

            {/* Other blocks on this day */}
            {existingBlocks
              .filter((b) => b.day === day && b.id !== currentBlockId)
              .map((b) => {
                const totalMins = (END_HOUR - START_HOUR) * 60;
                const left = Math.max(0, ((b.startMinutes - START_HOUR * 60) / totalMins) * 100);
                const width = Math.min(100 - left, (b.durationMinutes / totalMins) * 100);
                return (
                  <div
                    key={b.id}
                    className="absolute top-0.5 bottom-0.5 rounded-xs bg-slate-400/80 border border-slate-500/30"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${b.title} (${minutesToTimeString(b.startMinutes)} تا ${minutesToTimeString(
                      b.startMinutes + b.durationMinutes
                    )})`}
                  />
                );
              })}

            {/* Current candidate block */}
            {(() => {
              const totalMins = (END_HOUR - START_HOUR) * 60;
              const left = Math.max(0, ((valueMinutes - START_HOUR * 60) / totalMins) * 100);
              const width = Math.min(100 - left, (durationMinutes / totalMins) * 100);
              return (
                <div
                  className={`absolute top-0 bottom-0 rounded-xs transition-all border ${
                    hasCollision
                      ? 'bg-rose-500/80 border-rose-600 animate-pulse'
                      : 'bg-indigo-600/90 border-indigo-700'
                  }`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`موقعیت فعلی: ${minutesToTimeString(valueMinutes)} تا ${minutesToTimeString(
                    valueMinutes + durationMinutes
                  )}`}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
