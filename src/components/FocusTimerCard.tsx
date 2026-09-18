import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Timer, CheckCircle, Bell } from 'lucide-react';
import { useStudyPilot } from '../context/StudyPilotContext';

interface FocusTimerCardProps {
  compact?: boolean;
}

export const FocusTimerCard: React.FC<FocusTimerCardProps> = ({ compact = false }) => {
  const {
    timerState,
    startFocusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    resetFocusTimer,
    timerCompletionMessage,
    dismissTimerCompletion,
  } = useStudyPilot();

  const [customMinutesInput, setCustomMinutesInput] = useState<string>('30');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressFraction =
    timerState.totalSeconds > 0
      ? 1 - timerState.remainingSeconds / timerState.totalSeconds
      : 0;

  const handlePresetSelect = (minutes: number) => {
    setShowCustomInput(false);
    resetFocusTimer(minutes);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutesInput, 10);
    if (!isNaN(val) && val > 0 && val <= 180) {
      resetFocusTimer(val);
      setShowCustomInput(false);
    }
  };

  return (
    <div
      id="focus-timer-container"
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden"
    >
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 pointer-events-none blur-2xl" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Focus Session
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {timerState.isActive
                ? timerState.isPaused
                  ? 'Session paused'
                  : 'Focus in progress'
                : 'Single focused work block'}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        {timerState.isActive && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              timerState.isPaused
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                timerState.isPaused ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {timerState.isPaused ? 'Paused' : 'Active'}
          </span>
        )}
      </div>

      {/* Completion alert banner */}
      {timerCompletionMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-900 dark:text-emerald-200 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{timerCompletionMessage}</span>
          </div>
          <button
            onClick={dismissTimerCompletion}
            className="text-xs font-bold underline hover:opacity-80 ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Target Task Tag */}
      {timerState.currentTask && (
        <div className="mb-4 px-3 py-1.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            Targeting:{' '}
            <strong className="text-indigo-700 dark:text-indigo-300 font-semibold">
              {timerState.currentTask.subjectName} — {timerState.currentTask.topic}
            </strong>
          </span>
          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
            {timerState.currentTask.durationMinutes}m task
          </span>
        </div>
      )}

      {/* Main Countdown Display */}
      <div className="flex flex-col items-center justify-center my-3">
        <div
          id="focus-timer-countdown-display"
          className="font-mono text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight"
        >
          {formatTime(timerState.remainingSeconds)}
        </div>

        {/* Linear progress bar */}
        <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progressFraction * 100))}%` }}
          />
        </div>
      </div>

      {/* Presets row (disabled while timer is active unless reset) */}
      {!timerState.isActive && (
        <div className="flex items-center justify-center gap-2 mb-5">
          <button
            id="preset-25-btn"
            type="button"
            onClick={() => handlePresetSelect(25)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timerState.preset === 25 && !showCustomInput
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            25 min
          </button>
          <button
            id="preset-50-btn"
            type="button"
            onClick={() => handlePresetSelect(50)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timerState.preset === 50 && !showCustomInput
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            50 min
          </button>
          <button
            id="preset-custom-btn"
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              showCustomInput || timerState.preset === 'custom'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            Custom
          </button>
        </div>
      )}

      {/* Custom Duration Input Popover */}
      {showCustomInput && !timerState.isActive && (
        <form onSubmit={handleCustomSubmit} className="mb-4 flex items-center justify-center gap-2">
          <label htmlFor="custom-minutes-field" className="text-xs text-slate-600 dark:text-slate-400">
            Minutes:
          </label>
          <input
            id="custom-minutes-field"
            type="number"
            min="1"
            max="180"
            value={customMinutesInput}
            onChange={(e) => setCustomMinutesInput(e.target.value)}
            className="w-16 px-2 py-1 text-xs text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            Set
          </button>
        </form>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-3">
        {!timerState.isActive ? (
          <button
            id="start-focus-timer-btn"
            onClick={() => startFocusTimer()}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:shadow-md"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Focus</span>
          </button>
        ) : (
          <>
            {timerState.isPaused ? (
              <button
                id="resume-focus-timer-btn"
                onClick={resumeFocusTimer}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                id="pause-focus-timer-btn"
                onClick={pauseFocusTimer}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause</span>
              </button>
            )}

            <button
              id="reset-focus-timer-btn"
              onClick={() => resetFocusTimer()}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
