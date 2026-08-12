import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function ErrorBanner({ parsedData }) {
  const [expanded, setExpanded] = useState(false);

  if (!parsedData || parsedData.failedCount === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="text-amber-500 mr-3 shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Imported {parsedData.totalParsed} questions, but {parsedData.failedCount} questions could not be parsed.
          </h3>
          
          {parsedData.errors && parsedData.errors.length > 0 && (
            <div className="mt-2">
              <button 
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center hover:underline"
              >
                {expanded ? (
                  <><ChevronUp className="w-3 h-3 mr-1" /> Hide Details</>
                ) : (
                  <><ChevronDown className="w-3 h-3 mr-1" /> Show Error Details</>
                )}
              </button>
              
              {expanded && (
                <ul className="mt-2 text-xs text-amber-700 dark:text-amber-400 space-y-1 max-h-32 overflow-y-auto bg-amber-100/50 dark:bg-amber-900/40 p-2 rounded">
                  {parsedData.errors.map((err, i) => (
                    <li key={i}>
                      <strong>{err.topic}</strong> (Index {err.index}): {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
