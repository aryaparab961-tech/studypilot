import React, { useState, useRef } from 'react';
import {
  FolderArchive,
  Upload,
  FileText,
  BookOpen,
  Trash2,
  Sparkles,
  CheckCircle2,
  Layers,
  ListChecks,
  Eye,
  Plus,
} from 'lucide-react';
import { useStudyPilot } from '../context/StudyPilotContext';
import { StudyMaterial, MaterialType } from '../types';
import { MaterialDetailModal } from './MaterialDetailModal';
import { UploadMaterialModal } from './UploadMaterialModal';

export const MaterialsView: React.FC = () => {
  const {
    materials,
    removeMaterial,
    addMaterial,
    setActiveTab,
    sendChatMessage,
  } = useStudyPilot();

  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAskAIAboutMaterial = (material: StudyMaterial) => {
    sendChatMessage(
      `Please analyze the syllabus in "${material.name}". Give me the high-yield topics and recommend study priority.`
    );
    setActiveTab('buddy');
  };

  const handleOpenDetail = (material: StudyMaterial) => {
    setSelectedMaterial(material);
    setIsDetailOpen(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
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
  };

  return (
    <div id="materials-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs">
              <FolderArchive className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Study Materials & Syllabus
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Uploaded PDFs, notes, and syllabus documents automatically analyzed by AI.
          </p>
        </div>

        <button
          id="upload-material-btn"
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
            : 'border-slate-300 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 bg-white dark:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
          <Upload className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          Click to upload or drag and drop syllabus / notes
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Supports PDF, Word (.docx), PowerPoint (.pptx), and text files
        </p>
      </div>

      {/* Materials List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Uploaded Files ({materials.length})
          </h2>
        </div>

        {materials.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            No study materials uploaded yet. Upload a syllabus or lecture note to start AI analysis.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {materials.map((mat) => {
              const info = mat.extractedInfo;
              const isAnalyzed = mat.status === 'analyzed';

              return (
                <div
                  key={mat.id}
                  id={`material-card-${mat.id}`}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {mat.name}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-bold">
                            {mat.type}
                          </span>
                          <span className="text-xs text-slate-400">
                            • {mat.size || '1.0 MB'} • {mat.uploadDate}
                          </span>
                        </div>

                        {/* Status tag */}
                        <div className="mt-1 flex items-center gap-2">
                          {isAnalyzed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Syllabus Analyzed</span>
                              {info?.totalEstimatedHours && (
                                <span className="text-slate-400">
                                  (~{info.totalEstimatedHours}h estimated study load)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Analyzing document with AI...</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAskAIAboutMaterial(mat)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Open in Study Buddy"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ask AI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDetail(mat)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="View extracted syllabus and topics"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Analysis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeMaterial(mat.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Summary & Topics preview */}
                  {info?.syllabusSummary && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {info.syllabusSummary}
                    </p>
                  )}

                  {info?.topics && info.topics.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Topics:
                      </span>
                      {info.topics.slice(0, 4).map((top, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {top}
                        </span>
                      ))}
                      {info.topics.length > 4 && (
                        <span className="text-[11px] text-slate-400">
                          +{info.topics.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MaterialDetailModal
        material={selectedMaterial}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onGeneratePlan={(m) => {
          handleAskAIAboutMaterial(m);
        }}
      />

      <UploadMaterialModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};
