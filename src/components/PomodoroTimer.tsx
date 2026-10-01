import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Timer, 
  X, 
  Coffee, 
  Flame, 
  Volume2, 
  VolumeX,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60, // 25 min
  shortBreak: 5 * 60, // 5 min
  longBreak: 15 * 60, // 15 min
};

const MODE_LABELS: Record<PomodoroMode, string> = {
  focus: 'Focus Study',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export const PomodoroTimer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(MODE_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Play gentle sound chime using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      // Pleasant harmonious chime (chord progression)
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.45); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      // AudioContext might be blocked until user gesture, ignore safely
    }
  };

  // Timer interval effect
  useEffect(() => {
    let timer: any = null;

    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRunning(false);
            playChime();

            // Trigger celebration on focus session completion
            if (mode === 'focus') {
              setCompletedSessions((c) => c + 1);
              try {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.2 },
                });
              } catch (e) {}
              // Automatically suggest break
              setMode('shortBreak');
              return MODE_DURATIONS.shortBreak;
            } else {
              setMode('focus');
              return MODE_DURATIONS.focus;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, mode, soundEnabled]);

  // Sync document title with countdown when running
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (isRunning) {
      document.title = `(${formatted}) Clarity - AI Student Doubt Solver`;
    } else {
      document.title = `Clarity - AI Student Doubt Solver & Simple Concept Explainer`;
    }
  }, [timeLeft, isRunning]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODE_DURATIONS[mode]);
  };

  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
  };

  const handleSkipNext = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      const nextMode = (completedSessions + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setTimeLeft(MODE_DURATIONS[nextMode]);
    } else {
      setMode('focus');
      setTimeLeft(MODE_DURATIONS.focus);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const totalDuration = MODE_DURATIONS[mode];
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="relative" ref={containerRef}>
      {/* Compact Navbar Pill/Button Trigger */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap select-none ${
            isRunning
              ? 'border-indigo-400 bg-indigo-50/80 text-indigo-900 shadow-2xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
          title="Open Pomodoro Study Timer"
        >
          {/* Animated pulsing dot if running */}
          <span className="relative flex h-2 w-2">
            {isRunning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isRunning ? 'bg-indigo-600' : 'bg-slate-400'
              }`}
            />
          </span>

          <span className="hidden sm:inline text-slate-500 font-normal">
            {mode === 'focus' ? 'Study' : 'Break'}:
          </span>

          <span className="font-mono tabular-nums font-semibold tracking-tight text-slate-900">
            {formattedTime}
          </span>

          {/* Quick Play/Pause mini button */}
          <div
            onClick={toggleRun}
            className="p-1 hover:bg-slate-200/70 rounded transition-colors text-slate-600 hover:text-slate-900"
            title={isRunning ? 'Pause Timer' : 'Start Timer'}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-slate-700" />}
          </div>
        </button>
      </div>

      {/* Floating Popover Modal */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-50 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Pomodoro Study Timer
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  soundEnabled ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'
                }`}
                title={soundEnabled ? 'Sound alerts on' : 'Sound alerts muted'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Selector Segmented Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => switchMode('focus')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'focus'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Focus 25m
            </button>
            <button
              type="button"
              onClick={() => switchMode('shortBreak')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'shortBreak'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Short 5m
            </button>
            <button
              type="button"
              onClick={() => switchMode('longBreak')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'longBreak'
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Long 15m
            </button>
          </div>

          {/* Big Countdown Display */}
          <div className="text-center py-2 relative">
            <div className="text-5xl font-mono tabular-nums font-bold tracking-tight text-slate-900">
              {formattedTime}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              {mode === 'focus' ? 'Deep Work & Concept Learning' : 'Recharge your mind'}
            </p>

            {/* Progress line */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4">
              <div
                className={`h-full transition-all duration-500 ${
                  mode === 'focus' ? 'bg-indigo-600' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Main Control Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 py-2.5 px-5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Session</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start {mode === 'focus' ? 'Focus' : 'Break'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkipNext}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer transition-colors"
              title="Skip to next session"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Session Stats Tracker Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Completed:</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {completedSessions} focus {completedSessions === 1 ? 'sprint' : 'sprints'}
              </span>
            </div>

            <span className="text-[11px] text-slate-400">
              4 sprints = Long Break
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
