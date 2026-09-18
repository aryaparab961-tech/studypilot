import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini AI client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set. Using intelligent fallback logic.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

// AI Study Chat Endpoint
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, studentProfile, currentTasks, materials } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `You are StudyPilot AI, an elite, highly encouraging, and razor-sharp personal AI study planner for students.
Your primary workflow:
UPLOAD MATERIAL → AI ANALYZES IT → USER TELLS AI THEIR GOAL → AI CREATES STUDY PLAN → USER CAN CHAT TO MODIFY IT.

Core guidelines:
- Keep answers concise, visually structured, and immediately actionable. Avoid long paragraphs!
- When generating or proposing a study plan, use clean task cards/blocks with:
  * Subject
  * Topic
  * Duration in minutes (e.g. 45 min)
  * Priority (High/Medium/Low)
  * Recommended active study method (Active Recall, Practice Problems, Spaced Repetition)
- Understand and handle student requests:
  * "Create a 7-day study plan"
  * "What should I study today?"
  * "Make weekly tasks"
  * "Prepare me for my exam"
  * "I only have 2 hours today" (Intelligently fit into 2 hours and suggest what to prioritize)
  * "Move today's unfinished task to tomorrow" (Rebalance without overloading)
  * "Create a revision plan"
- Remember student context:
  Exam target: ${studentProfile?.examName || "Midterms"} (${studentProfile?.examDate || "approaching"})
  Available daily hours: ${studentProfile?.todayAvailableHours || studentProfile?.availableHoursPerDay || 2} hours
  Uploaded study materials: ${materials ? JSON.stringify(materials.map((m: any) => ({ name: m.name, type: m.type, subjects: m.extractedInfo?.subjects, topics: m.extractedInfo?.topics }))) : "None yet"}
  Current tasks: ${currentTasks ? JSON.stringify(currentTasks.map((t: any) => ({ subject: t.subjectName, topic: t.topic, duration: t.durationMinutes, status: t.status }))) : "None"}`;

    if (!ai) {
      const fallback = generateFallbackChatResponse(message, currentTasks, materials);
      return res.json(fallback);
    }

    const conversationTurns = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        conversationTurns.push(`${item.sender === "user" ? "Student" : "StudyPilot"}: ${item.text}`);
      }
    }
    conversationTurns.push(`Student: ${message}`);

    const prompt = `${conversationTurns.join("\n\n")}

Respond concisely. If proposing tasks or a plan, provide structured bullet cards.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I've analyzed your request. Let's adjust your study plan accordingly.";
    const fallbackHelper = generateFallbackChatResponse(message, currentTasks, materials);
    const isPlanRequest = /plan|task|schedule|routine|roadmap|add to plan/i.test(message);

    res.json({
      reply: replyText,
      planCards: isPlanRequest ? fallbackHelper.planCards : undefined,
      action: fallbackHelper.action,
    });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    res.status(500).json({
      error: "Failed to generate AI response",
      details: error?.message || "Unknown error",
      ...generateFallbackChatResponse(req.body?.message || "", req.body?.currentTasks, req.body?.materials),
    });
  }
});

// AI Analyze Material Endpoint
app.post("/api/gemini/analyze-material", async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({ analysis: generateFallbackMaterialAnalysis(fileName, fileType) });
    }

    const prompt = `Analyze this uploaded student study material:
File Name: "${fileName}"
File Type: "${fileType}"

Extract academic structure:
1. Identified Subject(s)
2. Key Chapters/Units (2-3 chapters)
3. Core High-Yield Topics (3-5 specific topics)
4. Concise Syllabus Summary (1-2 sentences)
5. Total Estimated Study Hours to master

Return strictly valid JSON in this format:
{
  "subjects": ["Mathematics"],
  "chapters": ["Chapter 1", "Chapter 2"],
  "topics": ["Topic A", "Topic B", "Topic C"],
  "syllabusSummary": "Concise summary",
  "totalEstimatedHours": 14
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ analysis: parsed });
  } catch (error: any) {
    console.error("Analyze material error:", error);
    res.json({ analysis: generateFallbackMaterialAnalysis(req.body?.fileName, req.body?.fileType) });
  }
});

// AI Generate/Adapt Routine Endpoint
app.post("/api/gemini/generate-routine", async (req, res) => {
  try {
    const { profile, tasks, commitments, wakeTime, sleepTime } = req.body;
    const ai = getGeminiClient();

    const prompt = `Create an optimized daily routine timeline for a student.
Student details:
- Wake time: ${wakeTime || "06:30"}
- Sleep time: ${sleepTime || "22:30"}
- Fixed commitments: ${commitments || "College 08:00 to 16:30"}
- Available study hours: ${profile?.availableHours || 3} hours
- Key subjects & tasks: ${JSON.stringify(tasks || [])}
- Preferred study style: ${profile?.studyMethod || "Pomodoro with active recall"}

Requirements:
- Realistic timeline starting from wake up to sleep.
- Do NOT schedule unrealistic back-to-back continuous marathons.
- Automatically insert reasonable 10-20 min breaks, meal times, and a 15-min buffer.
- Output strictly a JSON array of timeline items.
Format:
[
  { "time": "06:30", "title": "Wake up & hydrate", "duration": 30, "type": "routine", "subject": null },
  { "time": "07:00", "title": "Breakfast & Review plan", "duration": 60, "type": "routine", "subject": null },
  { "time": "08:00", "title": "College / Classes", "duration": 480, "type": "commitment", "subject": null },
  { "time": "16:30", "title": "Decompression break & snack", "duration": 30, "type": "break", "subject": null },
  { "time": "17:00", "title": "Mathematics — Fourier Transform", "duration": 60, "type": "study", "subject": "Mathematics", "priority": "high", "method": "Practice problems" },
  { "time": "18:00", "title": "Brain Reset Break", "duration": 20, "type": "break", "subject": null },
  { "time": "18:20", "title": "Digital Communication — Sampling", "duration": 50, "type": "study", "subject": "Digital Communication", "priority": "medium", "method": "Active recall" },
  { "time": "19:10", "title": "Dinner & Wind down", "duration": 50, "type": "routine", "subject": null },
  { "time": "20:00", "title": "Physics Revision — Mechanics", "duration": 45, "type": "study", "subject": "Physics", "priority": "high", "method": "Flashcards & quiz" },
  { "time": "20:45", "title": "Day Wrap-up & Tomorrow Preview", "duration": 30, "type": "study", "subject": "Review", "priority": "low", "method": "Summary" },
  { "time": "21:15", "title": "Free time / Leisure", "duration": 75, "type": "leisure", "subject": null },
  { "time": "22:30", "title": "Sleep", "duration": 480, "type": "routine", "subject": null }
]
Output ONLY raw JSON array, no markdown fences, no explanatory text.`;

    if (!ai) {
      return res.json({ routine: getFallbackRoutine() });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "[]");
    res.json({ routine: parsed });
  } catch (error: any) {
    console.error("Routine generation error:", error);
    res.json({ routine: getFallbackRoutine() });
  }
});

