import { useEffect, useRef, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { Copy, Check } from "lucide-react";

export default function SyntaxHighlighter({ code, language = "json", className = "", isDarkMode }) {
  const codeRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className={`relative group rounded-xl overflow-hidden border transition-all flex flex-col ${className} ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
      <div className="absolute top-2.5 right-2.5 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md shadow-sm transition border focus:outline-none ${isDarkMode ? 'text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border-slate-700' : 'text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900 border-slate-200'}`}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className={`p-4 overflow-x-auto font-mono text-xs leading-relaxed flex-1 m-0 bg-transparent border-0 shadow-none ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}

