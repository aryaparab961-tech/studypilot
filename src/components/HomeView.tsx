import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Send,
  HelpCircle,
  BookOpen,
  Clock,
  ListTodo,
} from 'lucide-react';
import { useStudyPilot } from '../context/StudyPilotContext';
import { FocusTimerCard } from './FocusTimerCard';

export const HomeView: React.FC = () => {
  const {
    profile,
    tasks,
    completedCount,
    totalTaskCount,
    progressPercent,
    setActiveTab,
    startFocusTimer,
    sendChatMessage,
  } = useStudyPilot();

  const [inputMessage, setInputMessage] = useState('');

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Find the top uncompleted high-priority task, or first uncompleted task
  const currentTask =
    tasks.find((t) => t.status !== 'completed' && t.priority === 'high') ||
    tasks.find((t) => t.status !== 'completed') ||
    tasks[0];

  const handleStartStudying = () => {
    if (currentTask) {
      startFocusTimer(currentTask.durationMinutes, currentTask);
    } else {
      startFocusTimer(25);
    }
  };

  const handleQuickAction = (promptText: string) => {
    sendChatMessage(promptText);
    setActiveTab('buddy');
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendChatMessage(inputMessage);
    setInputMessage('');
    setActiveTab('buddy');
  };

  const quickActions = [
    { label: 'What should I study?', query: 'What should I study today?', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { label: 'Explain a topic', query: 'Explain Fourier Transform in detail.', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { label: 'Test me', query: 'Give me 5 questions from my syllabus.', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { label: 'I have 30 minutes', query: 'I only have 30 minutes to study today.', icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  return (
    <div id="home-screen-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Greeting */}
      <div id="home-greeting-header" className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {getGreeting()}, {profile.name || 'Arya'} 👋
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
          Your AI Study Buddy is ready.
        </p>
      </div>

      {/* 1. WHAT SHOULD I STUDY NOW? */}
      <section
        id="section-study-now"
        className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            What Should I Study Now?
          </span>
          {currentTask && currentTask.status === 'completed' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> All tasks finished!
            </span>
          )}
        </div>

        {currentTask ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                {currentTask.subjectName}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {currentTask.topic}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {currentTask.durationMinutes} min
                </span>
                <span>•</span>
                <span
                  className={`font-semibold capitalize ${
                    currentTask.priority === 'high'
                      ? 'text-amber-600 dark:text-amber-400'
                      : currentTask.priority === 'medium'
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {currentTask.priority} priority
                </span>
              </div>
            </div>

            <button
              id="home-start-studying-btn"
              onClick={handleStartStudying}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Studying</span>
            </button>
          </div>
        ) : (
          <div className="py-4 text-center text-slate-500 dark:text-slate-400 text-sm">
            No study tasks scheduled yet.{' '}
            <button
              onClick={() => setActiveTab('plan')}
              className="text-indigo-600 dark:text-indigo-400 font-semibold underline ml-1 cursor-pointer"
            >
              Add a task in My Plan
            </button>
          </div>
        )}
      </section>

      {/* 2. TODAY'S PROGRESS */}
      <section
        id="section-today-progress"
        className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Today's Progress
          </span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
            {progressPercent}%
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {completedCount} / {totalTaskCount} tasks completed
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Calculated dynamically from your active study plan.
            </p>
          </div>

          <button
            id="home-continue-plan-btn"
            onClick={() => setActiveTab('plan')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <span>Continue Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* 3. AI STUDY BUDDY */}
      <section
        id="section-ai-study-buddy"
        className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              AI Study Buddy
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Grounded in uploaded materials
          </span>
        </div>

        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          "What would you like to study?"
        </p>

        {/* Ask input */}
        <form onSubmit={handleChatSubmit} className="relative">
          <input
            id="home-buddy-input"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask your Study Buddy... (e.g. Explain Fourier Transform)"
            className="w-full pl-4 pr-12 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          <button
            id="home-buddy-submit-btn"
            type="submit"
            disabled={!inputMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors cursor-pointer"
            title="Send to Study Buddy"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Action buttons */}
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-2">
            Quick actions:
          </span>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                id={`home-quick-action-${idx}`}
                onClick={() => handleQuickAction(action.query)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FOCUS SESSION */}
      <section id="section-focus-session">
        <FocusTimerCard />
      </section>
    </div>
  );
};
