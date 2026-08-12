import React, { useEffect, useRef } from 'react';

export default function QuestionNavigation({ total, currentIndex, onSelect }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Scroll active item into view if it's outside the visible area
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
      <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
        Jump to Question
      </div>
      <div 
        ref={containerRef}
        className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
      >
        {Array.from({ length: total }).map((_, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              data-active={isActive}
              onClick={() => onSelect(idx)}
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
