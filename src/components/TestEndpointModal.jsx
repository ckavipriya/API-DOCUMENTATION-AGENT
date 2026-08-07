import React from 'react';
import { X, Play, CheckCircle2 } from 'lucide-react';

export function TestEndpointModal({ isOpen, onClose, method, path, body, onBodyChange, onTest, response, isDarkMode }) {
    if (!isOpen)
        return null;
    return (<div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-900/40'}`}>
      <div className={`rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transition-all border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className={`p-6 border-b flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Test API Endpoint</h2>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Simulate execution request against active route</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className={`flex items-center gap-2.5 p-3 rounded-xl border font-mono text-xs transition-all ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md tracking-wider ${
              method === 'GET' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 
              method === 'POST' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
              method === 'PUT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {method}
            </span>
            <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{path}</span>
          </div>

          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Request Payload (JSON)</label>
            <textarea value={body} onChange={(e) => onBodyChange(e.target.value)} className={`w-full h-32 p-3 text-xs font-mono border rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all shadow-inner ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`} placeholder="{ ... }" />
          </div>

          <button onClick={onTest} className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2">
            <Play className="w-3.5 h-3.5 fill-current" />
            Send Test Request
          </button>

          {response && (<div className={`space-y-2 animate-fade-in pt-2 border-t transition-all ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Response Output
                </label>
                <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>HTTP 200 OK</span>
              </div>
              <pre className={`p-3.5 rounded-xl text-xs font-mono overflow-x-auto border shadow-inner transition-all ${isDarkMode ? 'bg-slate-950 text-emerald-400 border-slate-800' : 'bg-slate-50 text-emerald-600 border-slate-200'}`}>
                {response}
              </pre>
            </div>)}
        </div>
      </div>
    </div>);
}

