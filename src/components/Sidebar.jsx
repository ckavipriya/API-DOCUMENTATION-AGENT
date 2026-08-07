import React from 'react';
import { motion } from 'motion/react';
import { 
    LayoutDashboard, 
    Terminal, 
    FlaskConical, 
    Database, 
    Clock, 
    Plus, 
    ChevronRight,
    Activity,
    BookOpen,
    Code2,
    Zap
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, activeProject, setIsNewProjectModalOpen, isDarkMode }) => {
    const tabs = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Overview & Health" },
        { id: "endpoints", label: "Endpoints", icon: Terminal, desc: "API Explorer" },
        { id: "lab", label: "Testing Lab", icon: FlaskConical, desc: "Debug & Validate" },
        { id: "knowledge", label: "Knowledge", icon: Database, desc: "GraphRAG & Search" },
        { id: "code", label: "Source Code", icon: Code2, desc: "File Explorer" },
        { id: "spec", label: "Documentation", icon: BookOpen, desc: "OpenAPI & Markdown" },
        { id: "versions", label: "Versions", icon: Clock, desc: "History & Diff" },
    ];

    return (
        <aside className={`w-64 h-full border-r flex flex-col shrink-0 transition-all duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="p-6 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Zap className="w-5 h-5 text-white fill-current" />
                </div>
                <div>
                    <h1 className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>BACKEND.AI</h1>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">RAG Engine</p>
                </div>
            </div>

            <div className="px-4 mb-6">
                <button
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Codebase</span>
                </button>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
                <p className={`px-4 text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Main Workspace</p>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                                isActive 
                                    ? (isDarkMode ? 'bg-indigo-500/10 text-white' : 'bg-indigo-50 text-indigo-700') 
                                    : (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')
                            }`}
                        >
                            {isActive && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full"
                                />
                            )}
                            <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-500' : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`} />
                            <div className="flex flex-col items-start text-left">
                                <span className="text-xs font-bold">{tab.label}</span>
                                <span className={`text-[9px] font-medium leading-none ${isActive ? (isDarkMode ? 'text-slate-400' : 'text-indigo-500/60') : 'text-slate-500'}`}>
                                    {tab.desc}
                                </span>
                            </div>
                            {isActive && <ChevronRight className="w-3 h-3 ml-auto text-indigo-500" />}
                        </button>
                    );
                })}
            </nav>

            {activeProject && (
                <div className={`p-4 mt-auto border-t transition-all ${isDarkMode ? 'border-slate-800' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                            <Activity className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Active Project</p>
                            <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activeProject.name}</p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
