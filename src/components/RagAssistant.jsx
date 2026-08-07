import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bot, Search, Download, RefreshCw, ArrowRight, User, Sparkles, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const RagAssistant = () => {
    const { 
        activeProject, 
        chatHistory, 
        isChatLoading, 
        isDarkMode
    } = useApp();

    const [chatInput, setChatInput] = useState("");
    const [chatSearch, setChatSearch] = useState("");
    const chatEndRef = useRef(null);
    const chatInputRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isChatLoading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading || !activeProject) return;

        const userMsg = chatInput;
        setChatInput("");
        
        try {
            // This is handled by a side effect or direct call in a real app, 
            // here we simulate the flow that would trigger the server to use Gemini + RAG
            const res = await fetch(`/api/projects/${activeProject.id}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg }),
            });
            
            if (res.ok) {
                // In a real app, the server would return the message and we'd refresh history
                // or the server would push it via WebSocket. Here we'll refresh via the hook's mechanism if available.
                // For simplicity, we assume fetchProjectData or similar refreshes history.
                // The AppContext might need a specific fetchChatHistory.
            }
        } catch (err) {
            console.error("Chat error:", err);
        }
    };

    const handleExportChat = () => {
        const content = chatHistory.map(m => `[${m.sender.toUpperCase()}] ${m.content}`).join('\n\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "nexusdocs_chat_history.txt";
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredHistory = chatHistory.filter(msg => {
        if (!chatSearch.trim()) return true;
        return msg.content.toLowerCase().includes(chatSearch.toLowerCase());
    });

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card rounded-[32px] p-8 flex flex-col gap-6 transition-all min-h-[400px] max-h-[600px] border-2 ${isDarkMode ? 'border-slate-800/50' : 'border-slate-200 shadow-2xl shadow-indigo-500/5'}`}
        >
            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-6 transition-all ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Nexus AI Assistant
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                <Sparkles className="w-3 h-3" />
                                GraphRAG Intelligence Active
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative hidden sm:block">
                        <Search className={`w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        <input 
                            type="text"
                            placeholder="Filter conversations..."
                            value={chatSearch}
                            onChange={(e) => setChatSearch(e.target.value)}
                            className={`pl-10 pr-4 py-2 border rounded-xl text-xs placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 w-48 focus:w-64 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                        />
                    </div>
                    <button
                        onClick={handleExportChat}
                        title="Export History"
                        className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 shadow-sm'}`}
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                {filteredHistory.length === 0 && !isChatLoading && (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                            <Database className="w-8 h-8 text-slate-800" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 font-bold">Vector Knowledge Base Ready</p>
                            <p className="text-slate-500 text-xs max-w-xs mx-auto">
                                Ask about project dependencies, endpoint logic, or security patterns found in your code.
                            </p>
                        </div>
                    </div>
                )}
                
                <AnimatePresence mode="popLayout">
                    {filteredHistory.map((msg) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={msg.id} 
                            className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 shadow-lg ${
                                msg.sender === 'user' 
                                    ? 'bg-slate-800 border-slate-700 text-white' 
                                    : 'bg-indigo-600 border-indigo-500 text-white'
                            }`}>
                                {msg.sender === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
                            </div>
                            <div className={`p-4 rounded-[24px] max-w-[80%] leading-relaxed shadow-xl text-[13px] ${
                                msg.sender === 'user'
                                    ? 'bg-slate-800 text-slate-100 rounded-tr-none'
                                    : isDarkMode 
                                        ? 'bg-slate-900 border-2 border-slate-800 text-slate-200 rounded-tl-none' 
                                        : 'bg-indigo-50 border-2 border-indigo-100 text-slate-700 rounded-tl-none'
                            }`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isChatLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4 items-center"
                    >
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border-2 border-indigo-500/20 animate-pulse">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        </div>
                        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-slate-900 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                            Synthesizing Code Context...
                        </div>
                    </motion.div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="relative mt-2">
                <input
                    ref={chatInputRef}
                    type="text"
                    placeholder="Ask a question about the discovered API patterns..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className={`w-full pl-6 pr-32 py-4 border-2 rounded-[24px] text-sm placeholder:text-slate-600 focus:outline-none focus:ring-12 focus:ring-indigo-500/5 transition-all shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-slate-800 text-[10px] font-mono text-slate-500 rounded-lg border border-slate-700 uppercase">
                        Enter
                    </kbd>
                    <button
                        type="submit"
                        disabled={isChatLoading || !chatInput.trim()}
                        className="p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl shadow-xl shadow-indigo-500/30 transition-all disabled:opacity-30 disabled:grayscale transform active:scale-95"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default RagAssistant;
