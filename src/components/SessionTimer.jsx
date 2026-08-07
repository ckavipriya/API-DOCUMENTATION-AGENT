import React from 'react';
import { useApp } from '../context/AppContext';

export default function SessionTimer() {
    const { sessionDuration } = useApp();
    return (
        <div className="text-3xl font-black text-white tracking-tight mb-1 font-mono">
            {sessionDuration}
        </div>
    );
}
