import React from 'react';
import {
  Compass,
  MessageSquare,
  CalendarCheck,
  FolderArchive,
  TrendingUp,
  Moon,
  Sun,
  Timer,
  Home,
} from 'lucide-react';
import { useStudyPilot, MainNavTab } from '../context/StudyPilotContext';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    profile,
    timerState,
    progressPercent,
  } = useStudyPilot();

  // Format active timer for header badge
  const formatTimerMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const navItems: { id: MainNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'buddy', label: 'Study Buddy', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'plan', label: 'My Plan', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'materials', label: 'Materials', icon: <FolderArchive className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <header
      id="app-main-header"
      className="h-16 min-h-[64px] px-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between select-none z-30 shrink-0"
    >
      {/* Brand & Main Navigation */}
      <div className="flex items-center gap-2 sm:gap-6">
        {/* Logo / Home Button */}
        <button
          id="brand-home-button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg py-1 px-1.5"
          title="Return to Home Dashboard"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              StudyPilot<span className="text-indigo-600 dark:text-indigo-400 font-extrabold ml-0.5">AI</span>
            </span>
          </div>
        </button>

        {/* Home shortcut icon */}
        <button
          id="nav-home-button"
          onClick={() => setActiveTab('home')}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'home'
              ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
          title="Home Dashboard"
        >
          <Home className="w-4 h-4" />
          <span className="hidden md:inline">Home</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Primary 4 Navigation Items */}
        <nav className="flex items-center gap-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span className="whitespace-nowrap">{item.label}</span>
                {item.id === 'progress' && (
                  <span className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    {progressPercent}%
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right controls: Live Focus Timer, Theme Toggle, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Focus Timer Indicator */}
        {timerState.isActive ? (
          <button
            id="header-active-timer-chip"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-mono font-bold animate-pulse cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors shadow-xs"
            title="Active Focus Session - Click to view"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <Timer className="w-3.5 h-3.5" />
            <span>{formatTimerMinSec(timerState.remainingSeconds)}</span>
          </button>
        ) : (
          <button
            id="header-timer-shortcut"
            onClick={() => setActiveTab('home')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Open Focus Timer"
          >
            <Timer className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-mono">25:00</span>
          </button>
        )}

        {/* Global Dark / Light Mode Toggle */}
        <button
          id="theme-toggle-header-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Student Avatar / Name */}
        <div
          id="profile-header-chip"
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750"
        >
          <div className="w-6 h-6 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center shadow-xs">
            {profile.name ? profile.name[0] : 'A'}
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
            {profile.name || 'Arya'}
          </span>
        </div>
      </div>
    </header>
  );
};
