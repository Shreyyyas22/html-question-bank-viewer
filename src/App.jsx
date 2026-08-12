import { useState } from 'react';
import FileUploader from './components/FileUploader';
import TopicList from './components/TopicList';
import ErrorBanner from './components/ErrorBanner';
import SearchBar from './components/SearchBar';
import DarkModeToggle from './components/DarkModeToggle';
import { parseQuestionBank } from './parser/htmlQuestionParser';
import QuestionViewer from './components/QuestionViewer';
import { ArrowLeft } from 'lucide-react';

function App() {
  const [parsedData, setParsedData] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [searchJumpIndex, setSearchJumpIndex] = useState(0);
  const [fileName, setFileName] = useState('');

  const handleFileLoaded = (htmlString, name) => {
    setFileName(name);
    // Parse the file asynchronously to avoid blocking UI immediately on large files
    setTimeout(() => {
      const data = parseQuestionBank(htmlString);
      setParsedData(data);
    }, 50);
  };

  const handleReset = () => {
    setParsedData(null);
    setSelectedTopic(null);
    setSearchJumpIndex(0);
    setFileName('');
  };

  const handleSearchResultSelect = (topic, questionIndex) => {
    setSelectedTopic(topic);
    setSearchJumpIndex(questionIndex);
  };

  if (!parsedData) {
    return (
      <div className="min-h-screen">
        <FileUploader onFileLoaded={handleFileLoaded} />
      </div>
    );
  }

  if (selectedTopic) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center">
            <button 
              onClick={() => setSelectedTopic(null)}
              className="flex items-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Topics
            </button>
            <div className="ml-4 font-semibold truncate text-slate-900 dark:text-slate-100 max-w-[200px] sm:max-w-md hidden sm:block">{selectedTopic.name}</div>
          </div>
          <DarkModeToggle />
        </div>
        <div className="flex-1 p-4 md:p-6 w-full">
          <QuestionViewer topic={selectedTopic} initialIndex={searchJumpIndex} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Question Bank</h1>
          <p className="text-slate-500 text-sm mt-1">Loaded: {fileName}</p>
        </div>
        
        <div className="flex-1 max-w-xl mx-auto md:mx-4 w-full">
          <SearchBar topics={parsedData.topics} onSelectResult={handleSearchResultSelect} />
        </div>

        <div className="flex items-center space-x-2">
          <DarkModeToggle />
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[44px]"
          >
            Upload Different File
          </button>
        </div>
      </div>

      <ErrorBanner parsedData={parsedData} />

      {parsedData.errors && parsedData.errors.some(e => e.topic === 'Global') && parsedData.topics.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-red-600 dark:text-red-400">Unable to read this question bank</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            The file structure doesn't match the expected format. Please make sure you exported it correctly.
          </p>
        </div>
      ) : (
        <TopicList 
          topics={parsedData.topics} 
          onSelectTopic={setSelectedTopic} 
        />
      )}
    </div>
  );
}

export default App;
