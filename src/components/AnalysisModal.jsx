import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Cpu } from 'lucide-react';

export default function AnalysisModal() {
    const { isAnalyzing, analysisSteps, isDarkMode } = useApp();

    if (!isAnalyzing) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className={`max-w-md w-full glass-card rounded-3xl p-8 text-center animate-scale-in ${isDarkMode ? 'border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                    <div className="relative w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
                        <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
                    </div>
                </div>
                <h2 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Intelligent Documentation Workflow</h2>
                <p className={`text-sm mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gemini is autonomously extracting endpoints and building your GraphRAG knowledge base.</p>
                
                <div className={`space-y-3 text-left p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                    {analysisSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${idx * 150}ms` }}>
                            <div className="mt-1">
                                {idx === analysisSteps.length - 1 && isAnalyzing ? (
                                    <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                                ) : (
                                    <div className={`w-1.5 h-1.5 rounded-full ${step.startsWith('✅') || step.startsWith('🚀') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-indigo-400'}`}></div>
                                )}
                            </div>
                            <span className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
