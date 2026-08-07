import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Github } from 'lucide-react';
import FileUpload from './FileUpload';
import GitHubSyncForm from './GitHubSyncForm';

const WelcomeView = ({ onOpenNewProject, onUpload, isDarkMode }) => {
    const [mode, setMode] = React.useState('upload'); // 'upload' or 'github'

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`glass-card rounded-[40px] p-12 max-w-xl w-full flex flex-col items-center text-center shadow-2xl transition-all ${isDarkMode ? '' : 'border-slate-200 shadow-xl'}`}
            >
                <div className="w-20 h-20 bg-indigo-600 rounded-[24px] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/40 relative group">
                    <div className="absolute inset-0 bg-indigo-600 rounded-[24px] animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <Bot className="w-10 h-10 text-white" />
                </div>
                
                <h3 className={`text-2xl font-black mb-3 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Initialize Intelligence</h3>
                <p className={`text-sm leading-relaxed mb-8 max-w-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Connect your repository or upload source code to build your technical knowledge graph.
                </p>

                <div className={`w-full p-1.5 rounded-2xl mb-8 flex gap-1 ${isDarkMode ? 'bg-slate-900/80 border border-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
                    <button 
                        onClick={() => setMode('upload')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            mode === 'upload' 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Local Source
                    </button>
                    <button 
                        onClick={() => setMode('github')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            mode === 'github' 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub Sync</span>
                    </button>
                </div>

                <div className="w-full">
                    <AnimatePresence mode="wait">
                        {mode === 'upload' ? (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 gap-4 w-full"
                            >
                                <button
                                    onClick={onOpenNewProject}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 active:scale-95"
                                >
                                    Start with Template
                                </button>
                                <FileUpload onUpload={onUpload} isDarkMode={isDarkMode} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="github"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="w-full"
                            >
                                <GitHubSyncForm />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default WelcomeView;
