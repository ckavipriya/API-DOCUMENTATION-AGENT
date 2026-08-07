import React from 'react';
import { useApp } from '../context/AppContext';
import { Download, FileText, Play, Code, BookOpen, ExternalLink, ShieldCheck, Search } from 'lucide-react';
import { motion } from 'motion/react';
import SyntaxHighlighter from './SyntaxHighlighter';

const SpecView = ({ onOpenTestModal }) => {
    const { 
        selectedVersion, 
        activeEndpoints,
        activeProject,
        isDarkMode,
        setActiveTab,
        downloadPDF
    } = useApp();

    const [sandboxSearch, setSandboxSearch] = React.useState("");

    const filteredSandboxEndpoints = activeEndpoints
        .filter(ep => ep.path.toLowerCase().includes(sandboxSearch.toLowerCase()) || ep.method.toLowerCase().includes(sandboxSearch.toLowerCase()))
        .slice(0, 6);

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
        hidden: { opacity: 0, y: 15 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    if (!selectedVersion) {
        return (
            <div className={`glass-card rounded-3xl flex-1 flex flex-col items-center justify-center p-20 text-center transition-all ${isDarkMode ? '' : 'border-slate-200 shadow-sm'}`}>
                <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Specification Available</h3>
                <p className="text-slate-500 text-sm max-w-sm">Please upload a codebase first to generate automatic API documentation and OpenAPI schemas.</p>
            </div>
        );
    }

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 flex flex-col gap-8 min-h-0 overflow-y-auto pr-2"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 transform -rotate-2">
                        <Code className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Technical Documentation
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 font-medium">Auto-generated API Schema & Reference</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/20">Production Ready</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => downloadPDF(activeProject?.id)}
                        className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5 border ${isDarkMode ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-100 hover:bg-indigo-500/20' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}
                    >
                        <FileText className="w-4 h-4" />
                        <span>Professional PDF</span>
                    </button>
                    <button
                        onClick={() => triggerDownload(selectedVersion.openApiSpec, "openapi.json", "application/json")}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export OpenAPI</span>
                    </button>
                    <button
                        onClick={() => triggerDownload(selectedVersion.markdownDoc, "API_DOCS.md", "text/markdown")}
                        className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all transform hover:-translate-y-0.5 border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-lg shadow-slate-200/50'}`}
                    >
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <span>Download Markdown</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: OpenAPI Spec */}
                <div className={`glass-card rounded-3xl flex flex-col min-h-[500px] transition-all ${isDarkMode ? '' : 'border-slate-200 shadow-sm'}`}>
                    <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
                                <Code className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Swagger JSON v3.1</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Schema</span>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <SyntaxHighlighter code={selectedVersion.openApiSpec} language="json" className="h-full" isDarkMode={isDarkMode} />
                    </div>
                </div>

                {/* Right: Markdown Doc */}
                <div className={`glass-card rounded-3xl flex flex-col min-h-[500px] transition-all ${isDarkMode ? '' : 'border-slate-200 shadow-sm'}`}>
                    <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Technical Guide</span>
                        </div>
                        <button className="p-2 text-slate-500 hover:text-indigo-400 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <SyntaxHighlighter code={selectedVersion.markdownDoc} language="markdown" className="h-full" isDarkMode={isDarkMode} />
                    </div>
                </div>
            </div>

            {/* Quick Test Section */}
            <div className={`glass-card rounded-3xl p-8 transition-all ${isDarkMode ? '' : 'border-slate-200 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 shadow-inner">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Interactive Sandbox</h3>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Run functional tests against discovered endpoints instantly</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                            <input 
                                type="text"
                                placeholder="Filter sandbox..."
                                value={sandboxSearch}
                                onChange={(e) => setSandboxSearch(e.target.value)}
                                className={`pl-9 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/10 w-48 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                            />
                        </div>
                        <button 
                            onClick={() => setActiveTab("endpoints")}
                            className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2 group whitespace-nowrap"
                        >
                            <span>View All</span>
                            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSandboxEndpoints.map((ep) => (
                        <div 
                            key={ep.id} 
                            className={`p-5 rounded-2xl border-2 transition-all group flex flex-col justify-between h-40 ${isDarkMode ? 'bg-slate-900/40 border-slate-800/50 hover:border-indigo-500/30' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'}`}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase border ${
                                        ep.method === 'GET' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                        ep.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                    }`}>
                                        {ep.method}
                                    </span>
                                    <code className={`text-[11px] font-mono font-bold truncate tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                        {ep.path}
                                    </code>
                                </div>
                                <p className={`text-[10px] leading-relaxed line-clamp-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {ep.description || "Synthesizing documentation from AST context..."}
                                </p>
                            </div>
                            <button 
                                onClick={() => onOpenTestModal(ep)}
                                className="w-full mt-4 py-2 bg-slate-950 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-800 group-hover:border-indigo-500/30 flex items-center justify-center gap-2"
                            >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Launch Test</span>
                            </button>
                        </div>
                    ))}
                    {activeEndpoints.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl">
                            <Code className="w-10 h-10 text-slate-800 mb-4 opacity-30" />
                            <p className="text-xs text-slate-500 italic">No functional endpoints extracted from context yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default SpecView;
