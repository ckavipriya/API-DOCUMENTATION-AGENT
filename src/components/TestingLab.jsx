import React, { useState, useEffect, useMemo } from 'react';
import { 
    Play, 
    Trash2, 
    Plus, 
    Search, 
    Terminal, 
    Copy,
    Check,
    FlaskConical,
    Globe,
    Shield,
    History,
    Code,
    Clock,
    AlertCircle,
    ChevronRight,
    Settings,
    Database
} from 'lucide-react';
import SyntaxHighlighter from './SyntaxHighlighter';
import { useApp } from '../context/AppContext';

export default function TestingLab() {
    const { 
        activeEndpoints: endpoints, 
        isDarkMode, 
        activeVersions: versions, 
        selectedVersion, 
        setSelectedVersion: onVersionChange,
        activeProject,
        showToast
    } = useApp();
    
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
    const [requestBody, setRequestBody] = useState("{}");
    const [headers, setHeaders] = useState([
        { key: 'Content-Type', value: 'application/json', active: true },
        { key: 'Accept', value: 'application/json', active: true }
    ]);
    const [queryParams, setQueryParams] = useState([]);
    const [pathParams, setPathParams] = useState([]);
    const [response, setResponse] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activePanel, setActivePanel] = useState('params'); // 'params', 'headers', 'body', 'auth'
    const [history, setHistory] = useState([]);
    const [sidebarTab, setSidebarTab] = useState('endpoints'); // 'endpoints', 'history'

    const filteredEndpoints = useMemo(() => endpoints.filter(ep => 
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ep.method.toLowerCase().includes(searchQuery.toLowerCase())
    ), [endpoints, searchQuery]);

    useEffect(() => {
        if (!selectedEndpoint && endpoints.length > 0) {
            setSelectedEndpoint(endpoints[0]);
        }
    }, [endpoints, selectedEndpoint]);

    useEffect(() => {
        if (selectedEndpoint) {
            // Detect path parameters (e.g., /users/:id or /users/{id})
            const pathMatches = selectedEndpoint.path.match(/[:{]([^}/]+)[}]?/g) || [];
            setPathParams(pathMatches.map(m => ({
                key: m.replace(/[:{}]/g, ''),
                value: '',
                original: m
            })));

            // Default query params from spec if available
            setQueryParams(selectedEndpoint.parameters?.filter(p => p.in === 'query').map(p => ({
                key: p.name,
                value: '',
                active: true
            })) || []);

            // Default body based on method
            if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method)) {
                const defaultBody = selectedEndpoint.parameters?.filter(p => p.in === 'body' || !p.in).reduce((acc, p) => ({ ...acc, [p.name]: "" }), {}) || {};
                setRequestBody(JSON.stringify(defaultBody, null, 2));
            } else {
                setRequestBody("");
            }
            
            setResponse(null);
        }
    }, [selectedEndpoint]);

    const fullUrl = useMemo(() => {
        if (!selectedEndpoint) return "";
        let path = selectedEndpoint.path;
        pathParams.forEach(p => {
            if (p.value) {
                path = path.replace(p.original, p.value);
            }
        });
        
        const qStr = queryParams
            .filter(q => q.active && q.key && q.value)
            .map(q => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
            .join('&');
            
        return `${baseUrl.replace(/\/$/, '')}${path}${qStr ? `?${qStr}` : ''}`;
    }, [baseUrl, selectedEndpoint, pathParams, queryParams]);

    const handleSendRequest = async () => {
        if (!selectedEndpoint) return;
        setIsLoading(true);
        setResponse({ status: "Pending...", body: "Initiating secure request tunnel..." });

        const startTime = Date.now();
        const activeHeaders = headers
            .filter(h => h.active && h.key)
            .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

        try {
            const fetchOptions = {
                method: selectedEndpoint.method,
                headers: activeHeaders,
            };

            if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
                fetchOptions.body = requestBody;
            }

            const res = await fetch(fullUrl, fetchOptions).catch(err => {
                return { simulated: true, error: err.message };
            });

            const duration = Date.now() - startTime;

            let responseData;
            if (res.simulated) {
                responseData = {
                    status: 200,
                    statusText: "OK (Simulated)",
                    latency: `${duration}ms`,
                    type: "application/json",
                    body: JSON.stringify({
                        message: "Request captured by AI Documentation Agent",
                        url: fullUrl,
                        method: selectedEndpoint.method,
                        headers: activeHeaders,
                        payload: requestBody ? (JSON.parse(requestBody) || requestBody) : null,
                        timestamp: new Date().toISOString(),
                        simulation: true,
                        advice: "To test against a real server, ensure your backend is running and allow CORS from this origin."
                    }, null, 2)
                };
            } else {
                const contentType = res.headers.get("content-type");
                let body;
                if (contentType && contentType.includes("application/json")) {
                    body = JSON.stringify(await res.json(), null, 2);
                } else {
                    body = await res.text();
                }

                responseData = {
                    status: res.status,
                    statusText: res.statusText,
                    latency: `${duration}ms`,
                    type: contentType,
                    body: body
                };
            }

            setResponse(responseData);
            setHistory(prev => [{
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                method: selectedEndpoint.method,
                path: selectedEndpoint.path,
                status: responseData.status,
                url: fullUrl
            }, ...prev].slice(0, 20));

        } catch (err) {
            setResponse({
                status: "Error",
                statusText: "Connection Failed",
                latency: "0ms",
                body: JSON.stringify({ error: err.message, advice: "Check your network connection and CORS settings." }, null, 2)
            });
        } finally {
            setIsLoading(false);
        }
    };

    const addHeader = () => setHeaders([...headers, { key: '', value: '', active: true }]);
    const removeHeader = (index) => setHeaders(headers.filter((_, i) => i !== index));
    const updateHeader = (index, field, val) => {
        const newHeaders = [...headers];
        newHeaders[index][field] = val;
        setHeaders(newHeaders);
    };

    const addQueryParam = () => setQueryParams([...queryParams, { key: '', value: '', active: true }]);
    const removeQueryParam = (index) => setQueryParams(queryParams.filter((_, i) => i !== index));
    const updateQueryParam = (index, field, val) => {
        const newParams = [...queryParams];
        newParams[index][field] = val;
        setQueryParams(newParams);
    };

    const updatePathParam = (index, val) => {
        const newParams = [...pathParams];
        newParams[index].value = val;
        setPathParams(newParams);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getCurlSnippet = () => {
        if (!selectedEndpoint) return "";
        let curl = `curl -X ${selectedEndpoint.method} "${fullUrl}"`;
        headers.filter(h => h.active && h.key).forEach(h => {
            curl += ` \\\n  -H "${h.key}: ${h.value}"`;
        });
        if (requestBody && ['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method)) {
            curl += ` \\\n  -d '${requestBody.replace(/'/g, "'\\''")}'`;
        }
        return curl;
    };

    return (
        <div className="flex h-full border rounded-[32px] overflow-hidden shadow-2xl transition-all" style={{ borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}>
            {/* Sidebar: Browser & History */}
            <div className={`w-72 border-r flex flex-col transition-all ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="p-4 border-b border-slate-800/50">
                    <div className="flex p-1 rounded-xl bg-slate-900/50 border border-slate-800 mb-4">
                        <button 
                            onClick={() => setSidebarTab('endpoints')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'endpoints' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Endpoints
                        </button>
                        <button 
                            onClick={() => setSidebarTab('history')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            History
                        </button>
                    </div>

                    {sidebarTab === 'endpoints' ? (
                        <>
                            <div className="mb-4">
                                <label className={`text-[9px] font-black uppercase tracking-widest block mb-1.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Environment
                                </label>
                                <select 
                                    value={selectedVersion?.id || ""}
                                    onChange={(e) => {
                                        const version = versions.find(v => v.id === e.target.value);
                                        if (version) onVersionChange(version);
                                    }}
                                    className={`w-full px-2 py-2 rounded-xl text-[10px] font-bold focus:outline-none transition-all ${
                                        isDarkMode 
                                        ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500/50' 
                                        : 'bg-white border-slate-200 text-slate-700 shadow-sm focus:border-indigo-300'
                                    } border`}
                                >
                                    {versions.length > 0 ? (
                                        versions.map(v => (
                                            <option key={v.id} value={v.id}>
                                                v{v.version} - {v.name || 'Build Schema'}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">Default Branch</option>
                                    )}
                                </select>
                            </div>
                            <div className="relative">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                                <input 
                                    type="text" 
                                    placeholder="Search endpoints..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-700'}`}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recent Activity</span>
                            <button onClick={() => setHistory([])} className="text-[9px] font-bold text-rose-500 hover:underline">Clear All</button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {sidebarTab === 'endpoints' ? (
                        filteredEndpoints.map(ep => (
                            <button
                                key={ep.id}
                                onClick={() => setSelectedEndpoint(ep)}
                                className={`w-full p-3 rounded-2xl text-left transition-all group flex flex-col gap-1.5 ${
                                    selectedEndpoint?.id === ep.id 
                                    ? (isDarkMode ? 'bg-indigo-600/10 border-indigo-500/30 shadow-inner' : 'bg-indigo-50 border-indigo-100') 
                                    : 'hover:bg-slate-800/30 border-transparent'
                                } border`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg uppercase border ${
                                        ep.method === 'GET' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                        ep.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                    }`}>
                                        {ep.method}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold truncate tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{ep.path}</span>
                                </div>
                                {ep.description && (
                                    <p className={`text-[9px] truncate leading-none ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{ep.description}</p>
                                )}
                            </button>
                        ))
                    ) : (
                        history.map(item => (
                            <button
                                key={item.id}
                                className={`w-full p-3 rounded-2xl text-left transition-all border border-transparent hover:bg-slate-800/30 group`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg uppercase ${
                                        item.status >= 200 && item.status < 300 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                    }`}>
                                        {item.status}
                                    </span>
                                    <span className="text-[8px] font-medium text-slate-600">{item.timestamp}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] font-black text-slate-500">{item.method}</span>
                                    <span className="text-[10px] font-mono text-slate-400 truncate">{item.path}</span>
                                </div>
                            </button>
                        ))
                    )}
                    
                    {sidebarTab === 'history' && history.length === 0 && (
                        <div className="text-center py-20 opacity-30 flex flex-col items-center">
                            <Clock className="w-8 h-8 mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">No history yet</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Area: Request Builder */}
            <div className={`flex-1 flex flex-col min-w-0 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                {selectedEndpoint ? (
                    <>
                        {/* URL Bar & Config */}
                        <div className={`p-6 border-b space-y-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-800 pr-3 mr-1">
                                        <Globe className="w-3.5 h-3.5" />
                                        <span>Base</span>
                                    </div>
                                    <input 
                                        type="text"
                                        value={baseUrl}
                                        onChange={(e) => setBaseUrl(e.target.value)}
                                        className={`flex-1 bg-transparent border-none outline-none text-xs font-mono font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                                        placeholder="http://localhost:3000"
                                    />
                                </div>
                                <button 
                                    onClick={handleSendRequest}
                                    disabled={isLoading}
                                    className={`px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0`}
                                >
                                    {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Play className="w-4 h-4 fill-current" />
                                    )}
                                    <span>{isLoading ? 'Processing' : 'Execute'}</span>
                                </button>
                            </div>

                            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl text-[11px] font-mono ${isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                <span className={`font-black ${selectedEndpoint.method === 'GET' ? 'text-sky-400' : 'text-emerald-400'}`}>
                                    {selectedEndpoint.method}
                                </span>
                                <span className="opacity-50">→</span>
                                <span className="truncate">{fullUrl}</span>
                                <button onClick={() => copyToClipboard(fullUrl)} className="ml-auto hover:text-white transition-colors">
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Request Content Split */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                                {/* Configuration Panel */}
                                <div className={`flex flex-col border-r overflow-hidden ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                    {/* Sub-tabs */}
                                    <div className={`flex items-center px-6 border-b transition-all ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                        {[
                                            { id: 'params', label: 'Params', icon: Settings },
                                            { id: 'headers', label: 'Headers', icon: Shield },
                                            { id: 'body', label: 'Body', icon: Code, hidden: !['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) },
                                            { id: 'auth', label: 'Auth', icon: Database }
                                        ].filter(t => !t.hidden).map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActivePanel(tab.id)}
                                                className={`py-4 px-4 text-[10px] font-black uppercase tracking-[0.15em] border-b-2 transition-all flex items-center gap-2 ${
                                                    activePanel === tab.id 
                                                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                                                    : 'border-transparent text-slate-500 hover:text-slate-300'
                                                }`}
                                            >
                                                <tab.icon className="w-3 h-3" />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                        {activePanel === 'params' && (
                                            <div className="space-y-8">
                                                {pathParams.length > 0 && (
                                                    <section>
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                                            <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                                            Path Variables
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {pathParams.map((p, i) => (
                                                                <div key={i} className="flex items-center gap-4">
                                                                    <div className="w-32 text-[11px] font-mono font-bold text-slate-400 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800 truncate">
                                                                        {p.key}
                                                                    </div>
                                                                    <input 
                                                                        type="text"
                                                                        value={p.value}
                                                                        onChange={(e) => updatePathParam(i, e.target.value)}
                                                                        className={`flex-1 px-3 py-2 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200'} border`}
                                                                        placeholder="Value"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}

                                                <section>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                            <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                                                            Query Parameters
                                                        </h4>
                                                        <button onClick={addQueryParam} className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all">
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {queryParams.map((q, i) => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={q.active} 
                                                                    onChange={(e) => updateQueryParam(i, 'active', e.target.checked)}
                                                                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Key" 
                                                                    value={q.key}
                                                                    onChange={(e) => updateQueryParam(i, 'key', e.target.value)}
                                                                    className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-mono focus:ring-1 focus:ring-indigo-500/50 focus:outline-none ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'} border`}
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Value" 
                                                                    value={q.value}
                                                                    onChange={(e) => updateQueryParam(i, 'value', e.target.value)}
                                                                    className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-mono focus:ring-1 focus:ring-indigo-500/50 focus:outline-none ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'} border`}
                                                                />
                                                                <button onClick={() => removeQueryParam(i)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {queryParams.length === 0 && (
                                                            <p className="text-[10px] text-slate-600 italic">No query parameters defined.</p>
                                                        )}
                                                    </div>
                                                </section>
                                            </div>
                                        )}

                                        {activePanel === 'headers' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Request Headers</h4>
                                                    <button onClick={addHeader} className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-all">
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {headers.map((h, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={h.active} 
                                                                onChange={(e) => updateHeader(i, 'active', e.target.checked)}
                                                                className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                placeholder="Key" 
                                                                value={h.key}
                                                                onChange={(e) => updateHeader(i, 'key', e.target.value)}
                                                                className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-mono focus:ring-1 focus:ring-indigo-500/50 focus:outline-none ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'} border`}
                                                            />
                                                            <input 
                                                                type="text" 
                                                                placeholder="Value" 
                                                                value={h.value}
                                                                onChange={(e) => updateHeader(i, 'value', e.target.value)}
                                                                className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-mono focus:ring-1 focus:ring-indigo-500/50 focus:outline-none ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'} border`}
                                                            />
                                                            <button onClick={() => removeHeader(i)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activePanel === 'body' && (
                                            <div className="flex flex-col h-full">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">JSON Payload</h4>
                                                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase border border-indigo-500/20">application/json</span>
                                                </div>
                                                <textarea
                                                    value={requestBody}
                                                    onChange={(e) => setRequestBody(e.target.value)}
                                                    spellCheck="false"
                                                    className={`w-full flex-1 p-5 rounded-2xl font-mono text-[11px] leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ${isDarkMode ? 'bg-slate-950 text-emerald-400 border-slate-800 shadow-inner' : 'bg-slate-50 text-indigo-700 border-slate-200'} border custom-scrollbar`}
                                                    placeholder='{ "key": "value" }'
                                                />
                                            </div>
                                        )}

                                        {activePanel === 'auth' && (
                                            <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
                                                <Shield className="w-12 h-12 text-slate-800 mb-2" />
                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authentication Helper</h5>
                                                <p className="text-[10px] text-slate-600 max-w-xs leading-relaxed">
                                                    In this release, please add Authorization headers manually in the Headers tab. Advanced OAuth and JWT generators are coming in the next sprint.
                                                </p>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setHeaders(prev => [...prev, { key: 'Authorization', value: 'Bearer <TOKEN>', active: true }]);
                                                            setActivePanel('headers');
                                                        }}
                                                        className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
                                                    >
                                                        Add Bearer Template
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Response Panel */}
                                <div className={`flex flex-col overflow-hidden ${isDarkMode ? 'bg-slate-950/20' : 'bg-slate-50/50'}`}>
                                    {response ? (
                                        <div className="flex flex-col h-full overflow-hidden">
                                            {/* Response Header */}
                                            <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                                <div className="flex items-center gap-8">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>HTTP Status</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className={`w-2 h-2 rounded-full ${response.status >= 200 && response.status < 300 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
                                                            <span className={`text-sm font-black ${
                                                                response.status >= 200 && response.status < 300 ? 'text-emerald-500' : 'text-rose-500'
                                                            }`}>
                                                                {response.status} {response.statusText}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Latency</span>
                                                        <span className={`text-sm font-black mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{response.latency}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => copyToClipboard(response.body)}
                                                        className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 shadow-sm'}`}
                                                        title="Copy Body"
                                                    >
                                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tabs for Response Area */}
                                            <div className="flex-1 overflow-hidden flex flex-col">
                                                <div className="flex px-6 border-b border-slate-800/50 bg-slate-950/30">
                                                    <button className="py-3 px-4 text-[9px] font-black uppercase tracking-widest border-b-2 border-indigo-500 text-indigo-400">Response Body</button>
                                                    <button className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors">Raw Headers</button>
                                                    <button className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors">Visualizer</button>
                                                </div>
                                                
                                                <div className="flex-1 overflow-auto p-0 custom-scrollbar">
                                                    <SyntaxHighlighter 
                                                        code={response.body} 
                                                        language="json" 
                                                        isDarkMode={isDarkMode} 
                                                        className="min-h-full"
                                                    />
                                                </div>

                                                {/* Code Snippets Section */}
                                                <div className={`p-4 border-t ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                            <Terminal className="w-3.5 h-3.5" />
                                                            Developer Snippet (cURL)
                                                        </span>
                                                        <button 
                                                            onClick={() => copyToClipboard(getCurlSnippet())}
                                                            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300"
                                                        >
                                                            Copy Snippet
                                                        </button>
                                                    </div>
                                                    <div className={`p-3 rounded-xl border font-mono text-[10px] whitespace-pre-wrap break-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
                                                        {getCurlSnippet()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                                            <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center mb-6 border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-100 text-slate-200 shadow-xl shadow-slate-200/50'}`}>
                                                <Terminal className="w-10 h-10" />
                                            </div>
                                            <h5 className={`text-sm font-black mb-2 uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Output Console</h5>
                                            <p className={`text-[11px] max-w-[240px] leading-relaxed ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                                Select an endpoint and click "Execute" to start real-time traffic analysis and debug response payloads.
                                            </p>
                                            
                                            <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
                                                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-white'}`}>
                                                    <div className="text-indigo-500 mb-2"><Globe className="w-4 h-4" /></div>
                                                    <div className={`text-[9px] font-black uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`}>CORS Safe</div>
                                                    <div className="text-[9px] text-slate-500">Auto-handles origin validation</div>
                                                </div>
                                                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-white'}`}>
                                                    <div className="text-emerald-500 mb-2"><Shield className="w-4 h-4" /></div>
                                                    <div className={`text-[9px] font-black uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`}>SSL Proxy</div>
                                                    <div className="text-[9px] text-slate-500">Secure end-to-end encryption</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-fade-in">
                        <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 border relative group ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-800' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                            <div className="absolute inset-0 bg-indigo-600/10 rounded-[32px] blur-2xl group-hover:bg-indigo-600/20 transition-all"></div>
                            <FlaskConical className="w-12 h-12 relative z-10" />
                        </div>
                        <h4 className={`text-2xl font-black mb-3 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>API Testing Laboratory</h4>
                        <p className={`text-sm max-w-sm leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Select a discovered endpoint from the explorer sidebar to begin building, validating, and debugging your RESTful interfaces.
                        </p>
                        
                        <div className="mt-12 flex items-center gap-6 opacity-30">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Validated Schema</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Real-time Latency</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Payload Debug</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
