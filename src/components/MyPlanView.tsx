import React, { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  Play,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Sparkles,
  Timer,
  Check,
} from 'lucide-react';
import { useStudyPilot } from '../context/StudyPilotContext';
import { AddTaskModal } from './AddTaskModal';
import { StudyTask } from '../types';

export const MyPlanView: React.FC = () => {
  const {
    tasks,
    addTask,
    toggleTaskComplete,
    deleteTask,
    completedCount,
    totalTaskCount,
    progressPercent,
    startFocusTimer,
    timerState,
    setActiveTab,
    sendChatMessage,
  } = useStudyPilot();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleStartTask = (task: StudyTask) => {
    startFocusTimer(task.durationMinutes, task);
  };

  const handleAskAIToRebalance = () => {
    sendChatMessage(
      "Please analyze my current study schedule and rebalance my tasks based on my target exam score and syllabus."
    );
    setActiveTab('buddy');
  };

  return (
    <div id="my-plan-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Banner & Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Today's Study Plan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track, start, and complete your planned daily study sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="plan-ask-ai-rebalance-btn"
            onClick={handleAskAIToRebalance}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Rebalance</span>
          </button>

          <button
            id="plan-add-task-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Real Progress Card */}
      <div
        id="plan-progress-metrics-card"
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Daily Progress
          </span>
          <span className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
            {progressPercent}%
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {completedCount} / {totalTaskCount} tasks completed
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {totalTaskCount - completedCount === 0
              ? 'All done for today!'
              : `${totalTaskCount - completedCount} tasks remaining`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Today's Schedule
          </h2>
          <span className="text-xs text-slate-500">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <CalendarCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              You have no tasks scheduled for today.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              + Create Your First Task
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isFocusingThis =
                timerState.isActive && timerState.currentTask?.id === task.id;

              return (
                <div
                  key={task.id}
                  id={`task-item-${task.id}`}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 opacity-75'
                      : isFocusingThis
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Left: Checkbox, Subject, Topic, Meta */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTaskComplete(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-800'
                      }`}
                      title={isCompleted ? 'Mark uncompleted' : 'Mark completed'}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/60">
                          {task.subjectName}
                        </span>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            task.priority === 'high'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                              : task.priority === 'medium'
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {task.priority === 'high'
                            ? 'High priority'
                            : task.priority === 'medium'
                            ? 'Medium priority'
                            : 'Revision'}
                        </span>

                        {task.method && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
                            • {task.method}
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-bold ${
                          isCompleted
                            ? 'line-through text-slate-500 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.topic}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {task.durationMinutes} min
                        </span>
                        {task.completedAt && (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            • Finished at {task.completedAt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: [Start] and [Complete] */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* [Start] Button */}
                    {!isCompleted && (
                      <button
                        type="button"
                        id={`task-start-btn-${task.id}`}
                        onClick={() => handleStartTask(task)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isFocusingThis
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}
                        title="Start Focus Timer on this task"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isFocusingThis ? 'In Focus' : 'Start'}</span>
                      </button>
                    )}

                    {/* [Complete] Button */}
                    <button
                      type="button"
                      id={`task-complete-btn-${task.id}`}
                      onClick={() => toggleTaskComplete(task.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </>
                      )}
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTask={addTask}
      />
    </div>
  );
};
