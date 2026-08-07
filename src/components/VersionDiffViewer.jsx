import React, { useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { 
    GitCompare, 
    X, 
    ArrowLeftRight, 
    Calendar, 
    Tag,
    ChevronDown,
    FileText,
    Terminal
} from 'lucide-react';

export default function VersionDiffViewer({ versions, isDarkMode, onClose }) {
    const [oldVersionId, setOldVersionId] = useState(versions[1]?.id || versions[0]?.id || "");
    const [newVersionId, setNewVersionId] = useState(versions[0]?.id || "");
    const [diffType, setDiffType] = useState('openApiSpec'); // 'openApiSpec' or 'markdownDoc'

    const oldVersion = versions.find(v => v.id === oldVersionId);
    const newVersion = versions.find(v => v.id === newVersionId);

    const oldCode = oldVersion ? oldVersion[diffType] : "";
    const newCode = newVersion ? newVersion[diffType] : "";

    const styles = {
        variables: {
            dark: {
                diffViewerBackground: '#020617',
                diffViewerColor: '#cbd5e1',
                addedBackground: '#064e3b',
                addedColor: '#6ee7b7',
                removedBackground: '#7f1d1d',
                removedColor: '#fca5a5',
                wordAddedBackground: '#065f46',
                wordRemovedBackground: '#991b1b',
                addedGutterBackground: '#064e3b',
                removedGutterBackground: '#7f1d1d',
                gutterBackground: '#0f172a',
                gutterColor: '#475569',
                emptyLineBackground: '#020617',
                codeFoldGutterBackground: '#0f172a',
                codeFoldBackground: '#020617',
                codeFoldContentColor: '#475569',
            },
            light: {
                diffViewerBackground: '#ffffff',
                diffViewerColor: '#334155',
                addedBackground: '#f0fdf4',
                addedColor: '#166534',
                removedBackground: '#fef2f2',
                removedColor: '#991b1b',
                wordAddedBackground: '#dcfce7',
                wordRemovedBackground: '#fee2e2',
                addedGutterBackground: '#dcfce7',
                removedGutterBackground: '#fee2e2',
                gutterBackground: '#f8fafc',
                gutterColor: '#94a3b8',
                emptyLineBackground: '#ffffff',
                codeFoldGutterBackground: '#f8fafc',
                codeFoldBackground: '#ffffff',
                codeFoldContentColor: '#94a3b8',
            }
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white shadow-sm'}`}>
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <GitCompare className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold leading-tight">Visual Diff Viewer</h2>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Compare API specification changes across versions</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                        <button 
                            onClick={() => setDiffType('openApiSpec')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                diffType === 'openApiSpec' 
                                ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm')
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <Terminal className="w-3.5 h-3.5" />
                            OpenAPI
                        </button>
                        <button 
                            onClick={() => setDiffType('markdownDoc')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                diffType === 'markdownDoc' 
                                ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm')
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Markdown
                        </button>
                    </div>

                    <button 
                        onClick={onClose}
                        className={`p-2 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm'}`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Version Selectors */}
            <div className={`grid grid-cols-2 gap-px border-b ${isDarkMode ? 'bg-slate-800 border-slate-800' : 'bg-slate-200 border-slate-200'}`}>
                {/* Left Version (Old) */}
                <div className={`p-4 flex items-center gap-4 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="flex-1">
                        <label className={`text-[9px] font-black uppercase tracking-widest block mb-1.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Base Version
                        </label>
                        <div className="relative">
                            <select 
                                value={oldVersionId}
                                onChange={(e) => setOldVersionId(e.target.value)}
                                className={`w-full appearance-none pl-3 pr-10 py-2.5 rounded-xl text-sm font-bold focus:outline-none transition-all ${
                                    isDarkMode 
                                    ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500/50' 
                                    : 'bg-white border-slate-200 text-slate-700 shadow-sm focus:border-indigo-300'
                                } border`}
                            >
                                {versions.map(v => (
                                    <option key={v.id} value={v.id}>
                                        v{v.versionNo} — {new Date(v.generatedAt).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Right Version (New) */}
                <div className={`p-4 flex items-center gap-4 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="flex-1">
                        <label className={`text-[9px] font-black uppercase tracking-widest block mb-1.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Comparison Version
                        </label>
                        <div className="relative">
                            <select 
                                value={newVersionId}
                                onChange={(e) => setNewVersionId(e.target.value)}
                                className={`w-full appearance-none pl-3 pr-10 py-2.5 rounded-xl text-sm font-bold focus:outline-none transition-all ${
                                    isDarkMode 
                                    ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500/50' 
                                    : 'bg-white border-slate-200 text-slate-700 shadow-sm focus:border-indigo-300'
                                } border`}
                            >
                                {versions.map(v => (
                                    <option key={v.id} value={v.id}>
                                        v{v.versionNo} — {new Date(v.generatedAt).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Diff Area */}
            <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-auto custom-scrollbar">
                    {oldVersionId === newVersionId ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50 p-10 text-center">
                            <ArrowLeftRight className="w-12 h-12 mb-4 text-indigo-400" />
                            <h3 className="text-lg font-bold mb-2">Identical Versions Selected</h3>
                            <p className="max-w-md text-sm">Please select two different versions from the dropdowns above to visualize the code differences.</p>
                        </div>
                    ) : (
                        <ReactDiffViewer
                            oldValue={oldCode}
                            newValue={newCode}
                            splitView={true}
                            useDarkTheme={isDarkMode}
                            styles={isDarkMode ? styles.variables.dark : styles.variables.light}
                            leftTitle={`v${oldVersion?.versionNo || '?'}`}
                            rightTitle={`v${newVersion?.versionNo || '?'}`}
                            renderContent={(content) => <pre className="font-mono text-xs">{content}</pre>}
                        />
                    )}
                </div>
            </div>

            {/* Legend / Status Footer */}
            <div className={`px-6 py-3 border-t text-[10px] font-bold uppercase tracking-wider flex items-center gap-6 ${isDarkMode ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/50" />
                    <span>Added Lines</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/50" />
                    <span>Removed Lines</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Comparing JSON structures & endpoints</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
