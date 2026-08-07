import React from 'react';
import { useApp } from '../context/AppContext';

export default function Toast() {
    const { toastMessage, isDarkMode } = useApp();

    if (!toastMessage) return null;

    return (
        <div className={`fixed bottom-6 right-6 border px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-fade-in text-xs font-bold transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${toastMessage.type === 'error' ? 'bg-rose-500' : 'bg-emerald-400'}`}></div>
            <span>{toastMessage.text}</span>
        </div>
    );
}
