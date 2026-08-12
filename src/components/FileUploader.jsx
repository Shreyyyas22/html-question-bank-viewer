import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode, AlertCircle } from 'lucide-react';

export default function FileUploader({ onFileLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndProcessFile = (file) => {
    setError(null);

    if (!file) {
      return;
    }

    const isValidExtension = file.name.endsWith('.html') || file.name.endsWith('.htm');
    const isValidType = file.type === 'text/html' || !file.type; // Some OS might not set type

    if (!isValidExtension && !isValidType) {
      setError('Please upload a valid .html or .htm file.');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      setIsLoading(false);
      onFileLoaded(e.target.result, file.name);
    };

    reader.onerror = () => {
      setIsLoading(false);
      setError('Failed to read the file. Please try again.');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Question Bank Viewer</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Upload your exported HTML question bank to view, search, and study offline.
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".html,.htm"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100 dark:bg-blue-800' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          
          <div>
            <p className="text-lg font-medium">
              Drag & drop your HTML file here
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              or click to browse from your computer
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <span>Reading file...</span>
            ) : (
              <>
                <FileCode className="w-4 h-4" />
                <span>Select HTML File</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
