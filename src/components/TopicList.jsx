import React from 'react';
import { Book, ChevronRight, FileX } from 'lucide-react';

export default function TopicList({ topics, onSelectTopic }) {
  if (!topics || topics.length === 0) {
    return (
      <div className="text-center py-12">
        <FileX className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No topics found</h3>
        <p className="text-slate-500 mt-1">We couldn't extract any topics from this file.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Book className="mr-3 text-blue-600 dark:text-blue-400" />
        Available Topics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic, idx) => (
          <button
            key={idx}
            onClick={() => onSelectTopic(topic)}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all text-left group"
          >
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                {topic.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {topic.count} {topic.count === 1 ? 'Question' : 'Questions'}
              </p>
            </div>
            <ChevronRight className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0 ml-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
