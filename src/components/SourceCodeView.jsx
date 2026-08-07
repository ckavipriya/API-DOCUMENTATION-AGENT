import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { FileCode, Save, RefreshCw, Layers, Code2 } from 'lucide-react';
import { motion } from 'motion/react';

const SourceCodeView = () => {
    const { 
        activeProject, 
        isDarkMode, 
        activeRole,
        showToast,
        fetchProjectData
    } = useApp();

    const [selectedFile, setSelectedFile] = useState(activeProject?.codeFiles?.[0] || null);
    const [editedCode, setEditedCode] = useState(selectedFile?.content || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveCode = async () => {
        if (!selectedFile || !activeProject) return;
        setIsSaving(true);
        
        const updatedFiles = activeProject.codeFiles.map(f => 
            f.path === selectedFile.path ? { ...f, content: editedCode, size: editedCode.length } : f
        );

        try {
            const res = await fetch(`/api/projects/${activeProject.id}/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    files: updatedFiles 
                }),
            });
            
            if (res.ok) {
                showToast("File saved and re-analysis triggered!");
                if (fetchProjectData) fetchProjectData(activeProject.id);
            } else {
                const err = await res.json();
                showToast(err.error || "Failed to save file", "error");
            }
        } catch (err) {
            showToast("Network error saving file", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card rounded-3xl flex-1 flex min-h-0 overflow-hidden transition-all ${isDarkMode ? '' : 'border-slate-200 shadow-sm'}`}
        >
            {/* File Tree Sidebar */}
            <div className={`w-80 border-r flex flex-col shrink-0 transition-all ${isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/50'}`}>
                <div className={`p-6 border-b flex items-center justify-between transition-all ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Project Files</span>
                    </div>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full text-slate-500 border border-slate-800 font-mono">
                        {activeProject?.codeFiles?.length || 0}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {activeProject?.codeFiles?.map((file) => {
                        const isSelected = selectedFile?.path === file.path;
                        return (
                            <button
                                key={file.path}
                                onClick={() => {
                                    setSelectedFile(file);
                                    setEditedCode(file.content);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-3 transition-all group ${
                                    isSelected
                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 font-bold scale-[1.02]"
                                        : isDarkMode 
                                            ? "text-slate-400 hover:bg-slate-900 hover:text-white"
                                            : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                                }`}
                            >
                                <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-indigo-400 group-hover:text-indigo-300"}`} />
                                <span className="truncate">{file.path}</span>
                            </button>
                        );
                    })}
                    {(!activeProject?.codeFiles || activeProject.codeFiles.length === 0) && (
                        <div className="p-8 text-center space-y-3">
                            <Code2 className="w-10 h-10 text-slate-800 mx-auto opacity-20" />
                            <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                No source files detected. Upload a project to begin exploring AST structures.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Code Editor Area */}
            <div className={`flex-1 flex flex-col min-h-0 transition-all ${isDarkMode ? 'bg-slate-950/20' : 'bg-white'}`}>
                <div className={`px-6 py-4 border-b flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex flex-col">
                        <div className={`flex items-center gap-2 font-mono text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            <FileCode className="w-4 h-4 text-indigo-400" />
                            <span>{selectedFile?.path || "File Explorer"}</span>
                        </div>
                        {selectedFile && (
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter mt-0.5">
                                Read/Write Access Enabled
                            </span>
                        )}
                    </div>

                    {activeRole === UserRole.DEVELOPER && selectedFile && (
                        <button
                            onClick={handleSaveCode}
                            disabled={isSaving}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition shadow-xl ${
                                isSaving 
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                            }`}
                        >
                            {isSaving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>{isSaving ? 'Processing AST...' : 'Sync & Re-index'}</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 min-h-0 p-6">
                    {selectedFile ? (
                        <div className="h-full relative group">
                            <textarea
                                value={editedCode}
                                onChange={(e) => setEditedCode(e.target.value)}
                                className={`w-full h-full font-mono text-[13px] p-8 rounded-3xl border-2 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 resize-none leading-relaxed transition-all shadow-2xl ${isDarkMode ? 'bg-slate-900/50 border-slate-800/50 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                                spellCheck="false"
                            />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="px-3 py-1 bg-slate-950 text-slate-500 rounded-full text-[10px] font-mono border border-slate-800 shadow-xl">
                                    UTF-8
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                                <FileCode className="w-10 h-10 text-slate-700" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-slate-400 font-bold">Select a module to edit</p>
                                <p className="text-slate-500 text-xs max-w-xs mx-auto">
                                    Changes made here will trigger a semantic re-analysis and update your RAG knowledge base.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default SourceCodeView;
