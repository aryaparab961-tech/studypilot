import React from 'react';
import { X, BookOpen, Clock, FileText, Sparkles, CheckCircle2, ListChecks, Layers } from 'lucide-react';
import { StudyMaterial } from '../types';

interface MaterialDetailModalProps {
  material: StudyMaterial | null;
  isOpen: boolean;
  onClose: () => void;
  onGeneratePlan: (material: StudyMaterial) => void;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
  material,
  isOpen,
  onClose,
  onGeneratePlan,
}) => {
  if (!isOpen || !material) return null;

  const info = material.extractedInfo;

  return (
    <div
      id="material-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="material-detail-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {material.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {material.type.toUpperCase()} • {material.size || '1.2 MB'} • Uploaded {material.uploadDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Analysis status badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>AI Syllabus Analysis Completed</span>
            </div>
            {info?.totalEstimatedHours && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                ~{info.totalEstimatedHours}h estimated
              </span>
            )}
          </div>

          {/* Syllabus Summary */}
          {info?.syllabusSummary && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Syllabus Summary
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                {info.syllabusSummary}
              </p>
            </div>
          )}

          {/* Identified Subjects */}
          {info?.subjects && info.subjects.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Identified Subjects
              </span>
              <div className="flex flex-wrap gap-1.5">
                {info.subjects.map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200/60 dark:border-indigo-800/60"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Chapters & Units */}
          {info?.chapters && info.chapters.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Chapters & Modules
              </span>
              <div className="space-y-1">
                {info.chapters.map((chap, idx) => (
                  <div
                    key={idx}
                    className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-850"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{chap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High-Yield Topics */}
          {info?.topics && info.topics.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Extracted Topics
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {info.topics.map((top, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800"
                  >
                    <ListChecks className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{top}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          <button
            id="generate-plan-from-material-btn"
            onClick={() => {
              onClose();
              onGeneratePlan(material);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Generate Study Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
