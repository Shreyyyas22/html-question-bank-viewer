import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import DOMPurify from 'dompurify';

export default function SearchBar({ topics, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Strip HTML for safer searching and snippet generation
  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Debounce search
    const timer = setTimeout(() => {
      const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
      const matches = [];

      // Search across all topics and questions
      for (const topic of topics) {
        // If topic name matches, we could add all questions, but let's just search questions
        // and include topic name in the match criteria
        const topicNameLower = topic.name.toLowerCase();
        
        for (let i = 0; i < topic.questions.length; i++) {
          const q = topic.questions[i];
          const plainText = stripHtml(q.text).toLowerCase();
          const plainOptions = q.options.map(opt => stripHtml(opt.text).toLowerCase()).join(' ');
          const plainExplanation = stripHtml(q.explanation || '').toLowerCase();
          
          const searchString = `${topicNameLower} ${plainText} ${plainOptions} ${plainExplanation}`;
          
          const isMatch = searchTerms.every(term => searchString.includes(term));
          
          if (isMatch) {
            // Generate a snippet highlighting the first match
            let snippet = stripHtml(q.text).substring(0, 100) + '...';
            
            matches.push({
              topic: topic,
              questionIndex: i,
              snippet: snippet
            });

            // Limit to 20 results for performance
            if (matches.length >= 20) break;
          }
        }
        if (matches.length >= 20) break;
      }

      setResults(matches);
      setIsSearching(false);
      setIsOpen(true);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, topics]);

  const handleSelect = (topic, index) => {
    setIsOpen(false);
    setQuery('');
    onSelectResult(topic, index);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          placeholder="Search questions, topics, options..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                setResults([]);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim() && (
        <div className="absolute mt-2 w-full bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map((result, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleSelect(result.topic, result.questionIndex)}
                    className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="pr-4">
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                        {result.topic.name} • Q{result.questionIndex + 1}
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                        {result.snippet}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">No results found for "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}
