import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import QuestionNavigation from './QuestionNavigation';

export default function QuestionViewer({ topic, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  // Update index if initialIndex prop changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Reset state when topic changes
  useEffect(() => {
    if (initialIndex === 0) {
      setCurrentIndex(0);
    }
    setShowAnswer(false);
    setSelectedOption(null);
  }, [topic.name]);

  // Reset answer visibility when question changes
  useEffect(() => {
    setShowAnswer(false);
    setSelectedOption(null);
  }, [currentIndex]);

  const questions = topic.questions;
  const question = questions[currentIndex];
  
  if (!question) return null;

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const sanitizeHtml = (html) => {
    return {
      __html: DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'br', 'ul', 'ol', 'li', 'span', 'div', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class']
      })
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <QuestionNavigation 
        total={questions.length} 
        currentIndex={currentIndex} 
        onSelect={setCurrentIndex} 
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous Question"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next Question"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Question Text */}
          <div className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100 mb-6 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={sanitizeHtml(question.text)} />
          
          {/* Question Images */}
          {question.images && question.images.length > 0 && (
            <div className="mb-6 space-y-4">
              {question.images.map((imgSrc, idx) => (
                <img 
                  key={idx} 
                  src={imgSrc} 
                  alt={`Question visual ${idx + 1}`} 
                  className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700 mx-auto"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 mb-8">
            {question.options.map((opt, idx) => {
              const isCorrectOption = showAnswer && (opt.correct || opt.label === question.correctAnswer?.charAt(0));
              const isSelected = selectedOption === idx;
              const isWrongSelection = showAnswer && isSelected && !isCorrectOption;
              
              let optionClass = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:border-blue-400 cursor-pointer';
              if (showAnswer) {
                optionClass = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 opacity-70'; // default when answered
                if (isCorrectOption) {
                  optionClass = 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600 ring-1 ring-green-500 opacity-100';
                } else if (isWrongSelection) {
                  optionClass = 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600 ring-1 ring-red-500 opacity-100';
                }
              }

              return (
                <div 
                  key={idx}
                  onClick={() => {
                    if (!showAnswer) {
                      setSelectedOption(idx);
                      setShowAnswer(true);
                    }
                  }}
                  className={`p-4 rounded-xl border flex items-start transition-all ${optionClass} ${!showAnswer ? 'hover:shadow-md' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded border flex items-center justify-center font-bold mr-4 mt-0.5 shadow-sm ${
                    isCorrectOption ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-800 dark:text-green-100' :
                    isWrongSelection ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-800 dark:text-red-100' :
                    'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {opt.label || String.fromCharCode(65 + idx)}
                  </div>
                  <div className="flex-1 pt-1 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={sanitizeHtml(opt.text)} />
                  {isCorrectOption && (
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500 ml-3 flex-shrink-0 mt-1" />
                  )}
                  {isWrongSelection && (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-500 ml-3 flex-shrink-0 mt-1" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Area */}
          {!showAnswer ? (
            <div className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-6">
              <button 
                onClick={() => setShowAnswer(true)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                Skip & Show Answer
              </button>
            </div>
          ) : (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  Explanation
                </h3>
                
                {/* Fallback for correctAnswer if no options were marked correct */}
                {question.correctAnswer && (
                  <div className="mb-4 inline-block px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded font-medium text-sm">
                    Correct Answer: {question.correctAnswer}
                  </div>
                )}
                
                {question.explanation ? (
                  <div 
                    className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-blue-600"
                    dangerouslySetInnerHTML={sanitizeHtml(question.explanation)}
                  />
                ) : (
                  <p className="text-slate-500 italic">No explanation provided for this question.</p>
                )}

                {/* Explanation Images */}
                {question.explanationImages && question.explanationImages.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {question.explanationImages.map((imgSrc, idx) => (
                      <img 
                        key={idx} 
                        src={imgSrc} 
                        alt={`Explanation visual ${idx + 1}`} 
                        className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700 mx-auto"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
