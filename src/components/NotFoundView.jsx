import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';

const NotFoundView = () => {
    const { setActiveTab, isDarkMode } = useApp();

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[400px]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`max-w-md w-full text-center p-12 rounded-[32px] border shadow-2xl transition-all ${
                    isDarkMode 
                        ? 'bg-slate-900/40 border-slate-800 text-white' 
                        : 'bg-white border-slate-200 text-slate-900'
                }`}
            >
                <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mb-8 mx-auto border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <HelpCircle className="w-10 h-10" />
                </div>
                
                <h1 className="text-4xl font-black mb-4 tracking-tight">404</h1>
                <h2 className="text-xl font-bold mb-3 uppercase tracking-wide">Feature Not Found</h2>
                <p className={`text-sm leading-relaxed mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    The module you are looking for has been moved, archived, or is currently under development in our RAG pipeline.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        <span>Return to Dashboard</span>
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className={`w-full py-4 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 border ${
                            isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Go Back</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFoundView;
