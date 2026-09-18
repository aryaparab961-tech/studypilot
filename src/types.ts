export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'missed';
export type StudyMethod = 'Active Recall' | 'Practice Problems' | 'Flashcards & Spaced Repetition' | 'Feynman Technique' | 'Pomodoro Sprint' | 'Mind Mapping';

export interface Topic {
  id: string;
  name: string;
  isCompleted: boolean;
  estimatedHours: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  lastStudied?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  topics: Topic[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  priority: Priority;
}

export interface StudyTask {
  id: string;
  subjectId?: string;
  subjectName: string;
  topic: string;
  durationMinutes: number;
  priority: Priority;
  status: TaskStatus;
  date: string; // YYYY-MM-DD
  timeSlot?: string;
  method?: string;
  notes?: string;
  completedAt?: string;
}

export interface StudentProfile {
  name: string;
  educationLevel: string;
  examName: string;
  examDate: string;
  targetScore: string;
  availableHoursPerDay: number;
}

export type MaterialType = 'syllabus' | 'pdf' | 'notes' | 'ppt' | 'docx' | 'image';

export interface StudyMaterial {
  id: string;
  name: string;
  type: MaterialType;
  size?: string;
  uploadDate: string;
  status: 'uploading' | 'analyzing' | 'analyzed' | 'error';
  extractedInfo?: {
    subjects: string[];
    chapters: string[];
    topics: string[];
    syllabusSummary: string;
    totalEstimatedHours?: number;
  };
  fileContentPreview?: string;
}

export interface PlanCardItem {
  id: string;
  day?: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  priority: Priority;
  method?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  planCards?: PlanCardItem[];
}

export interface FocusSessionState {
  isActive: boolean;
  isPaused: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  preset: 25 | 50 | 'custom';
  currentTask?: StudyTask;
}

export interface StudyStatistics {
  todayCompletedCount: number;
  todayTotalCount: number;
  todayProgressPercent: number;
  totalCompletedCount: number;
  totalStudyMinutes: number;
  currentStreakDays: number;
  weeklyStudyMinutes: { day: string; minutes: number; label: string }[];
}
