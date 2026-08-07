import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Github, Link, Key, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const GitHubSyncForm = () => {
    const { syncFromGithub, isDarkMode, showToast } = useApp();
    const [repoUrl, setRepoUrl] = useState('');
    const [token, setToken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!repoUrl) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await syncFromGithub(repoUrl, token);
            showToast("GitHub synchronization initiated successfully");
        } catch (err) {
            setError(err.message || "Failed to sync from GitHub");
            showToast(err.message || "GitHub sync failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Repository URL
                    </label>
                    <div className="relative group">
                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isSubmitting ? 'text-indigo-500' : 'text-slate-500 group-focus-within:text-indigo-500'}`}>
                            <Github className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/owner/repository"
                            disabled={isSubmitting}
                            className={`w-full pl-11 pr-4 py-4 rounded-2xl border text-sm transition-all outline-none ${
                                isDarkMode 
                                    ? 'bg-slate-900/50 border-slate-800 text-white focus:border-indigo-500/50 focus:bg-slate-900' 
                                    : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5'
                            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                        <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Personal Access Token
                        </label>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">(Optional for Private)</span>
                    </div>
                    <div className="relative group">
                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isSubmitting ? 'text-indigo-500' : 'text-slate-500 group-focus-within:text-indigo-500'}`}>
                            <Key className="w-4 h-4" />
                        </div>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxx"
                            disabled={isSubmitting}
                            className={`w-full pl-11 pr-4 py-4 rounded-2xl border text-sm transition-all outline-none ${
                                isDarkMode 
                                    ? 'bg-slate-900/50 border-slate-800 text-white focus:border-indigo-500/50 focus:bg-slate-900' 
                                    : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5'
                            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3"
                        >
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-medium text-rose-500 leading-relaxed">
                                {error}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    type="submit"
                    disabled={isSubmitting || !repoUrl}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                        isSubmitting || !repoUrl
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Synchronizing...</span>
                        </>
                    ) : (
                        <>
                            <Github className="w-4 h-4" />
                            <span>Sync from GitHub</span>
                        </>
                    )}
                </button>
            </form>
            
            <p className={`text-[10px] text-center mt-6 leading-relaxed px-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Our analyzer will clone the repository head, perform a security-safe audit of code files, and build your RAG index.
            </p>
        </div>
    );
};

export default GitHubSyncForm;
