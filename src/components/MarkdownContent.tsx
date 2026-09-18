import React from 'react';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  const renderBoldSpans = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white pt-1.5 pb-0.5 tracking-tight"
            >
              {renderBoldSpans(line.replace('### ', ''))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3
              key={idx}
              className="text-sm sm:text-base font-bold text-slate-950 dark:text-white pt-2 pb-0.5 tracking-tight"
            >
              {renderBoldSpans(line.replace('## ', ''))}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2
              key={idx}
              className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white pt-2 pb-1 tracking-tight"
            >
              {renderBoldSpans(line.replace('# ', ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-1.5 shrink-0" />
              <div className="flex-1">{renderBoldSpans(trimmed.slice(2))}</div>
            </div>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-slate-700 dark:text-slate-300">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 text-xs mt-0.5">
                {numMatch ? `${numMatch[1]}.` : '•'}
              </span>
              <div className="flex-1">
                {renderBoldSpans(numMatch ? numMatch[2] : trimmed)}
              </div>
            </div>
          );
        }
        return (
          <p key={idx} className="my-0.5">
            {renderBoldSpans(line)}
          </p>
        );
      })}
    </div>
  );
};
