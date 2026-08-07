import React from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, Clock, Shield, Upload, Sparkles, Download, FileCode, FileText } from 'lucide-react';
import FileUpload from './FileUpload';
import SyntaxHighlighter from './SyntaxHighlighter';
import SessionTimer from './SessionTimer';
import { motion } from 'motion/react';

const DashboardView = ({ onUpload }) => {
    const { 
        activeProject, 
        activeEndpoints, 
        selectedVersion, 
        isDarkMode,
        downloadPDF 
    } = useApp();

    const triggerDownload = (content, filename, contentType) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.4, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 flex flex-col gap-8 min-h-0"
        >
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Security Status */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition"></div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Security Coverage</span>
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                            <Shield className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1">
                        {activeProject?.securityScore || "94"}%
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="text-emerald-400 font-semibold">↑ 12%</span> vs last audit
                    </p>
                </motion.div>

                {/* Card 2: Endpoints */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Endpoints Found</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                            <Terminal className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1">
                        {activeEndpoints.length}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="text-emerald-400 font-semibold">{activeEndpoints.filter(e => !e.authRequired).length} Public</span> / <span className="text-rose-400 font-semibold">{activeEndpoints.filter(e => e.authRequired).length} Private</span>
                    </p>
                </motion.div>

                {/* Card 3: Session Duration */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-violet-500/40 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition"></div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Session Uptime</span>
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tight mb-1 font-mono">
                        <SessionTimer />
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="text-indigo-400 font-semibold">Connected</span> to vector engine
                    </p>
                </motion.div>
            </div>

            {/* Main Bento Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
                {/* Left: Source Ingestion */}
                <motion.div 
                    variants={itemVariants}
                    className={`lg:col-span-5 glass-card rounded-3xl p-8 flex flex-col justify-between transition-all ${isDarkMode ? '' : 'border-slate-200 shadow-sm'}`}
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Source Code Ingestion</h3>
                                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Upload files or folders for instant analysis</p>
                            </div>
                        </div>
                        <FileUpload onUpload={onUpload} isDarkMode={isDarkMode} />
                    </div>

                    <div className={`mt-8 p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                            <Sparkles className="w-4 h-4" />
                            <span>Gemini 3.6 Flash Analysis</span>
                        </div>
                        <p className={`text-sm leading-relaxed mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Code is semantically chunked and indexed in a vector space for high-precision documentation generation.
                        </p>
                    </div>
                </motion.div>

                {/* Right: Spec Preview */}
                <motion.div 
                    variants={itemVariants}
                    className={`lg:col-span-7 glass-card rounded-3xl p-8 flex flex-col min-h-[500px] transition-all ${isDarkMode ? '' : 'border-slate-200 shadow-sm'}`}
                >
                    <div className={`flex items-center justify-between border-b pb-6 mb-6 transition-all ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                <FileCode className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>OpenAPI Specification</h3>
                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Live generated v3.1.0 schema</p>
                            </div>
                        </div>
                        {selectedVersion && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => downloadPDF(activeProject?.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>PDF Documentation</span>
                                </button>
                                <button
                                    onClick={() => triggerDownload(selectedVersion.openApiSpec, "openapi.json", "application/json")}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-500/30"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export JSON</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col rounded-2xl border border-slate-800/50 bg-slate-950/30">
                        {selectedVersion ? (
                            <SyntaxHighlighter 
                                code={selectedVersion.openApiSpec} 
                                language="json" 
                                className="flex-1 text-xs" 
                                isDarkMode={isDarkMode} 
                            />
                        ) : (
                            <div className={`flex-1 flex flex-col items-center justify-center gap-4 italic text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                                    <FileCode className="w-8 h-8 opacity-20" />
                                </div>
                                <span>No specification generated yet. Upload code to begin.</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default DashboardView;