// Adaptive Schedule Redistribution Endpoint
app.post("/api/gemini/adapt-schedule", async (req, res) => {
  try {
    const { reason, missedTask, currentTasks, examDate, availableHours } = req.body;
    const ai = getGeminiClient();

    const prompt = `A student experienced a study disruption:
Reason: "${reason || "Missed a planned session"}"
Missed / Struggling Task: ${JSON.stringify(missedTask || {})}
Remaining Days to Exam: ${examDate ? examDate : "14 days"}
Available Daily Study Hours: ${availableHours || 3.5}
Existing Tasks: ${JSON.stringify(currentTasks || [])}

Perform an intelligent workload redistribution:
1. Do not simply push everything to tomorrow.
2. Balance high-priority weak topics against approaching deadlines.
3. Provide a brief 2-sentence rationale of how the schedule was adapted.
4. Provide the updated prioritized tasks list.

Return JSON format:
{
  "explanation": "Brief rationale of the adaptation",
  "adaptedTasks": [
    {
      "id": "t1",
      "subject": "Mathematics",
      "topic": "Fourier Transform - Key Problems",
      "duration": 45,
      "priority": "high",
      "status": "pending",
      "date": "2026-09-18",
      "method": "Targeted Problem Sets",
      "notes": "Reduced to high-yield problems to preserve momentum."
    }
  ]
}
Output ONLY valid JSON.`;

    if (!ai) {
      return res.json({
        explanation: "Redistributed the missed session by breaking the topic into two focused 30-minute blocks across the next 2 days to prevent schedule overload.",
        adaptedTasks: currentTasks,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Adapt schedule error:", error);
    res.json({
      explanation: "Adapted study load: prioritized highest-impact exam topics and buffered upcoming review sessions.",
      adaptedTasks: req.body?.currentTasks || [],
    });
  }
});

// Exam Crash Plan Generator
app.post("/api/gemini/exam-plan", async (req, res) => {
  try {
    const { examName, daysRemaining, subjects, weakSubjects, targetScore } = req.body;
    const ai = getGeminiClient();

    const prompt = `Create an intensive, high-yield Exam Preparation Roadmap for "${examName || "Final Exams"}".
Days Remaining: ${daysRemaining || 14}
Subjects: ${JSON.stringify(subjects || ["Mathematics", "Physics", "Computer Science"])}
Weak Areas: ${JSON.stringify(weakSubjects || ["Fourier Transform", "Electromagnetism"])}
Target Score: ${targetScore || "90%+"}

Generate a comprehensive phased breakdown:
1. Phase 1: Syllabus Completion & Weak Spots (Days 1-${Math.max(1, Math.floor((daysRemaining || 14) * 0.4))})
2. Phase 2: High-Yield Practice & Past Papers (Days ${Math.max(2, Math.floor((daysRemaining || 14) * 0.4) + 1)}-${Math.max(3, Math.floor((daysRemaining || 14) * 0.75))})
3. Phase 3: Full Mock Tests & Timed Condition Drill (Days ${Math.max(3, Math.floor((daysRemaining || 14) * 0.75) + 1)}-${Math.max(4, (daysRemaining || 14) - 2)})
4. Phase 4: Final Formula Revision & Buffer (Last 2 Days)

Return JSON format:
{
  "examName": "${examName || "Final Exams"}",
  "daysRemaining": ${daysRemaining || 14},
  "summary": "High-impact 4-phase strategy tailored to your target score.",
  "phases": [
    {
      "phase": "Phase 1: Concept Mastery & Weak Areas",
      "days": "Days 1-5",
      "focus": "Aggressively close gaps in weak topics using active recall.",
      "milestones": ["Complete Fourier Transform derivation sets", "Physics formula consolidation"]
    },
    {
      "phase": "Phase 2: Question Banks & Past Papers",
      "days": "Days 6-10",
      "focus": "Solve past 5 years question papers under un-timed scrutiny.",
      "milestones": ["3 Past year papers", "Error log analysis"]
    },
    {
      "phase": "Phase 3: Simulated Mock Tests",
      "days": "Days 11-12",
      "focus": "Strict timed mock exam to build test stamina.",
      "milestones": ["2 Full-length timed mock tests", "Targeted post-mock review"]
    },
    {
      "phase": "Phase 4: High-Yield Formulae & Buffer",
      "days": "Days 13-14",
      "focus": "Formula cheat sheets, light conceptual review, optimal rest.",
      "milestones": ["Flashcard blitz", "Rest & sleep calibration"]
    }
  ],
  "dailyTips": [
    "Dedicate your first 90 minutes each morning to your highest-weighted topic.",
    "Maintain an error notebook: write down every mistake immediately.",
    "Do not study past 10:00 PM the night before the exam."
  ]
}
Output strictly valid JSON.`;

    if (!ai) {
      return res.json(getFallbackExamPlan(examName, daysRemaining));
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Exam plan error:", error);
    res.json(getFallbackExamPlan(req.body?.examName, req.body?.daysRemaining));
  }
});

// Topic Explanation & Flash Prep
app.post("/api/gemini/explain-topic", async (req, res) => {
  try {
    const { topic, subject } = req.body;
    const ai = getGeminiClient();

    const prompt = `Provide a rapid, high-yield study primer for a student learning:
Subject: ${subject}
Topic: ${topic}

Structure the response with:
1. Core intuition (in 2 clear sentences)
2. 3 Essential principles/formulas they must memorize
3. The #1 common exam pitfall to avoid
4. Recommended 45-minute study breakdown (e.g. 15 min review, 25 min practice, 5 min recap)

Keep it crisp, formatted with clear markdown headings and bullet points.`;

    if (!ai) {
      return res.json({
        content: `### High-Yield Primer: ${topic} (${subject})\n\n**Core Intuition:**\n${topic} decomposes complex systems into fundamental solvable building blocks, allowing you to isolate key behaviors systematically.\n\n**3 Must-Know Principles:**\n1. **Fundamental Definition:** Understand the base transformation or core equation before attempting shortcuts.\n2. **Boundary Conditions:** Know how the concept behaves at limits (zero, infinity, or critical points).\n3. **Application Symmetry:** Exploit symmetry to cut calculation steps in half.\n\n**#1 Common Exam Pitfall:**\nForgetting unit conversions or sign inversion when reversing operations.\n\n**Recommended 45-Min Session:**\n- ⏱️ **00-15m:** Rapid concept & formula review\n- ⏱️ **15-40m:** 3 solved problems (1 easy, 1 medium, 1 past exam problem)\n- ⏱️ **40-45m:** Write a 3-bullet summary from memory without looking`
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Explain topic error:", error);
    res.status(500).json({ error: "Failed to fetch topic explanation" });
  }
});

// Interactive MCQ Quiz Generator from Uploaded Material / Topics
app.post("/api/gemini/generate-quiz", async (req, res) => {
  try {
    const { materialName, topic, subject, materials } = req.body;
    const ai = getGeminiClient();

    const targetTopic = topic || "Key Concept from Study Materials";
    const targetSubject = subject || "Study Material Mastery";

    const prompt = `Generate an interactive 4-question Multiple Choice Quiz (MCQ) for a student.
Topic: "${targetTopic}"
Subject: "${targetSubject}"
Reference Material: "${materialName || "Uploaded Study Notes"}"

For each question:
- 4 plausible options (A, B, C, D)
- Exactly 1 correct answer (indicate correctIndex from 0 to 3)
- A clear, encouraging, instant explanation of WHY the correct answer is right and why other options are incorrect.
- Practical, conceptual questions test deep understanding, not just trivia.

Output strictly valid JSON format:
{
  "subject": "${targetSubject}",
  "topic": "${targetTopic}",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of the correct mechanism or concept.",
      "subject": "${targetSubject}",
      "topic": "${targetTopic}"
    }
  ]
}`;

    if (!ai) {
      return res.json(generateFallbackQuiz(targetSubject, targetTopic, materialName));
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    if (!parsed.questions || parsed.questions.length === 0) {
      return res.json(generateFallbackQuiz(targetSubject, targetTopic, materialName));
    }
    res.json(parsed);
  } catch (error: any) {
    console.error("Generate quiz error:", error);
    res.json(generateFallbackQuiz(req.body?.subject, req.body?.topic, req.body?.materialName));
  }
});

// ⚡ 10-Minute Rescue Mission Generator
app.post("/api/gemini/rescue-mission", async (req, res) => {
  try {
    const { availableMinutes = 10, materials, currentTasks } = req.body;
    const ai = getGeminiClient();

    const materialRef = Array.isArray(materials) && materials.length > 0 ? materials[0] : null;
    const topicSuggestion = materialRef?.extractedInfo?.topics?.[0] || currentTasks?.[0]?.topic || "Nyquist Sampling & Active Recall";
    const subjectSuggestion = materialRef?.extractedInfo?.subjects?.[0] || currentTasks?.[0]?.subjectName || "Digital Communication";

    const prompt = `Generate a rapid micro-learning rescue mission for a student who has only ${availableMinutes} minutes.
Subject: "${subjectSuggestion}"
Topic: "${topicSuggestion}"

Break it down into a punchy, laser-focused 4-step mission:
1. Revise key core concept (e.g. 4 min)
2. Rapid active recall / test questions (e.g. 3 min)
3. Write or recall key formula / rule (e.g. 2 min)
4. Confidence check & synthesis (e.g. 1 min)

Return valid JSON format:
{
  "id": "rescue-${Date.now()}",
  "subject": "${subjectSuggestion}",
  "topic": "${topicSuggestion}",
  "totalMinutes": ${availableMinutes},
  "xpReward": 60,
  "steps": [
    { "id": "s1", "emoji": "📖", "minutes": 4, "title": "Revise ${topicSuggestion}", "description": "Quickly scan the core definition and high-yield properties.", "isCompleted": false },
    { "id": "s2", "emoji": "🧠", "minutes": 3, "title": "Answer 3 Quick Questions", "description": "Test yourself immediately to prevent passive re-reading.", "isCompleted": false },
    { "id": "s3", "emoji": "✍️", "minutes": 2, "title": "Recall Key Formula & Rule", "description": "Write down the governing equation from pure memory without looking.", "isCompleted": false },
    { "id": "s4", "emoji": "🎯", "minutes": 1, "title": "Quick Confidence Check", "description": "Rate your grasp from 1-5 and lock in the 60 XP bonus.", "isCompleted": false }
  ]
}`;

    if (!ai) {
      return res.json(generateFallbackRescueMission(availableMinutes, subjectSuggestion, topicSuggestion));
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Rescue mission error:", error);
    res.json(generateFallbackRescueMission(req.body?.availableMinutes || 10));
  }
});

// AI 1-3 Minute Mini Challenge Generator
app.post("/api/gemini/mini-challenge", async (req, res) => {
  try {
    const { materials, currentTasks } = req.body;
    const ai = getGeminiClient();

    const topic = currentTasks?.[0]?.topic || materials?.[0]?.extractedInfo?.topics?.[0] || "Integration by Parts";
    const subject = currentTasks?.[0]?.subjectName || "Mathematics";

    const prompt = `Create a 2-minute bite-sized study challenge for a student.
Topic: "${topic}"
Subject: "${subject}"

The challenge should be quick, fun, and test high-yield recall.
Format as JSON:
{
  "id": "chal-${Date.now()}",
  "title": "2-Minute Blitz: ${topic}",
  "subject": "${subject}",
  "topic": "${topic}",
  "durationMinutes": 2,
  "type": "formula_recall",
  "prompt": "What is the standard formula for Integration by Parts, and which mnemonic decides which term is u?",
  "options": ["∫ u dv = uv - ∫ v du (LIATE rule)", "∫ u dv = uv + ∫ v du (PEMDAS rule)", "∫ u dv = u/v - ∫ v du (L'Hopital rule)", "∫ u dv = v du - ∫ u dv (Euler rule)"],
  "correctAnswer": "∫ u dv = uv - ∫ v du (LIATE rule)",
  "explanation": "Integration by parts formula is derived from the product rule of differentiation. LIATE (Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential) guides the selection of u.",
  "xpReward": 40
}`;

    if (!ai) {
      return res.json(generateFallbackMiniChallenge(subject, topic));
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Mini challenge error:", error);
    res.json(generateFallbackMiniChallenge());
  }
});

// Helper Fallback Functions
function generateFallbackMaterialAnalysis(fileName: string = "", fileType: string = ""): any {
  const lower = (fileName || "").toLowerCase();
  if (lower.includes("calculus") || lower.includes("math") || lower.includes("integral")) {
    return {
      subjects: ["Mathematics"],
      chapters: ["Techniques of Integration", "Differential Equations", "Infinite Series"],
      topics: ["Integration by Parts", "Trigonometric Substitution", "Improper Integrals", "Fourier Series"],
      syllabusSummary: "Covers multivariable calculus, integration techniques, and series convergence.",
      totalEstimatedHours: 18
    };
  }
  if (lower.includes("physic") || lower.includes("electro") || lower.includes("wave")) {
    return {
      subjects: ["Physics"],
      chapters: ["Maxwell Equations", "Electromagnetic Wave Equations", "Boundary Conditions"],
      topics: ["Electromagnetism", "Gauss Law in Dielectrics", "Ampere-Maxwell Law", "Poynting Energy Flux"],
      syllabusSummary: "Comprehensive lecture notes on electrodynamics and boundary interfaces.",
      totalEstimatedHours: 14
    };
  }
  if (lower.includes("chem") || lower.includes("organic") || lower.includes("reaction")) {
    return {
      subjects: ["Chemistry"],
      chapters: ["Reaction Mechanisms", "Carbonyl Additions", "Aromatic Substitution"],
      topics: ["Organic Reactions", "Nucleophilic Addition", "Aldol Condensation", "Electrophilic Substitution"],
      syllabusSummary: "High-yield reaction pathways, stereochemistry rules, and reagent review.",
      totalEstimatedHours: 12
    };
  }
  return {
    subjects: ["General Curriculum"],
    chapters: ["Unit 1: Fundamentals", "Unit 2: Core Applications", "Unit 3: Exam Problem Sets"],
    topics: ["Core Principles Review", "High-Yield Practice Sets", "Formula Derivations"],
    syllabusSummary: "Structured study syllabus extracted from uploaded student material.",
    totalEstimatedHours: 15
  };
}

function generateFallbackChatResponse(message: string, currentTasks: any[] = [], materials: any[] = []): { reply: string; planCards?: any[]; action?: any } {
  const lower = message.toLowerCase();

  // 1. "Explain Fourier Transform" / Fourier topics
  if (lower.includes("fourier") || (lower.includes("explain") && lower.includes("transform"))) {
    return {
      reply: `### 📐 Fourier Transform — Core Concept & Intuition

**1. The Big Idea:**
The **Fourier Transform** takes a signal from the **Time Domain** and decomposes it into its constituent frequencies in the **Frequency Domain**. Think of it as an "acoustic prism": just as a prism splits white light into individual colors, the Fourier Transform splits a complex waveform into pure sine and cosine frequencies.

**2. Mathematical Definition:**
$$\\mathcal{F}\\{f(t)\\} = F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-j\\omega t} dt$$
- Inverse Transform: $f(t) = \\frac{1}{2\\pi} \\int_{-\\infty}^{\\infty} F(\\omega) e^{j\\omega t} d\\omega$

**3. Three Must-Know Exam Properties:**
1. **Linearity:** $\\mathcal{F}\\{a f_1(t) + b f_2(t)\\} = a F_1(\\omega) + b F_2(\\omega)$
2. **Time Shifting:** $\\mathcal{F}\\{f(t - t_0)\\} = e^{-j\\omega t_0} F(\\omega)$ *(shifts in time introduce a linear phase shift)*
3. **Convolution in Time $\\rightarrow$ Multiplication in Frequency:** $\\mathcal{F}\\{f_1(t) * f_2(t)\\} = F_1(\\omega) \\cdot F_2(\\omega)$ *(the most tested engineering exam property!)*

**4. Recommended 25-Min Study Plan:**
- ⏱️ **00-08 min:** Review Dirichlet conditions & forward/inverse formulas.
- ⏱️ **08-20 min:** Solve 2 past paper problems on rectangular pulse transform and convolution.
- ⏱️ **20-25 min:** Active recall: derive the frequency shift property without looking at notes.`,
    };
  }

  // 2. "Give me 5 questions from my syllabus" / "test me"
  if (lower.includes("5 questions") || lower.includes("questions from my syllabus") || lower.includes("test me") || lower.includes("quiz me")) {
    return {
      reply: `### 📝 5 High-Yield Questions From Your Uploaded Syllabus

Grounding from your uploaded documents (*Calculus Syllabus, Physics Electromagnetism, and Chemistry Notes*):

1. **Mathematics (Fourier & Integration):**
   *Why does a time-domain convolution correspond to simple algebraic multiplication in the frequency domain? State the formal condition under which this holds.*

2. **Mathematics (Improper Integrals):**
   *Evaluate the convergence of $\\int_{1}^{\\infty} \\frac{1}{x^p} dx$ for $p > 1$ versus $p \\le 1$ using the p-test.*

3. **Physics (Electromagnetics):**
   *State the boundary condition for the normal component of the electric displacement field $\\mathbf{D}$ across an interface between two different dielectric media with no surface charge.*

4. **Physics (Maxwell's Equations):**
   *What physical phenomenon did Maxwell account for when adding the displacement current term $\\frac{\\partial \\mathbf{D}}{\\partial t}$ to Ampere's Circuital Law?*

5. **Chemistry (Organic Reaction Mechanisms):**
   *Compare the nucleophilic addition mechanism of an aldehyde versus a ketone with a Grignard reagent. Why are aldehydes generally more reactive?*

---
👉 *Type your answer to any question above, and I will grade it and provide step-by-step feedback!*`,
    };
  }

  // 3. "I only have 30 minutes" / "30 minutes"
  if (lower.includes("30 min") || lower.includes("30 minutes") || lower.includes("only have 30")) {
    return {
      reply: `### ⏱️ 30-Minute High-Yield Study Sprint

When time is tight, passive reading will not work. Here is an optimized 30-minute protocol to maximize retention:

- **Phase 1: Active Retrieval Scan (5 min)**
  Close your book. Write down everything you currently remember about **Mathematics — Fourier Transform** or **Physics — Boundary Conditions**.
- **Phase 2: High-Impact Practice Problem (20 min)**
  Pick exactly **one** challenging past exam problem from your syllabus. Solve it under timed conditions without checking the answer key until finished.
- **Phase 3: Error Log & Summary (5 min)**
  Identify where you hesitated. Write down the single formula or rule you need to review tomorrow.

Click **Start Focus** in the Focus Timer with **25 min** or **30 min** to begin!`,
    };
  }

  // 4. "Explain this topic simply" / "simply" / "explain simply"
  if (lower.includes("simply") || lower.includes("simple") || lower.includes("eli5")) {
    return {
      reply: `### 💡 Simple Explanation

Let's break down your current topic using a straightforward analogy:

Imagine you are trying to understand a recipe just by tasting a baked cake. 
- In the real world (Time Domain), you only taste the complete, blended cake.
- An analytical transform (like Fourier or Boundary Analysis) acts like a chemical analyzer that instantly lists the exact ingredients: 2 cups flour, 1 cup sugar, 2 eggs.
- By isolating the ingredients individually, you can adjust or fix the exact piece that needs improvement without guessing.

**Takeaway:** Never try to memorize complex equations all at once. Always identify the **base variable**, the **rate of change**, and the **boundary condition**!`,
    };
  }

  // 5. "Create a 7-day study plan" / "create study plan" / "make a revision plan"
  if (lower.includes("revision") || lower.includes("revise") || lower.includes("make a revision plan")) {
    const revisionCards = [
      { id: "rev-1", day: "Interval 1", subject: "Mathematics", topic: "Integration by Parts & Trigonometric Forms", durationMinutes: 25, priority: "high", method: "Spaced Repetition" },
      { id: "rev-2", day: "Interval 2", subject: "Physics", topic: "Electromagnetism Flashcards & Gauss Law", durationMinutes: 25, priority: "high", method: "Active Recall" },
      { id: "rev-3", day: "Interval 3", subject: "Chemistry", topic: "Reaction Pathways & Reagents Summary", durationMinutes: 20, priority: "medium", method: "Mind Mapping" },
    ];
    return {
      reply: `### 🔁 Spaced Repetition Revision Plan\n\nThis revision cycle uses the 1-3-7 day spaced recall pattern to lock key concepts into long-term memory before the exam:`,
      planCards: revisionCards,
      action: { type: "add_tasks", tasks: revisionCards },
    };
  }

  if (lower.includes("7-day") || lower.includes("7 day") || lower.includes("create study plan") || (lower.includes("create") && lower.includes("plan"))) {
    const cards = [
      { id: "p-1", day: "Day 1 (Mon)", subject: "Mathematics", topic: "Integration Techniques & Partial Fractions", durationMinutes: 50, priority: "high", method: "Practice Problems" },
      { id: "p-2", day: "Day 2 (Tue)", subject: "Physics", topic: "Electromagnetism & Gauss Law in Dielectrics", durationMinutes: 45, priority: "high", method: "Active Recall" },
      { id: "p-3", day: "Day 3 (Wed)", subject: "Chemistry", topic: "Organic Reactions & Carbonyl Mechanisms", durationMinutes: 40, priority: "medium", method: "Flashcards" },
      { id: "p-4", day: "Day 4 (Thu)", subject: "Mathematics", topic: "Improper Integrals & Differential Systems", durationMinutes: 45, priority: "medium", method: "Practice Problems" },
      { id: "p-5", day: "Day 5 (Fri)", subject: "Physics", topic: "Maxwell Equations & Wave Reflection", durationMinutes: 50, priority: "high", method: "Derivation Drill" },
      { id: "p-6", day: "Day 6 (Sat)", subject: "Chemistry", topic: "Electrophilic Aromatic Substitution", durationMinutes: 45, priority: "medium", method: "Practice Problems" },
      { id: "p-7", day: "Day 7 (Sun)", subject: "Review & Buffer", topic: "Weekly Mock Drill & Weak Topic Consolidation", durationMinutes: 60, priority: "low", method: "Full Timed Quiz" },
    ];
    return {
      reply: `### 🗓️ 7-Day Personalized Study Plan\n\nI've generated a balanced 7-day schedule based on your uploaded materials and upcoming exam target. Each day features one high-yield focus topic with built-in revision buffers.\n\nClick **Add to Plan** on any task to schedule it, or use the quick buttons below:`,
      planCards: cards,
      action: { type: "add_tasks", tasks: cards },
    };
  }

  // 2. "I only have 2 hours today" / "2 hours"
  if (lower.includes("2 hours") || lower.includes("two hours") || lower.includes("only have 2")) {
    return {
      reply: `### ⏱️ Adjusted to 2 Hours Today\n\nI've recalibrated your schedule to fit within your **2-hour (120 min)** budget without sacrificing breaks:\n\n- ✓ **Mathematics — Integration** (50 min, completed)\n- ✓ **Physics — Electromagnetism** (30 min, completed)\n- ○ **Chemistry — Organic Reactions** (40 min, remaining for tonight)\n\n**Total:** 120 min (2h 00m). Your schedule is balanced and your bedtime remains protected!`,
      action: { type: "set_today_hours", hours: 2 },
    };
  }

  // 3. "Move today's unfinished task to tomorrow"
  if (lower.includes("move") || lower.includes("tomorrow") || lower.includes("unfinished")) {
    return {
      reply: `### 🔄 Rescheduled Unfinished Tasks to Tomorrow\n\nI moved your unfinished task **Chemistry — Organic Reactions (40 min)** to tomorrow's schedule at 17:00.\n\n- Tomorrow's study load has been adjusted to preserve your buffer time.\n- No cramming or doubled workload: tomorrow's lowest-priority reading was slightly trimmed to make room.\n\nYour Today's checklist is now clean!`,
      action: { type: "move_unfinished_to_tomorrow" },
    };
  }

  // 4. "What should I study today?" / "plan my day"
  if (lower.includes("what should i study") || lower.includes("plan my day") || lower.includes("today")) {
    return {
      reply: `### 🎯 Today's Focus Priorities\n\nHere is your active breakdown for today:\n\n1. ✓ **Mathematics — Integration** (50 min · Completed)\n2. ✓ **Physics — Electromagnetism** (30 min · Completed)\n3. ○ **Chemistry — Organic Reactions** (40 min · **Up Next!**)\n\n**Next Session:** Chemistry — Organic Reactions at 16:30. Click **Start Focus** on the right to start your 25-minute sprint!`,
    };
  }

  // 5. "Make weekly tasks" / "weekly tasks"
  if (lower.includes("weekly") || lower.includes("week")) {
    const weeklyCards = [
      { id: "w-1", day: "Mon-Tue", subject: "Mathematics", topic: "Integration Techniques & Problem Sets", durationMinutes: 60, priority: "high", method: "Practice Problems" },
      { id: "w-2", day: "Wed-Thu", subject: "Physics", topic: "Electromagnetism & Boundary Conditions", durationMinutes: 55, priority: "high", method: "Active Recall" },
      { id: "w-3", day: "Fri", subject: "Chemistry", topic: "Carbonyl Additions & Mechanism Drills", durationMinutes: 45, priority: "medium", method: "Reaction Flashcards" },
      { id: "w-4", day: "Weekend", subject: "Review", topic: "Weekly Consolidation & Timed Mock Quiz", durationMinutes: 75, priority: "low", method: "Timed Exam Simulation" },
    ];
    return {
      reply: `### 📋 Weekly Task Breakdown\n\nHere is your high-impact weekly roadmap structured to balance problem sets with active recall:`,
      planCards: weeklyCards,
      action: { type: "add_tasks", tasks: weeklyCards },
    };
  }

  // 6. "Prepare me for my exam" / "exam"
  if (lower.includes("prepare") || lower.includes("exam") || lower.includes("countdown")) {
    return {
      reply: `### 🎯 Exam Preparation Strategy\n\nWith your exams approaching, here is your 4-stage high-yield roadmap:\n\n- **Stage 1 (Days 1–3):** Rapid Syllabus Closure — master remaining topics in Chemistry & Physics.\n- **Stage 2 (Days 4–7):** Past 5-Year Question Banks under untimed accuracy scrutiny.\n- **Stage 3 (Days 8–10):** Full Timed Mock Exams to build pace and stamina.\n- **Stage 4 (Final 2 Days):** Formula cheat sheets, light conceptual scan, and optimal rest.\n\n*Would you like me to populate your weekly tasks with Stage 1 topics?*`,
      planCards: [
        { id: "ex-1", day: "Stage 1", subject: "Mathematics", topic: "Integration Formulae & Boundary Problems", durationMinutes: 60, priority: "high", method: "Derivations" },
        { id: "ex-2", day: "Stage 1", subject: "Physics", topic: "Maxwell Differential Equations Practice", durationMinutes: 50, priority: "high", method: "Problem Sets" },
        { id: "ex-3", day: "Stage 2", subject: "Past Papers", topic: "2025 Midterm Exam Simulation", durationMinutes: 90, priority: "high", method: "Timed Drill" },
      ],
    };
  }

  // 7. "Create a revision plan" / "revision"
  if (lower.includes("revision") || lower.includes("revise")) {
    const revisionCards = [
      { id: "rev-1", day: "Interval 1", subject: "Mathematics", topic: "Integration by Parts & Trigonometric Forms", durationMinutes: 30, priority: "high", method: "Spaced Repetition" },
      { id: "rev-2", day: "Interval 2", subject: "Physics", topic: "Electromagnetism Flashcards & Gauss Law", durationMinutes: 30, priority: "high", method: "Active Recall" },
      { id: "rev-3", day: "Interval 3", subject: "Chemistry", topic: "Reaction Pathways & Reagents Summary", durationMinutes: 25, priority: "medium", method: "Mind Mapping" },
    ];
    return {
      reply: `### 🔁 Spaced Repetition Revision Plan\n\nThis revision cycle uses the 1-3-7 day spaced recall pattern to lock key concepts into long-term memory before the exam:`,
      planCards: revisionCards,
    };
  }

  return {
    reply: `### 📋 Study Recommendation\n\nI have analyzed your study materials and goals. You have completed **2 out of 3** tasks today (**1h 20m / 2h**).\n\nYour next high-impact sprint is:\n**Chemistry — Organic Reactions** (40 min)\n\nFeel free to ask me:\n- *"Create a 7-day study plan"*\n- *"What should I study today?"*\n- *"Make weekly tasks"*\n- *"Prepare me for my exam"*\n- *"I only have 2 hours today"*\n- *"Move today's unfinished task to tomorrow"*`,
  };
}

function getFallbackRoutine() {
  return [
    { time: "06:30", title: "Wake up & hydrate", duration: 30, type: "routine", subject: null },
    { time: "07:00", title: "Breakfast & preview study goals", duration: 60, type: "routine", subject: null },
    { time: "08:00", title: "Classes / University", duration: 510, type: "commitment", subject: null },
    { time: "16:30", title: "Afternoon break & recharge", duration: 30, type: "break", subject: null },
    { time: "17:00", title: "Mathematics — Fourier Transform", duration: 60, type: "study", subject: "Mathematics", priority: "high", method: "Targeted problem set" },
    { time: "18:00", title: "Mind reset break", duration: 20, type: "break", subject: null },
    { time: "18:20", title: "Digital Communication — Sampling Theory", duration: 50, type: "study", subject: "Digital Communication", priority: "medium", method: "Active recall & diagrams" },
    { time: "19:10", title: "Dinner & Walk", duration: 50, type: "routine", subject: null },
    { time: "20:00", title: "Physics — Electromagnetism Revision", duration: 45, type: "study", subject: "Physics", priority: "high", method: "Formula drill" },
    { time: "20:45", title: "Quick Self-Quiz & Review", duration: 30, type: "study", subject: "General", priority: "low", method: "5-min summary cards" },
    { time: "21:15", title: "Free time & relax", duration: 75, type: "leisure", subject: null },
    { time: "22:30", title: "Sleep & recovery", duration: 480, type: "routine", subject: null }
  ];
}

function getFallbackExamPlan(examName?: string, daysRemaining?: number) {
  const days = daysRemaining || 14;
  return {
    examName: examName || "Semester Final Examinations",
    daysRemaining: days,
    summary: `Structured ${days}-day phased syllabus completion and rapid revision roadmap.`,
    phases: [
      {
        phase: "Phase 1: High-Weightage Concept Closure",
        days: `Days 1–${Math.max(1, Math.floor(days * 0.4))}`,
        focus: "Rapidly close gaps in weak topics and high-weightage chapters using active recall.",
        milestones: ["Complete weak subject problem sheets", "Formula summary sheet compiled"]
      },
      {
        phase: "Phase 2: Question Banks & Past Papers",
        days: `Days ${Math.max(2, Math.floor(days * 0.4) + 1)}–${Math.max(3, Math.floor(days * 0.75))}`,
        focus: "Solve previous year exam papers under timed conditions.",
        milestones: ["Past 5-year papers completed", "Mistake journal documented"]
      },
      {
        phase: "Phase 3: Simulated Mock Exams",
        days: `Days ${Math.max(3, Math.floor(days * 0.75) + 1)}–${Math.max(4, days - 2)}`,
        focus: "Full-length timed exam simulations to calibrate pacing and endurance.",
        milestones: ["2 full mock exams scored", "Last-minute confusion cleared"]
      },
      {
        phase: "Phase 4: High-Yield Formulae & Mindful Taper",
        days: `Days ${Math.max(2, days - 1)}–${days}`,
        focus: "Light conceptual scanning, formula flashcards, and strict sleep routine.",
        milestones: ["Formula flashcard blitz", "Exam day kit prepared"]
      }
    ],
    dailyTips: [
      "Dedicate your first 90 minutes each morning to your highest-weighted topic.",
      "Maintain an error notebook: write down every mistake immediately.",
      "Do not study past 10:00 PM the night before the exam."
    ]
  };
}

function generateFallbackQuiz(subject: string = "Mathematics", topic: string = "Integration by Parts", materialName?: string) {
  const sub = subject || "Mathematics";
  const top = topic || "Calculus & Analysis";

  if (sub.toLowerCase().includes("physic") || top.toLowerCase().includes("electro")) {
    return {
      subject: "Physics",
      topic: "Electromagnetism & Gauss's Law",
      questions: [
        {
          id: "q-phy-1",
          question: "Which of Maxwell's equations demonstrates that isolated magnetic monopoles do not exist in classical physics?",
          options: ["Gauss's Law for Magnetism (∇ · B = 0)", "Faraday's Law of Induction (∇ × E = -∂B/∂t)", "Ampere's Circuital Law (∇ × B = μ₀J)", "Gauss's Law for Electricity (∇ · E = ρ/ε₀)"],
          correctIndex: 0,
          explanation: "∇ · B = 0 states the magnetic field divergence is always zero everywhere, meaning magnetic field lines form closed loops with no net source or sink (no isolated monopoles).",
          subject: "Physics",
          topic: "Maxwell's Equations"
        },
        {
          id: "q-phy-2",
          question: "In a linear dielectric material with dielectric constant κ > 1, how does the capacitance C change compared to a vacuum capacitor C₀?",
          options: ["C decreases by factor κ", "C increases to C = κ · C₀", "C remains exactly the same", "C drops to zero"],
          correctIndex: 1,
          explanation: "The polarized dielectric molecules create an opposing internal electric field, reducing the net potential difference V for a given charge Q. Since C = Q/V, the capacitance increases by κ.",
          subject: "Physics",
          topic: "Capacitance & Dielectrics"
        },
        {
          id: "q-phy-3",
          question: "What physical quantity does the Poynting Vector (S = (1/μ₀) E × B) represent?",
          options: ["Electric charge density", "Direction of magnetic monopole velocity", "Rate of energy transfer per unit area (directional power flux)", "Electrostatic potential difference"],
          correctIndex: 2,
          explanation: "The Poynting Vector represents the directional energy flux density (watts per square meter) carried by an electromagnetic wave in space.",
          subject: "Physics",
          topic: "Electromagnetic Energy Flux"
        },
        {
          id: "q-phy-4",
          question: "Lenz's Law in electromagnetic induction is a direct manifestation of which fundamental conservation law?",
          options: ["Conservation of Momentum", "Conservation of Energy", "Conservation of Charge", "Conservation of Angular Momentum"],
          correctIndex: 1,
          explanation: "Lenz's Law states induced current opposes the change in magnetic flux. If it aided the change, it would create runaway free energy without external mechanical work, violating Conservation of Energy.",
          subject: "Physics",
          topic: "Faraday & Lenz Laws"
        }
      ]
    };
  }

  if (sub.toLowerCase().includes("chem") || top.toLowerCase().includes("organic")) {
    return {
      subject: "Chemistry",
      topic: "Organic Carbonyl Mechanisms",
      questions: [
        {
          id: "q-chem-1",
          question: "In an Aldol reaction, what is the initial nucleophilic species generated by deprotonation with a base?",
          options: ["Carbocation", "Enolate ion (or enol resonance form)", "Free radical", "Acylium ion"],
          correctIndex: 1,
          explanation: "Deprotonating the alpha-hydrogen of an aldehyde or ketone produces a resonance-stabilized enolate ion where the negative charge is delocalized onto the electronegative oxygen.",
          subject: "Chemistry",
          topic: "Aldol Condensation"
        },
        {
          id: "q-chem-2",
          question: "Which test reagent produces a characteristic silver mirror precipitate when reacted with aldehydes?",
          options: ["Fehling's Solution", "Tollens' Reagent (Ammoniacal Silver Nitrate)", "Grignard Reagent", "Lucas Reagent"],
          correctIndex: 1,
          explanation: "Tollens' reagent ([Ag(NH₃)₂]⁺) oxidizes aldehydes into carboxylates while Ag⁺ is reduced to metallic silver Ag(s), coating the flask like a mirror.",
          subject: "Chemistry",
          topic: "Functional Group Tests"
        },
        {
          id: "q-chem-3",
          question: "Why do ketones generally undergo nucleophilic addition slower than aldehydes?",
          options: ["Ketones have greater steric hindrance and stronger inductive electron donation from two alkyl groups", "Ketones are completely non-polar", "Aldehydes have two oxygen atoms", "Ketones cannot form tetrahedral intermediates"],
          correctIndex: 0,
          explanation: "Aldehydes possess only one alkyl group and one small hydrogen atom, making the carbonyl carbon less sterically hindered and more electropositive than a ketone.",
          subject: "Chemistry",
          topic: "Carbonyl Reactivity"
        },
        {
          id: "q-chem-4",
          question: "What is the primary product formed when an ester is reacted with excess Grignard reagent followed by acid workup?",
          options: ["Primary alcohol", "Secondary alcohol", "Tertiary alcohol", "Carboxylic acid"],
          correctIndex: 2,
          explanation: "The first equivalent of Grignard converts the ester into a ketone intermediate (displacing the alkoxide leaving group). The second equivalent attacks the ketone to yield a tertiary alcohol.",
          subject: "Chemistry",
          topic: "Grignard Reactions"
        }
      ]
    };
  }

  // Default Mathematics / Analysis Quiz
  return {
    subject: "Mathematics",
    topic: top || "Calculus & Problem Solving",
    questions: [
      {
        id: "q-math-1",
        question: "When evaluating ∫ x · e^(2x) dx using Integration by Parts, what is the optimal choice for u?",
        options: ["u = e^(2x)", "u = x", "u = 2x", "u = dx"],
        correctIndex: 1,
        explanation: "By the LIATE rule, Algebraic (x) precedes Exponential (e^(2x)). Setting u = x means du = dx, which simplifies the remaining integral drastically.",
        subject: "Mathematics",
        topic: "Integration Techniques"
      },
      {
        id: "q-math-2",
        question: "What is the condition for an improper integral ∫ [1 to ∞] (1 / x^p) dx to converge?",
        options: ["p < 1", "p ≤ 1", "p > 1", "p = 0"],
        correctIndex: 2,
        explanation: "By the p-integral test, ∫ [1 to ∞] 1/x^p dx converges strictly when p > 1. At p = 1 it diverges logarithmically to infinity.",
        subject: "Mathematics",
        topic: "Improper Integrals"
      },
      {
        id: "q-math-3",
        question: "What is the Laplace Transform of the function f(t) = e^(at) for s > a?",
        options: ["1 / (s + a)", "1 / (s - a)", "s / (s² + a²)", "a / (s² - a²)"],
        correctIndex: 1,
        explanation: "L{e^(at)} = ∫₀^∞ e^(-st) · e^(at) dt = ∫₀^∞ e^(-(s-a)t) dt = 1 / (s - a) for real part of s > a.",
        subject: "Mathematics",
        topic: "Laplace Transforms"
      },
      {
        id: "q-math-4",
        question: "For a linear second-order differential equation ay'' + by' + cy = 0 with characteristic roots r₁ ≠ r₂, what is the general solution?",
        options: ["y = C₁ e^(r₁ x) + C₂ e^(r₂ x)", "y = (C₁ + C₂ x) e^(r₁ x)", "y = e^(α x)(C₁ cos βx + C₂ sin βx)", "y = C₁ x + C₂"],
        correctIndex: 0,
        explanation: "When the characteristic equation ar² + br + c = 0 yields distinct real roots r₁ and r₂, the linearly independent solutions are e^(r₁ x) and e^(r₂ x).",
        subject: "Mathematics",
        topic: "Differential Equations"
      }
    ]
  };
}

function generateFallbackRescueMission(minutes: number = 10, subject: string = "Digital Communication", topic: string = "Nyquist Sampling & Reconstruction") {
  return {
    id: `rescue-${Date.now()}`,
    subject: subject || "Digital Communication",
    topic: topic || "Nyquist Sampling Rate",
    totalMinutes: minutes,
    xpReward: 60,
    steps: [
      {
        id: "step-1",
        emoji: "📖",
        minutes: Math.max(1, Math.floor(minutes * 0.4)),
        title: `Revise ${topic || "Nyquist Sampling"}`,
        description: "Review core theorem: fs ≥ 2 · fmax to avoid aliasing artifacts in reconstruction.",
        isCompleted: false
      },
      {
        id: "step-2",
        emoji: "🧠",
        minutes: Math.max(1, Math.floor(minutes * 0.3)),
        title: "Answer 3 Quick Recall Questions",
        description: "Test yourself on spectrum folding, anti-aliasing low-pass filters, and sinc interpolation.",
        isCompleted: false
      },
      {
        id: "step-3",
        emoji: "✍️",
        minutes: Math.max(1, Math.floor(minutes * 0.2)),
        title: "Recall Key Formula",
        description: "Write down the minimum sampling frequency fs = 2 · B and guard band condition from memory.",
        isCompleted: false
      },
      {
        id: "step-4",
        emoji: "🎯",
        minutes: Math.max(1, Math.floor(minutes * 0.1)),
        title: "Quick Confidence Check",
        description: "Reflect on comfort level (1–5) and bank +60 XP directly toward your daily buddy level!",
        isCompleted: false
      }
    ]
  };
}

function generateFallbackMiniChallenge(subject: string = "Mathematics", topic: string = "Fourier Transform") {
  return {
    id: `chal-${Date.now()}`,
    title: "2-Minute Blitz: Duality & Transform Recall",
    subject: subject || "Mathematics",
    topic: topic || "Fourier Analysis",
    durationMinutes: 2,
    type: "formula_recall",
    prompt: "If a rectangular pulse in the time domain has width T, what is its corresponding continuous Fourier Transform spectrum shape in frequency domain?",
    options: [
      "Gaussian pulse exp(-ω²)",
      "Sinc function A · T · sinc(ωT / 2)",
      "Dirac delta function δ(ω)",
      "Exponential decay exp(-aω)"
    ],
    correctAnswer: "Sinc function A · T · sinc(ωT / 2)",
    explanation: "The Fourier transform of a rectangular pulse of duration T is a sinc function with zero-crossings at multiples of 2π/T. This is a foundational duality property in signal analysis.",
    xpReward: 40
  };
}

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyPilot AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
