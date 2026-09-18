import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  BookOpen,
  FileText,
  FileSpreadsheet,
  FileImage,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useStudyPilot } from '../context/StudyPilotContext';
import { MaterialType } from '../types';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated?: () => void;
}

export const UploadMaterialModal: React.FC<UploadMaterialModalProps> = ({
  isOpen,
  onClose,
  onPlanGenerated,
}) => {
  const { addMaterial, materials } = useStudyPilot();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const presets = [
    {
      name: 'Differential_Equations_Syllabus.pdf',
      type: 'pdf' as MaterialType,
      size: '1.2 MB',
      description: 'Covers first-order, second-order linear ODEs & Laplace transforms.',
    },
    {
      name: 'Organic_Chemistry_Mechanism_Notes.docx',
      type: 'docx' as MaterialType,
      size: '780 KB',
      description: 'Reaction pathways, carbonyl additions & aromatic substitution mechanisms.',
    },
    {
      name: 'Electromagnetic_Theory_Slides.pptx',
      type: 'ppt' as MaterialType,
      size: '2.8 MB',
      description: 'Maxwell equations, plane wave propagation, and dielectric boundary relations.',
    },
    {
      name: 'Final_Exam_Timetable_Schedule.png',
      type: 'image' as MaterialType,
      size: '540 KB',
      description: 'University midterm timetable specifying dates and weightages.',
    },
  ];

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      let type: MaterialType = 'notes';
      if (ext === 'pdf') type = 'pdf';
      else if (ext === 'ppt' || ext === 'pptx') type = 'ppt';
      else if (ext === 'doc' || ext === 'docx') type = 'docx';
      else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') type = 'image';

      addMaterial({
        name: file.name,
        type,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        fileContentPreview: `Uploaded ${file.name}`,
      });
    }
    onClose();
  };

  const handleAddPreset = (preset: typeof presets[0]) => {
    addMaterial({
      name: preset.name,
      type: preset.type,
      size: preset.size,
      fileContentPreview: preset.description,
    });
    onClose();
  };

  return (
    <div
      id="upload-material-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="upload-material-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Upload Study Material
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Syllabus, PDFs, Lecture Notes, PPTs, DOCX, or Images
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Dropzone */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-850/50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Click to browse or drop your files here
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Supports PDF, DOCX, PPT, PNG, JPG, and Markdown. AI will immediately extract subjects, chapters, and topics.
            </p>
          </div>

          {/* Quick presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Or choose a sample material to test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddPreset(preset)}
                  className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {preset.name}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
