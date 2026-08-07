import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

export default function FileUpload({ onUpload, isDarkMode }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  return (
    <div className="w-full">
      <div 
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
          dragActive 
            ? isDarkMode ? "border-indigo-500 bg-indigo-950/40" : "border-indigo-400 bg-indigo-50"
            : isDarkMode 
              ? "border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700" 
              : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input 
          ref={inputRef}
          type="file" 
          multiple 
          accept=".js,.py,.ts,.tsx,.jsx"
          onChange={handleChange} 
          className="hidden" 
        />
        <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20 shadow-inner">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className={`text-sm font-bold mb-1 transition-all ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Upload Source Code</h3>
        <p className={`text-xs text-center max-w-sm mb-5 leading-relaxed transition-all ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Drag and drop backend files here, or browse from your computer (.js, .ts, .py, .jsx, .tsx)
        </p>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onButtonClick();
          }}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 focus:outline-none"
        >
          Browse Files
        </button>
      </div>
    </div>
  );
}

