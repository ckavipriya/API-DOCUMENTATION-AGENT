import React from 'react';
import { useApp } from '../context/AppContext';
import { GitCompare, Calendar, Download, Tag, ArrowRight, History, Package, FileText } from 'lucide-react';
import { motion } from 'motion/react';

const VersionsView = ({ onOpenDiffViewer }) => {
    const { 
        activeVersions, 
        activeProject,
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
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 flex flex-col gap-8 min-h-0 overflow-y-auto pr-2"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-inner transform rotate-3">
                        <History className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Version Control
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">Immutable snapshot history of your API architecture</p>
                    </div>
                </div>
                <button 
                    onClick={onOpenDiffViewer}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all transform hover:-translate-y-0.5 ${
                        isDarkMode 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 shadow-lg shadow-indigo-500/5' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/30'
                    }`}
                >
                    <GitCompare className="w-4 h-4" />
                    Compare Releases
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {activeVersions.map((ver, idx) => (
                    <motion.div 
                        key={ver.id} 
                        variants={itemVariants}
                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group ${
                            idx === 0 
                                ? 'bg-indigo-600/5 border-indigo-500/30 shadow-2xl shadow-indigo-500/5' 
                                : isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-indigo-100 shadow-sm'
                        }`}
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0 transition-transform group-hover:scale-105 ${
                                idx === 0 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}>
                                <Tag className={`w-5 h-5 mb-1 ${idx === 0 ? 'text-indigo-200' : 'text-slate-600'}`} />
                                <span className="font-mono font-black text-lg tracking-tighter">v{ver.versionNo}</span>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h4 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {ver.changeSummary || "Base Architecture Extraction"}
                                    </h4>
                                    {idx === 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest shadow-md">Latest</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(ver.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Package className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">JSON Schema Discovery</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => downloadPDF(activeProject?.id, ver.versionNo)}
                                className={`p-3 rounded-2xl border transition-all ${
                                    isDarkMode 
                                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400' 
                                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-indigo-600'
                                }`}
                                title="Download PDF Documentation"
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => triggerDownload(ver.openApiSpec, `openapi_v${ver.versionNo}.json`, "application/json")}
                                className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                                    idx === 0
                                        ? 'bg-white text-indigo-600 border-transparent hover:bg-slate-50 shadow-lg'
                                        : isDarkMode 
                                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                }`}
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export Schema</span>
                            </button>
                            <button className={`p-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-indigo-600'}`}>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {activeVersions.length === 0 && (
                    <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-[40px] flex flex-col items-center gap-4">
                        <History className="w-16 h-16 text-slate-800 opacity-20" />
                        <p className="text-slate-500 font-bold">No release history found.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default VersionsView;
