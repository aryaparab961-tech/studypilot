import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Plus,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { useStudyPilot } from '../context/StudyPilotContext';
import { MarkdownContent } from './MarkdownContent';
import { PlanCardItem } from '../types';

export const StudyBuddyView: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    isChatLoading,
    clearChat,
    materials,
    addPlanCardToToday,
  } = useStudyPilot();

  const [input, setInput] = useState('');
  const [addedCardIds, setAddedCardIds] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatLoading]);

  const handleSend = (text?: string) => {
    const query = text || input;
    if (!query.trim() || isChatLoading) return;
    sendChatMessage(query);
    setInput('');
  };

  const handleAddCard = (card: PlanCardItem) => {
    addPlanCardToToday(card);
    setAddedCardIds((prev) => ({ ...prev, [card.id]: true }));
  };

  const quickPrompts = [
    { label: 'What should I study?', query: 'What should I study today?', icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> },
    { label: 'Explain a topic', query: 'Explain Fourier Transform in detail with intuition and key properties.', icon: <BookOpen className="w-3.5 h-3.5 text-blue-500" /> },
    { label: 'Test me', query: 'Give me 5 questions from my syllabus.', icon: <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> },
    { label: 'I have 30 minutes', query: 'I only have 30 minutes to study today.', icon: <Clock className="w-3.5 h-3.5 text-rose-500" /> },
  ];

  return (
    <div id="study-buddy-view" className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col px-3 sm:px-6 py-4">
      {/* Top Bar: Title, Grounding & Clear */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              AI Study Buddy
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized tutor grounded in your syllabus and study targets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="clear-chat-btn"
            onClick={clearChat}
            className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Grounded Materials Strip */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
          Grounded In:
        </span>
        {materials.map((m) => (
          <div
            key={m.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200/80 dark:border-slate-700 whitespace-nowrap"
          >
            <FileText className="w-3 h-3 text-indigo-500" />
            <span className="max-w-[140px] truncate">{m.name}</span>
          </div>
        ))}
      </div>

      {/* Conversation Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-3">
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-xs rounded-tr-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xs rounded-tl-xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                ) : (
                  <div>
                    <MarkdownContent content={msg.text} />

                    {/* Plan Cards if proposed by AI */}
                    {msg.planCards && msg.planCards.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Suggested Study Sessions:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.planCards.map((card) => {
                            const isAdded = addedCardIds[card.id];
                            return (
                              <div
                                key={card.id}
                                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-750 flex flex-col justify-between gap-2"
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                      {card.subject}
                                    </span>
                                    <span>{card.durationMinutes} min</span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2">
                                    {card.topic}
                                  </h4>
                                  {card.method && (
                                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                      {card.method}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddCard(card)}
                                  disabled={isAdded}
                                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    isAdded
                                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 cursor-default'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Added to Plan</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      <span>Add to My Plan</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`text-[10px] mt-1.5 ${
                    isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isChatLoading && (
          <div className="flex gap-3 items-center">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs sm:text-sm flex items-center gap-2 shadow-xs">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Thinking and grounding in your materials...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="py-2 shrink-0">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              id={`quick-prompt-${idx}`}
              onClick={() => handleSend(qp.query)}
              disabled={isChatLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer disabled:opacity-50"
            >
              {qp.icon}
              <span>{qp.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative shrink-0 pt-1"
      >
        <input
          id="study-buddy-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a study question, request an explanation, or ask 'What should I study today?'..."
          disabled={isChatLoading}
          className="w-full pl-4 pr-12 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs disabled:opacity-60 transition-all"
        />
        <button
          id="study-buddy-send-btn"
          type="submit"
          disabled={!input.trim() || isChatLoading}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors cursor-pointer"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
