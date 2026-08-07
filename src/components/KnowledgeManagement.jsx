import React, { useState, useEffect, useCallback } from 'react';
import { 
    FileText, 
    Trash2, 
    RefreshCw, 
    Search, 
    AlertCircle, 
    CheckCircle2, 
    FileCode,
    Loader2,
    Zap,
    Terminal,
    Share2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import KnowledgeGraph from './KnowledgeGraph';

export default function KnowledgeManagement() {
    const { activeProject, isDarkMode, showToast } = useApp();
    const projectId = activeProject?.id;
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [semanticQuery, setSemanticQuery] = useState("");
    const [semanticResults, setSemanticResults] = useState([]);
    const [isSemanticLoading, setIsSemanticLoading] = useState(false);
    const [searchMode, setSearchMode] = useState("hybrid"); // hybrid, keyword, semantic
    const [actionLoading, setActionLoading] = useState(null); // { path, type }
    const [error, setError] = useState(null);

    const handleHybridSearch = async (e) => {
        if (e) e.preventDefault();
        if (!semanticQuery.trim()) return;
        setIsSemanticLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: semanticQuery,
                    mode: searchMode 
                })
            });
            if (res.ok) {
                const data = await res.json();
                setSemanticResults(data);
                showToast(`Hybrid search complete: ${data.length} matches found.`);
            }
        } catch (err) {
            showToast("Search failed", "error");
        } finally {
            setIsSemanticLoading(false);
        }
    };

    const fetchKnowledge = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/knowledge`);
            if (!res.ok) throw new Error("Failed to load knowledge base");
            const data = await res.json();
            setDocuments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchKnowledge();
    }, [fetchKnowledge]);

    const handleDelete = async (filePath) => {
        if (!window.confirm(`Are you sure you want to remove "${filePath}" from the RAG index? This will degrade AI response quality for this file.`)) return;
        
        setActionLoading({ path: filePath, type: 'delete' });
        try {
            const res = await fetch(`/api/projects/${projectId}/knowledge`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath })
            });
            
            if (!res.ok) throw new Error("Delete failed");
            
            showToast("Document removed from vector index");
            fetchKnowledge();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRefresh = async (filePath) => {
        setActionLoading({ path: filePath, type: 'refresh' });
        try {
            const res = await fetch(`/api/projects/${projectId}/knowledge/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath })
            });
            
            if (!res.ok) throw new Error("Refresh failed");
            const data = await res.json();
            
            showToast(`Re-indexed ${data.chunkCount} chunks successfully`);
            fetchKnowledge();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredDocs = documents.filter(doc => 
        doc.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: documents.length,
        indexed: documents.filter(d => d.isIndexed).length,
        chunks: documents.reduce((acc, d) => acc + d.chunkCount, 0)
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header / Stats */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                    <div>
                        <h2 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Knowledge Management</h2>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Manage the vector embeddings and RAG context for your codebase.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="text-center px-2">
                                <span className={`block text-xs font-black uppercase tracking-tighter ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Files</span>
                                <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stats.indexed}/{stats.total}</span>
                            </div>
                            <div className={`w-px h-8 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
                            <div className="text-center px-2">
                                <span className={`block text-xs font-black uppercase tracking-tighter ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Chunks</span>
                                <span className={`text-lg font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats.chunks}</span>
                            </div>
                        </div>
                        <button 
                            onClick={fetchKnowledge}
                            className={`p-2 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input 
                        type="text" 
                        placeholder="Search indexed files..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                            isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50' 
                            : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 shadow-sm'
                        } border`}
                    />
                </div>
            </div>

            {/* Hybrid Search Section */}
            <div className={`mx-6 mb-6 p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]' : 'bg-indigo-50/30 border-indigo-100 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                            <Zap className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Hybrid RAG Engine</h3>
                            <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Combining keyword precision with GraphRAG semantic context.</p>
                        </div>
                    </div>
                    
                    <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                        {['hybrid', 'keyword', 'semantic'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setSearchMode(mode)}
                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                                    searchMode === mode 
                                    ? 'bg-indigo-600 text-white shadow-lg' 
                                    : `text-slate-500 hover:${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleHybridSearch} className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        placeholder={
                            searchMode === 'keyword' ? "Search for specific code strings, function names..." :
                            searchMode === 'semantic' ? "Ask structural/conceptual questions..." :
                            "Ask anything about the codebase (Hybrid Mode)..."
                        }
                        value={semanticQuery}
                        onChange={(e) => setSemanticQuery(e.target.value)}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                            isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50' 
                            : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 shadow-sm'
                        } border`}
                    />
                    <button 
                        type="submit"
                        disabled={isSemanticLoading || !semanticQuery.trim()}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            isDarkMode 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:bg-slate-100 disabled:text-slate-400'
                        }`}
                    >
                        {isSemanticLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        <span>Search</span>
                    </button>
                </form>

                {semanticResults.length > 0 && (
                    <div className={`space-y-2 animate-fade-in`}>
                        {semanticResults.map((result, idx) => (
                            <div key={idx} className={`p-3 rounded-xl border flex items-start gap-3 transition-all hover:translate-x-1 ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'}`}>
                                <div className={`mt-1 p-1.5 rounded-lg ${
                                    result.matchType === 'keyword' 
                                    ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                                    : (isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                                }`}>
                                    {result.matchType === 'keyword' ? <Terminal className="w-3 h-3" /> : <FileCode className="w-3 h-3" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className={`text-[10px] font-black truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {result.source} {result.target ? `→ ${result.target}` : ''}
                                        </span>
                                        <div className="flex gap-1">
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                result.matchType === 'keyword'
                                                ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600')
                                                : (isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600')
                                            }`}>
                                                {result.matchType || 'semantic'}
                                            </span>
                                            {result.score && (
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                                    {Math.round(result.score * 100)}% Match
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{result.insight || result.content}</p>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={() => setSemanticResults([])}
                            className={`text-[10px] font-bold underline ${isDarkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Clear results
                        </button>
                    </div>
                )}
            </div>

            {/* GraphRAG Visualizer */}
            <div className="mx-6 mb-6">
                <KnowledgeGraph />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
                {isLoading && documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p className="text-sm">Loading knowledge base...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-rose-500">
                        <AlertCircle className="w-10 h-10 mb-4" />
                        <p className="text-sm font-bold">{error}</p>
                        <button onClick={fetchKnowledge} className="mt-4 px-4 py-2 bg-rose-500/10 rounded-lg text-xs font-bold hover:bg-rose-500/20 transition-all">Retry</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredDocs.map((doc) => (
                            <div 
                                key={doc.path}
                                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                    isDarkMode 
                                    ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' 
                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                                        doc.isIndexed 
                                        ? (isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100')
                                        : (isDarkMode ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-50 text-slate-400 border-slate-100')
                                    }`}>
                                        {doc.name.endsWith('.js') || doc.name.endsWith('.ts') || doc.name.endsWith('.py') ? <FileCode className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{doc.name}</h4>
                                            {doc.isIndexed ? (
                                                <span className={`flex items-center gap-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                                    Indexed
                                                </span>
                                            ) : (
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                                    Unindexed
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{doc.path}</p>
                                            {doc.isIndexed && (
                                                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-indigo-400/70' : 'text-indigo-500'}`}>
                                                    {doc.chunkCount} Chunks
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {doc.isIndexed && (
                                        <>
                                            <button 
                                                onClick={() => handleRefresh(doc.path)}
                                                disabled={actionLoading?.path === doc.path}
                                                className={`p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-indigo-400' : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'}`}
                                                title="Refresh embeddings"
                                            >
                                                {actionLoading?.path === doc.path && actionLoading?.type === 'refresh' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(doc.path)}
                                                disabled={actionLoading?.path === doc.path}
                                                className={`p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-rose-500/10 text-slate-400 hover:text-rose-500' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}`}
                                                title="Remove from index"
                                            >
                                                {actionLoading?.path === doc.path && actionLoading?.type === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </>
                                    )}
                                    {!doc.isIndexed && (
                                        <button 
                                            onClick={() => handleRefresh(doc.path)}
                                            disabled={actionLoading?.path === doc.path}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}`}
                                        >
                                            {actionLoading?.path === doc.path ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Index Now'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
