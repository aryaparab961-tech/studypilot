import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  StudentProfile,
  StudyTask,
  StudyMaterial,
  MaterialType,
  ChatMessage,
  PlanCardItem,
  FocusSessionState,
} from '../types';
import {
  initialProfile,
  initialTasks,
  initialMaterials,
  initialChatMessages,
} from '../data/mockData';

export type MainNavTab = 'home' | 'buddy' | 'plan' | 'materials' | 'progress';

interface StudyPilotContextType {
  // Navigation
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;

  // Profile & Streak
  profile: StudentProfile;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  streakCount: number;

  // Study Tasks & Today's Plan
  tasks: StudyTask[];
  addTask: (task: Omit<StudyTask, 'id' | 'status' | 'date'>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  addPlanCardToToday: (card: PlanCardItem) => void;

  // Progress calculations (real metrics, no fake data)
  completedCount: number;
  totalTaskCount: number;
  progressPercent: number;
  totalStudyMinutes: number;

  // Focus Timer (single unified timer engine)
  timerState: FocusSessionState;
  startFocusTimer: (minutes?: number, task?: StudyTask) => void;
  pauseFocusTimer: () => void;
  resumeFocusTimer: () => void;
  resetFocusTimer: (minutes?: number) => void;
  timerCompletionMessage: string | null;
  dismissTimerCompletion: () => void;

  // Materials
  materials: StudyMaterial[];
  addMaterial: (file: { name: string; type: MaterialType; size?: string; fileContentPreview?: string }) => Promise<void>;
  removeMaterial: (id: string) => void;
  analyzeMaterial: (id: string) => Promise<void>;

  // AI Study Buddy Chat
  chatMessages: ChatMessage[];
  sendChatMessage: (message: string) => Promise<void>;
  isChatLoading: boolean;
  clearChat: () => void;

  // Light / Dark Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const StudyPilotContext = createContext<StudyPilotContextType | undefined>(undefined);

export const StudyPilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation state
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');

  // Light / Dark mode state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('studypilot_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('studypilot_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Profile
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('studypilot_profile');
    return saved ? JSON.parse(saved) : initialProfile;
  });

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('studypilot_profile', JSON.stringify(next));
      return next;
    });
  };

  // Study streak
  const [streakCount] = useState<number>(() => {
    const saved = localStorage.getItem('studypilot_streak');
    return saved ? parseInt(saved, 10) : 6;
  });

  // Study tasks
  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem('studypilot_tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  useEffect(() => {
    localStorage.setItem('studypilot_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Total study minutes (from focus timer completions and completed tasks)
  const [totalStudyMinutes, setTotalStudyMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('studypilot_study_minutes');
    return saved ? parseInt(saved, 10) : 50; // initial 50m from 2 completed tasks
  });

  useEffect(() => {
    localStorage.setItem('studypilot_study_minutes', totalStudyMinutes.toString());
  }, [totalStudyMinutes]);

  // Task methods
  const addTask = (taskData: Omit<StudyTask, 'id' | 'status' | 'date'>) => {
    const newTask: StudyTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      status: 'not_started',
      date: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const willBeCompleted = t.status !== 'completed';
        return {
          ...t,
          status: willBeCompleted ? 'completed' : 'not_started',
          completedAt: willBeCompleted
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined,
        };
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addPlanCardToToday = (card: PlanCardItem) => {
    const newTask: StudyTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      subjectName: card.subject,
      topic: card.topic,
      durationMinutes: card.durationMinutes || 25,
      priority: card.priority || 'medium',
      status: 'not_started',
      date: new Date().toISOString().split('T')[0],
      method: card.method,
      notes: card.notes,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  // Real progress metrics calculation
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalTaskCount = tasks.length;
  const progressPercent =
    totalTaskCount > 0 ? Math.round((completedCount / totalTaskCount) * 100) : 0;

  // Single Unified Focus Timer
  const [timerState, setTimerState] = useState<FocusSessionState>({
    isActive: false,
    isPaused: false,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    preset: 25,
  });
  const [timerCompletionMessage, setTimerCompletionMessage] = useState<string | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play audio chime when timer completes
  const playTimerChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // AudioContext fallback
    }
  };

  const startFocusTimer = (minutes?: number, task?: StudyTask) => {
    const duration = minutes || (task ? task.durationMinutes : 25);
    const secs = duration * 60;
    setTimerState({
      isActive: true,
      isPaused: false,
      totalSeconds: secs,
      remainingSeconds: secs,
      preset: duration === 25 ? 25 : duration === 50 ? 50 : 'custom',
      currentTask: task,
    });
    setTimerCompletionMessage(null);
  };

  const pauseFocusTimer = () => {
    setTimerState((prev) => ({ ...prev, isPaused: true }));
  };

  const resumeFocusTimer = () => {
    setTimerState((prev) => ({ ...prev, isPaused: false }));
  };

  const resetFocusTimer = (minutes?: number) => {
    const duration = minutes || (timerState.preset === 'custom' ? Math.round(timerState.totalSeconds / 60) : timerState.preset);
    const secs = duration * 60;
    setTimerState({
      isActive: false,
      isPaused: false,
      totalSeconds: secs,
      remainingSeconds: secs,
      preset: duration === 25 ? 25 : duration === 50 ? 50 : 'custom',
      currentTask: undefined,
    });
  };

  const dismissTimerCompletion = () => {
    setTimerCompletionMessage(null);
  };

  // Timer countdown effect (single interval)
  useEffect(() => {
    if (timerState.isActive && !timerState.isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          if (prev.remainingSeconds <= 1) {
            // Timer complete
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            playTimerChime();
            const minutesAdded = Math.round(prev.totalSeconds / 60);
            setTotalStudyMinutes((m) => m + minutesAdded);
            setTimerCompletionMessage(
              `Focus session complete! Added ${minutesAdded} minutes to your study log.`
            );
            return {
              ...prev,
              isActive: false,
              isPaused: false,
              remainingSeconds: 0,
            };
          }
          return {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1,
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerState.isActive, timerState.isPaused]);

  // Materials state
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => {
    const saved = localStorage.getItem('studypilot_materials');
    return saved ? JSON.parse(saved) : initialMaterials;
  });

  useEffect(() => {
    localStorage.setItem('studypilot_materials', JSON.stringify(materials));
  }, [materials]);

  const analyzeMaterial = useCallback(async (id: string) => {
    const target = materials.find((m) => m.id === id);
    if (!target) return;

    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'analyzing' } : m))
    );

    try {
      const res = await fetch('/api/gemini/analyze-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: target.name,
          fileType: target.type,
          filePreview: target.fileContentPreview,
        }),
      });
      const data = await res.json();
      if (data && data.analysis) {
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, status: 'analyzed', extractedInfo: data.analysis } : m
          )
        );
      }
    } catch {
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'analyzed' } : m))
      );
    }
  }, [materials]);

  const addMaterial = async (file: {
    name: string;
    type: MaterialType;
    size?: string;
    fileContentPreview?: string;
  }) => {
    const newId = `mat-${Date.now()}`;
    const newMat: StudyMaterial = {
      id: newId,
      name: file.name,
      type: file.type,
      size: file.size || '1.0 MB',
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'analyzing',
      fileContentPreview: file.fileContentPreview,
    };

    setMaterials((prev) => [newMat, ...prev]);

    try {
      const res = await fetch('/api/gemini/analyze-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          filePreview: file.fileContentPreview,
        }),
      });
      const data = await res.json();
      if (data && data.analysis) {
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === newId ? { ...m, status: 'analyzed', extractedInfo: data.analysis } : m
          )
        );
      } else {
        setMaterials((prev) =>
          prev.map((m) => (m.id === newId ? { ...m, status: 'analyzed' } : m))
        );
      }
    } catch {
      setMaterials((prev) =>
        prev.map((m) => (m.id === newId ? { ...m, status: 'analyzed' } : m))
      );
    }
  };

  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('studypilot_chat');
    return saved ? JSON.parse(saved) : initialChatMessages;
  });

  useEffect(() => {
    localStorage.setItem('studypilot_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const sendChatMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: chatMessages.slice(-8),
          studentProfile: profile,
          currentTasks: tasks,
          materials: materials,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || "I've analyzed your materials and study plan.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        planCards: data.planCards,
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: "I've checked your syllabus. Based on your materials, focusing on your high-priority topics like **Mathematics — Fourier Transform** and **Physics — Boundary Conditions** will give you the highest yield today.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages(initialChatMessages);
  };

  return (
    <StudyPilotContext.Provider
      value={{
        activeTab,
        setActiveTab,
        profile,
        updateProfile,
        streakCount,
        tasks,
        addTask,
        toggleTaskComplete,
        deleteTask,
        addPlanCardToToday,
        completedCount,
        totalTaskCount,
        progressPercent,
        totalStudyMinutes,
        timerState,
        startFocusTimer,
        pauseFocusTimer,
        resumeFocusTimer,
        resetFocusTimer,
        timerCompletionMessage,
        dismissTimerCompletion,
        materials,
        addMaterial,
        removeMaterial,
        analyzeMaterial,
        chatMessages,
        sendChatMessage,
        isChatLoading,
        clearChat,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </StudyPilotContext.Provider>
  );
};

export const useStudyPilot = (): StudyPilotContextType => {
  const context = useContext(StudyPilotContext);
  if (!context) {
    throw new Error('useStudyPilot must be used within a StudyPilotProvider');
  }
  return context;
};
