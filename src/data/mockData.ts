import { StudentProfile, StudyTask, StudyMaterial, ChatMessage } from '../types';

export const initialProfile: StudentProfile = {
  name: 'Arya',
  educationLevel: 'Undergraduate Engineering',
  examName: 'Mid-Semester Examinations',
  examDate: '2026-09-29',
  targetScore: '90%+',
  availableHoursPerDay: 3.0,
};

export const initialMaterials: StudyMaterial[] = [
  {
    id: 'mat-1',
    name: 'Calculus_Syllabus_Fall2026.pdf',
    type: 'pdf',
    size: '1.4 MB',
    uploadDate: 'Sep 16, 2026',
    status: 'analyzed',
    extractedInfo: {
      subjects: ['Mathematics'],
      chapters: ['Fourier Analysis', 'Differential Systems', 'Multivariable Calculus'],
      topics: ['Fourier Transform', 'Dirichlet Conditions', 'Frequency Convolution', 'Improper Integrals'],
      syllabusSummary: 'Comprehensive engineering mathematics syllabus focusing on integral transforms and frequency representations.',
      totalEstimatedHours: 16,
    },
  },
  {
    id: 'mat-2',
    name: 'Physics_Electromagnetism_Unit3.docx',
    type: 'docx',
    size: '850 KB',
    uploadDate: 'Sep 17, 2026',
    status: 'analyzed',
    extractedInfo: {
      subjects: ['Physics'],
      chapters: ['Maxwell Equations', 'Electromagnetic Waves', 'Boundary Conditions'],
      topics: ['Boundary Conditions', 'Displacement Current', 'Poynting Vector', 'Wave Reflection'],
      syllabusSummary: 'Electromagnetic field equations and boundary interface conditions between dielectric media.',
      totalEstimatedHours: 14,
    },
  },
  {
    id: 'mat-3',
    name: 'Organic_Chemistry_Reactions.pptx',
    type: 'ppt',
    size: '3.2 MB',
    uploadDate: 'Sep 17, 2026',
    status: 'analyzed',
    extractedInfo: {
      subjects: ['Chemistry'],
      chapters: ['Carbonyl Chemistry', 'Reaction Mechanisms', 'Aromatic Substitutions'],
      topics: ['Nucleophilic Addition', 'Aldol Condensations', 'Grignard Reagents', 'Aromatic Directing Groups'],
      syllabusSummary: 'High-yield reaction pathways, stereochemistry rules, and carbonyl mechanisms.',
      totalEstimatedHours: 12,
    },
  },
];

const todayStr = new Date().toISOString().split('T')[0];

export const initialTasks: StudyTask[] = [
  {
    id: 'task-1',
    subjectName: 'Mathematics',
    topic: 'Fourier Transform — Convolution & Properties',
    durationMinutes: 25,
    priority: 'high',
    status: 'not_started',
    date: todayStr,
    method: 'Practice Problems',
    notes: 'Focus on time convolution versus frequency multiplication proofs.',
  },
  {
    id: 'task-2',
    subjectName: 'Digital Communication',
    topic: 'Sampling Theorem & Nyquist Criterion',
    durationMinutes: 30,
    priority: 'medium',
    status: 'completed',
    date: todayStr,
    method: 'Active Recall',
    notes: 'Reconstruction filters and aliasing boundaries covered.',
    completedAt: '10:30 AM',
  },
  {
    id: 'task-3',
    subjectName: 'Physics',
    topic: 'Boundary Conditions in Dielectrics',
    durationMinutes: 20,
    priority: 'high',
    status: 'completed',
    date: todayStr,
    method: 'Formula Drill',
    notes: 'Normal D field and tangential E field continuity derivations.',
    completedAt: '11:15 AM',
  },
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: `Hello Arya! 👋 I'm your **StudyPilot AI** study assistant.

I've analyzed your **3 uploaded study materials** (*Calculus Syllabus*, *Physics Electromagnetism*, and *Chemistry Notes*).

How can I help you right now? You can try asking:
- *"What should I study today?"*
- *"Explain Fourier Transform."*
- *"Give me 5 questions from my syllabus."*
- *"I only have 30 minutes."*`,
    timestamp: 'Just now',
  },
];
