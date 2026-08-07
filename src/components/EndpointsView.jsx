import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, Play, Trash2, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';

const EndpointsView = ({ onOpenAddModal, onOpenTestModal, onDeleteEndpoint }) => {
    const { 
        activeEndpoints, 
        isDarkMode, 
        activeRole,
        showToast
    } = useApp();

    const [search, setSearch] = useState("");
    const [selectedMethod, setSelectedMethod] = useState("ALL");

    const filteredEndpoints = activeEndpoints.filter(ep => {
        const matchesSearch = ep.path.toLowerCase().includes(search.toLowerCase()) ||
            ep.method.toLowerCase().includes(search.toLowerCase()) ||
            (ep.description && ep.description.toLowerCase().includes(search.toLowerCase()));
        
        const matchesMethod = selectedMethod === "ALL" || ep.method.toUpperCase() === selectedMethod;
        
        return matchesSearch && matchesMethod;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    const handleDelete = (id) => {
        if (onDeleteEndpoint) {
            onDeleteEndpoint(id);
        }
    };

    const getMethodColor = (method) => {
        switch (method.toUpperCase()) {
            case 'GET': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
            case 'POST': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'PUT': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'DELETE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 flex flex-col gap-6 min-h-0"
        >
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <button 
                    onClick={() => setSelectedMethod("ALL")}
                    className={`glass-card rounded-2xl p-5 border-l-4 transition-all text-left ${selectedMethod === "ALL" ? 'border-l-indigo-500 bg-indigo-500/5' : 'border-l-slate-800'}`}
                >
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Total Routes</span>
                    <div className="text-3xl font-black mt-1 text-white">{activeEndpoints.length}</div>
                </button>
                <div className="glass-card rounded-2xl p-5 border-l-4 border-l-sky-400">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Public</span>
                    <div className="text-3xl font-black text-sky-400 mt-1">{activeEndpoints.filter(e => !e.authRequired).length}</div>
                </div>
                <div className="glass-card rounded-2xl p-5 border-l-4 border-l-rose-400">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Private</span>
                    <div className="text-3xl font-black text-rose-400 mt-1">{activeEndpoints.filter(e => e.authRequired).length}</div>
                </div>
                <div className="glass-card rounded-2xl p-5 col-span-2 md:col-span-3 flex items-center justify-around">
                    {["GET", "POST", "PUT", "DELETE"].map(m => (
                        <button 
                            key={m} 
                            onClick={() => setSelectedMethod(selectedMethod === m ? "ALL" : m)}
                            className={`text-center transition-all p-2 rounded-xl hover:bg-slate-900 ${selectedMethod === m ? 'bg-slate-900 ring-1 ring-slate-800 shadow-inner' : ''}`}
                        >
                            <span className={`text-[10px] font-black uppercase transition-colors ${selectedMethod === m ? 'text-indigo-400' : 'text-slate-500'}`}>{m}</span>
                            <div className={`text-xl font-black mt-0.5 transition-colors ${selectedMethod === m ? 'text-white' : 'text-slate-300'}`}>
                                {activeEndpoints.filter(e => e.method === m).length}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Endpoints Table Container */}
            <div className={`glass-card rounded-3xl flex-1 flex flex-col min-h-0 overflow-hidden transition-all ${isDarkMode ? '' : 'border-slate-200 shadow-sm'}`}>
                <div className={`p-6 border-b flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative max-w-md w-full">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                            <input
                                type="text"
                                placeholder="Filter endpoints by path, method or description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`w-full pl-11 pr-4 py-2.5 border rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
                                {filteredEndpoints.length} Results
                            </span>
                        </div>
                    </div>

                    {activeRole === UserRole.DEVELOPER && (
                        <button
                            onClick={onOpenAddModal}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Endpoint</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                    <AnimatePresence mode="popLayout">
                        {filteredEndpoints.length > 0 ? (
                            filteredEndpoints.map((ep) => (
                                <motion.div 
                                    layout
                                    key={ep.id} 
                                    variants={itemVariants}
                                    className={`p-5 flex items-center justify-between transition-all group ${isDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-20 py-2 text-[11px] font-black uppercase tracking-tighter rounded-xl border text-center shadow-sm ${getMethodColor(ep.method)}`}>
                                            {ep.method}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <code className={`font-mono text-sm font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                    {ep.path}
                                                </code>
                                                {ep.authRequired ? (
                                                    <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 font-black uppercase tracking-widest">
                                                        <Lock className="w-2.5 h-2.5" />
                                                        Protected
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/30 font-black uppercase tracking-widest">
                                                        <Globe className="w-2.5 h-2.5" />
                                                        Public
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs max-w-xl line-clamp-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {ep.description || "No documentation provided for this route."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onOpenTestModal(ep)}
                                            className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition border border-slate-700 shadow-lg"
                                        >
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            <span>Test Suite</span>
                                        </button>

                                        {activeRole === UserRole.DEVELOPER && (
                                            <button
                                                onClick={() => handleDelete(ep.id)}
                                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition border border-transparent hover:border-rose-500/20"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                                    <Search className="w-8 h-8 text-slate-700" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-400 font-bold">No endpoints found</p>
                                    <p className="text-slate-500 text-xs">Try adjusting your filters or add a new endpoint manually.</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default EndpointsView;
