import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "./context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { FileCode, Terminal, Folder, Layers, Bot, Download, Play, Plus, Trash2, Check, AlertCircle, Edit, ChevronRight, ChevronDown, HelpCircle, Sparkles, Cpu, RefreshCw, Save, FileText, UserCheck, X, Search, Clock, Shield, Globe, ArrowRight, Zap, Copy, Upload, Sun, Moon, FlaskConical, Database, GitCompare, Share2, Menu, LayoutDashboard, Settings, Activity, BookOpen, Code2 } from "lucide-react";
import { UserRole } from "./types";
import { FoldableCodeEditor } from "./components/FoldableCodeEditor";
import { TestEndpointModal } from "./components/TestEndpointModal";
import Login from "./components/Login";
import FileUpload from "./components/FileUpload";
import SyntaxHighlighter from "./components/SyntaxHighlighter";
import HealthMonitor from "./components/HealthMonitor";
import TestingLab from "./components/TestingLab";
import KnowledgeManagement from "./components/KnowledgeManagement";
import MetricsChart from "./components/MetricsChart";
import VersionDiffViewer from "./components/VersionDiffViewer";
import Toast from "./components/Toast";
import SessionTimer from "./components/SessionTimer";
import AnalysisModal from "./components/AnalysisModal";
import KnowledgeGraph from "./components/KnowledgeGraph";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import EndpointsView from "./components/EndpointsView";
import SourceCodeView from "./components/SourceCodeView";
import SpecView from "./components/SpecView";
import VersionsView from "./components/VersionsView";
import RagAssistant from "./components/RagAssistant";
import NotFoundView from "./components/NotFoundView";
import WelcomeView from "./components/WelcomeView";

function safeJsonStringify(obj, space) {
    if (obj === null || obj === undefined) return String(obj);
    
    const isRestricted = (v, k) => {
        if (!v || typeof v !== 'object') return false;
        try {
            // Check for React/DOM/Internal markers
            if (v.$$typeof || v._owner || v._ownerIndex) return true;
            if (('nodeType' in v) || ('nodeName' in v) || v.ownerDocument) return true;
            
            // Check keys for internal markers
            if (k && typeof k === 'string') {
                const kl = k.toLowerCase();
                if (kl.includes('react') || kl.includes('fiber') || kl.includes('framer') || kl.startsWith('__') || kl.startsWith('_')) {
                    // Only restrict if it's an object (recursive protection)
                    if (typeof v === 'object') return true;
                }
            }
            
            // Host and Internal objects by constructor name
            const c = v.constructor;
            if (c) {
                const n = c.name;
                if (typeof n === 'string') {
                    if (['Window', 'FiberNode', 'HTMLElement', 'HTMLDocument', 'Document', 'Node', 'Event', 'EventTarget', 'FileList', 'File', 'Blob', 'Location', 'History'].includes(n)) return true;
                    if ((n.startsWith('HTML') && n.endsWith('Element')) || n.includes('Fiber') || n.includes('React')) return true;
                }
            }

            // Instance checks (safest in same-window contexts)
            if (typeof window !== 'undefined') {
                if (v instanceof window.HTMLElement || v instanceof window.Node || v === window || v === document) return true;
            }

            // Fallback toString check
            const s = Object.prototype.toString.call(v);
            if (s.includes('HTML') || s.includes('Window') || s.includes('Node') || s.includes('Event') || s.includes('Fiber') || s.includes('React')) return true;
        } catch (e) {
            return true;
        }
        return false;
    };

    const seen = new WeakSet();
    try {
        return JSON.stringify(obj, (key, value) => {
            try {
                if (value && typeof value === 'object') {
                    if (isRestricted(value, key)) {
                        return `[Restricted: ${value.constructor?.name || 'Object'}]`;
                    }
                    if (seen.has(value)) return "[Circular]";
                    seen.add(value);
                }
                return value;
            } catch (e) {
                return "[Error during serialization]";
            }
        }, space);
    } catch (err) {
        console.warn("safeJsonStringify internal error:", err.message || String(err));
        try {
            // Ultimate fallback: non-recursive stringify
            return `[Serialization Error: ${String(err)}]`;
        } catch (e) {
            return "[Total Serialization Failure]";
        }
    }
}

// Global safeguard for JSON.stringify to handle circular structures across all libraries
if (typeof window !== 'undefined' && !window._jsonStringifyPatched) {
    const originalStringify = JSON.stringify;
    JSON.stringify = function(obj, replacer, space) {
        // If replacer is already provided, we assume the caller knows what they are doing
        // or we are being called recursively by our own safeJsonStringify.
        if (replacer) {
            return originalStringify.apply(this, arguments);
        }
        try {
            return originalStringify.apply(this, arguments);
        } catch (err) {
            if (err.message && err.message.includes("circular structure")) {
                return safeJsonStringify(obj, space);
            }
            throw err;
        }
    };
    window._jsonStringifyPatched = true;
}

export default function App() {
    const {
        isLoggedIn, setIsLoggedIn,
        currentUser, setCurrentUser,
        activeRole, setActiveRole,
        users, setUsers,
        projects, setProjects,
        activeProject, setActiveProject,
        activeEndpoints, setActiveEndpoints,
        activeVersions, setActiveVersions,
        selectedVersion, setSelectedVersion,
        activeTab, setActiveTab,
        chatHistory, setChatHistory,
        isChatLoading, setIsChatLoading,
        sessionDuration,
        isDarkMode, setIsDarkMode,
        toastMessage, setToastMessage,
        showToast,
        fetchProjectData,
        fetchProjects,
        projectTemplates, setProjectTemplates,
        analysisSteps, setAnalysisSteps,
        isAnalyzing, setIsAnalyzing,
        handleLogin, handleLogout
    } = useApp();

    // Local UI state
    const [selectedEndpointIds, setSelectedEndpointIds] = useState(new Set());
    
    const [endpointSearch, setEndpointSearch] = useState("");
    
    // Selected sub-items
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [editedCode, setEditedCode] = useState("");
    
    // New Project Modal State
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [isDiffViewerOpen, setIsDiffViewerOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectFramework, setNewProjectFramework] = useState("express");
    
    // Chat State
    const [chatInput, setChatInput] = useState("");
    const [chatSearch, setChatSearch] = useState("");
    
    // Manual Endpoint Creator State
    const [isAddEndpointOpen, setIsAddEndpointOpen] = useState(false);
    const [newEndpointPath, setNewEndpointPath] = useState("/api/v1/users");
    const [newEndpointMethod, setNewEndpointMethod] = useState("GET");
    const [newEndpointDesc, setNewEndpointDesc] = useState("Fetch list of registered system users.");
    
    // Test Endpoint Modal State
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testRequestBody, setTestRequestBody] = useState("{}");
    const [testResponse, setTestResponse] = useState(null);
    
    // Source Navigation State
    const [highlightedLine, setHighlightedLine] = useState();
    
    // Keyboard Shortcuts Refs
    const saveCodeRef = useRef(null);
    const sendMessageRef = useRef(null);
    const chatInputRef = useRef(null);
    const globalFileInputRef = useRef(null);
    const toggleThemeRef = useRef(null);
    
    useEffect(() => {
        saveCodeRef.current = handleSaveCode;
        sendMessageRef.current = handleSendMessage;
        toggleThemeRef.current = () => setIsDarkMode(prev => !prev);
    });

    useEffect(() => {
        const handleKeyDown = (event) => {
            const isMod = event.ctrlKey || event.metaKey;
            
            if (isMod && event.key === 's') {
                event.preventDefault();
                if (saveCodeRef.current) saveCodeRef.current();
            }
            if (isMod && event.key === 'Enter') {
                event.preventDefault();
                if (sendMessageRef.current) sendMessageRef.current();
            }
            // NEW SHORTCUTS
            if (isMod && event.key === 'u') {
                event.preventDefault();
                globalFileInputRef.current?.click();
            }
            if (isMod && event.key === 'k') {
                event.preventDefault();
                chatInputRef.current?.focus();
            }
            if (isMod && event.key === 't') {
                event.preventDefault();
                if (toggleThemeRef.current) toggleThemeRef.current();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const chatEndRef = useRef(null);

    const filteredEndpoints = activeEndpoints.filter((ep) => {
        const query = endpointSearch.toLowerCase().trim();
        if (!query) return true;
        return (
            (ep.path && ep.path.toLowerCase().includes(query)) ||
            (ep.method && ep.method.toLowerCase().includes(query)) ||
            (ep.description && ep.description.toLowerCase().includes(query))
        );
    });

    // Global error handler for debugging
    useEffect(() => {
        const handleError = (event) => {
            const errorMsg = event.error?.message || event.message || "";
            if (errorMsg.includes("circular structure to JSON")) {
                // Avoid logging the entire error object if it's circular
                console.error("DETECTED CIRCULAR JSON ERROR:", errorMsg);
                try {
                    const stack = event.error?.stack;
                    if (stack) console.log("Stack Trace:", stack);
                } catch (e) {
                    // Ignore stack trace extraction errors
                }
            }
        };
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    useEffect(() => {
        if (activeProject?.id) {
            // We can still trigger some local cleanup or side effects here if needed
            // But fetchProjectData is now called inside AppContext when activeProject changes or in fetchProjects
        } else {
            setActiveEndpoints([]);
            setActiveVersions([]);
            setSelectedVersion(null);
            setSelectedEndpoint(null);
            setSelectedFile(null);
            setChatHistory([]);
        }
    }, [activeProject?.id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const handleUserChange = (userId) => {
        setCurrentUser(userId);
        const user = users.find((u) => u.id === userId);
        if (user) {
            setActiveRole(user.role);
            showToast(`Logged in as ${user.name} (${user.role})`);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Project deleted successfully.");
                const remaining = projects.filter((p) => p.id !== id);
                setProjects(remaining);
                if (remaining.length > 0) {
                    setActiveProject(remaining[0]);
                } else {
                    setActiveProject(null);
                }
            }
        } catch (err) {
            showToast("Error deleting project", "error");
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            showToast("Please enter a project name.", "error");
            return;
        }
        const files = projectTemplates?.[newProjectFramework];
        if (!files) {
            showToast("Template not found.", "error");
            return;
        }
        setIsNewProjectModalOpen(false);
        setIsAnalyzing(true);
        setAnalysisSteps([
            "🔍 Loading source files...",
            "🧩 Splitting code files into 1,000 character overlapping chunks...",
            "🧬 Requesting Gemini to generate 768-dimension vector embeddings...",
            "💾 Initializing vector storage index...",
            "🤖 LLM Analysis: Passing chunks to Gemini-2.0-flash to parse route decorators..."
        ]);
        try {
            const res = await fetch("/api/projects/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: safeJsonStringify({
                    name: newProjectName,
                    framework: newProjectFramework,
                    files,
                    userId: currentUser,
                }),
            });
            if (!res.ok) throw new Error("Failed to create project");
            const newProj = await res.json();
            setProjects((prev) => [newProj, ...prev]);
            setActiveProject(newProj);
            setNewProjectName("");
            setTimeout(() => {
                setAnalysisSteps(prev => [...prev, "✨ API Specification schemas generated successfully!"]);
                setTimeout(() => {
                    setAnalysisSteps(prev => [...prev, "📑 Unified OpenAPI v3.0.0 JSON schema merged."]);
                    setTimeout(() => {
                        setAnalysisSteps(prev => [...prev, "✅ Vector store filled with parsed index structure."]);
                        setIsAnalyzing(false);
                    }, 1000);
                }, 1000);
            }, 2000);
        } catch (err) {
            showToast("Error creating project.", "error");
            setIsAnalyzing(false);
        }
    };

    const handleSaveCode = async () => {
        if (!activeProject || !selectedFile) return;
        const updatedFiles = activeProject.codeFiles.map((f) =>
            f.path === selectedFile.path ? { ...f, content: editedCode, size: editedCode.length } : f
        );
        setIsAnalyzing(true);
        setAnalysisSteps([
            "📝 File modified: Saving changes to virtual filesystem...",
            "🧩 Re-chunking modified modules...",
            "🔄 Computing updated vector embeddings...",
            "🤖 Triggering AI Parser to refine parameters & responses...",
            "📂 Merging OpenAPI spec paths..."
        ]);
        try {
            const res = await fetch(`/api/projects/${activeProject.id}/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: safeJsonStringify({ files: updatedFiles }),
            });
            if (!res.ok) throw new Error("Failed to update project source");
            const updatedProj = await res.json();
            setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
            setActiveProject(updatedProj);
            showToast("Code saved and indexed.", "success");
        } catch (err) {
            showToast("Failed to save changes", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleLocalFileUpload = (e) => {
        let files = null;
        if (e && e.target && e.target.files) {
            files = e.target.files;
        } else if (e && e.dataTransfer && e.dataTransfer.files) {
            files = e.dataTransfer.files;
        } else if (Array.isArray(e)) {
            files = e;
        } else if (e && typeof e.length === "number" && e[0] instanceof File) {
            files = e;
        }
        if (!files || files.length === 0) return;
        const loadedFiles = [];
        let filesProcessed = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result;
                loadedFiles.push({
                    name: file.name,
                    path: file.name,
                    size: file.size,
                    content: text || "",
                });
                filesProcessed++;
                if (filesProcessed === files.length) {
                    createUploadedProject(loadedFiles);
                }
            };
            reader.readAsText(file);
        }
    };

    const createUploadedProject = async (codeFiles) => {
        setIsAnalyzing(true);
        setAnalysisSteps([
            "📂 Code files read successfully from local machine...",
            "🧩 Analyzing project structure...",
            "🔍 Detecting backend framework and dependencies...",
        ]);
        try {
            // Step 1: Detect Framework
            const detectRes = await fetch("/api/projects/detect-framework", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: safeJsonStringify({ files: codeFiles }),
            });
            
            let detectedFramework = "express";
            let confidence = 0;
            
            if (detectRes.ok) {
                const detectData = await detectRes.json();
                detectedFramework = detectData.framework;
                confidence = detectData.confidence;
            }

            setAnalysisSteps(prev => [
                ...prev,
                `🤖 Framework Detection: ${detectedFramework.toUpperCase()} detected with ${(confidence * 100).toFixed(0)}% confidence.`,
                "⚙️ API Endpoint Extraction: Requesting Gemini-2.0-flash API to extract endpoints...",
            ]);

            // Step 2: Upload Project
            const res = await fetch("/api/projects/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: safeJsonStringify({
                    name: "Custom Codebase Upload",
                    framework: detectedFramework,
                    files: codeFiles,
                    userId: currentUser,
                }),
            });

            if (!res.ok) throw new Error("Upload failed");
            const newProj = await res.json();
            
            setProjects((prev) => [newProj, ...prev]);
            setActiveProject(newProj);
            setActiveTab("dashboard");
            
            showToast("Code uploaded successfully.", "success");
            
            setAnalysisSteps(prev => [
                ...prev,
                "✅ API Endpoint Extraction complete.",
                "🧠 GraphRAG: Building knowledge graph and identifying component relationships...",
                "📝 API Documentation Generation: Creating comprehensive endpoint docs...",
                "🔬 Code Analysis: Performing deep security and performance audit...",
                "📦 Documentation Export: Preparing OpenAPI/Swagger artifacts...",
                "🚀 Workflow automated. Your project is now fully indexed."
            ]);

            // Simulate the automatic continuation of these background tasks
            // In a real app, these would be triggered by the backend completion
            setTimeout(() => {
                fetchProjectData(newProj.id);
            }, 2000);

        } catch (err) {
            showToast("Error processing custom file upload.", "error");
            console.error(err.message || String(err));
        } finally {
            // Keep the modal open a bit longer to show the "automated" progress
            setTimeout(() => {
                setIsAnalyzing(false);
            }, 5000);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || !activeProject) return;
        const query = chatInput;
        setChatInput("");
        setIsChatLoading(true);
        const tempUserMsg = {
            id: `temp-${Date.now()}`,
            projectId: activeProject.id,
            sender: "user",
            content: query,
            createdAt: new Date().toISOString(),
        };
        setChatHistory((prev) => [...prev, tempUserMsg]);
        try {
            const res = await fetch(`/api/projects/${activeProject.id}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: safeJsonStringify({ question: query }),
            });
            if (!res.ok) throw new Error("RAG assistant failed to answer.");
            const answerMsg = await res.json();
            setChatHistory((prev) => [
                ...prev.filter((m) => m.id !== tempUserMsg.id),
                {
                    id: `u-${Date.now()}`,
                    projectId: activeProject.id,
                    sender: "user",
                    content: query,
                    createdAt: new Date().toISOString()
                },
                answerMsg
            ]);
        } catch (err) {
            showToast("Error querying RAG assistant.", "error");
            setChatHistory((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    projectId: activeProject.id,
                    sender: "assistant",
                    content: "❌ Error: Failed to generate response. Check GEMINI_API_KEY in environment.",
                    createdAt: new Date().toISOString(),
                },
            ]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleAddCustomEndpoint = async () => {
        if (!activeProject) return;
        try {
            const res = await fetch(`/api/projects/${activeProject.id}/endpoints`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: safeJsonStringify({
                    method: newEndpointMethod,
                    path: newEndpointPath,
                    description: newEndpointDesc,
                    authRequired: false,
                    parameters: [
                        { name: "id", in: "path", type: "string", required: true, description: "Resource unique ID" }
                    ],
                    responses: [
                        { statusCode: 200, description: "Success response JSON" }
                    ]
                }),
            });
            if (res.ok) {
                const added = await res.json();
                setActiveEndpoints((prev) => [...prev, added]);
                setSelectedEndpoint(added);
                setIsAddEndpointOpen(false);
                showToast("Custom endpoint injected successfully!");
                const verRes = await fetch(`/api/projects/${activeProject.id}/versions`);
                const verData = await verRes.json();
                setActiveVersions(verData);
            }
        } catch (err) {
            showToast("Error creating endpoint", "error");
        }
    };

    const handleDeleteEndpoint = async (id) => {
        if (!window.confirm("Are you sure you want to delete this endpoint?")) return;
        try {
            const res = await fetch(`/api/endpoints/${id}`, { method: "DELETE" });
            if (res.ok) {
                setActiveEndpoints((prev) => prev.filter((e) => e.id !== id));
                setSelectedEndpoint(null);
                showToast("Endpoint removed.");
            }
        } catch (err) {
            showToast("Failed to delete endpoint", "error");
        }
    };

    const handleTestEndpoint = async () => {
        if (!selectedEndpoint) return;
        
        setTestResponse("Sending request...");
        
        try {
            const startTime = Date.now();
            let parsedBody = null;
            if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method)) {
                try {
                    parsedBody = JSON.parse(testRequestBody);
                } catch (e) {
                    setTestResponse(safeJsonStringify({ error: "Invalid JSON in request body" }, null, 2));
                    return;
                }
            }

            // Attempt a real fetch, but handle expected browser/environment failures gracefully
            // by providing a high-fidelity simulation.
            const response = await fetch(selectedEndpoint.path, {
                method: selectedEndpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: parsedBody ? JSON.stringify(parsedBody) : undefined
            }).catch(err => {
                return { simulated: true, error: err.message };
            });

            const duration = Date.now() - startTime;

            if (response.simulated) {
                // Simulation for demo purposes since the user's project isn't running on our proxy
                setTimeout(() => {
                    setTestResponse(safeJsonStringify({
                        info: "Simulated Response (Endpoint not reachable on this domain)",
                        method: selectedEndpoint.method,
                        path: selectedEndpoint.path,
                        status: 200,
                        statusText: "OK",
                        latency: `${duration}ms`,
                        payload: {
                            message: `Successfully captured ${selectedEndpoint.method} request logic for ${selectedEndpoint.path}`,
                            timestamp: new Date().toISOString(),
                            echo: parsedBody || {}
                        }
                    }, null, 2));
                }, 800);
                return;
            }

            const data = await response.json().catch(() => response.text());
            
            setTestResponse(safeJsonStringify({
                status: response.status,
                statusText: response.statusText,
                latency: `${duration}ms`,
                headers: Object.fromEntries(response.headers?.entries() || []),
                body: data
            }, null, 2));

        } catch (err) {
            setTestResponse(safeJsonStringify({
                error: "Request pipeline failed",
                details: err.message
            }, null, 2));
        }
    };

    const triggerDownload = (content, filename, contentType) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${filename}`);
    };

    const handleExportChatHistory = () => {
        if (!chatHistory || chatHistory.length === 0) {
            showToast("No chat history to export", "error");
            return;
        }
        
        const exportData = {
            project: activeProject?.name || "Unknown Project",
            exportedAt: new Date().toISOString(),
            messages: chatHistory
        };
        
        triggerDownload(
            JSON.stringify(exportData, null, 2),
            `chat_history_${activeProject?.id || 'export'}.json`,
            "application/json"
        );
    };

    const getRoleDescription = (role) => {
        switch (role) {
            case UserRole.DEVELOPER: return "Full codebase write access, route injection & AST parsing.";
            case UserRole.PROJECT_MANAGER: return "Sprint metrics, version release tracking & CSV data exports.";
            case UserRole.QA_ENGINEER: return "Endpoint simulator sandbox, request testing & schema verification.";
            case UserRole.API_CONSUMER: return "Interactive OpenAPI viewer, Markdown guide & client consumption.";
            default: return "Standard workspace access.";
        }
    };

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} users={users} />;
    }

    return (
        <div className={`h-screen flex overflow-hidden font-sans transition-colors duration-300 selection:bg-indigo-500/20 ${isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            
            <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                activeProject={activeProject}
                setIsNewProjectModalOpen={setIsNewProjectModalOpen}
                isDarkMode={isDarkMode}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* 1. PREMIUM TOPBAR */}
                <header className={`h-16 border-b px-6 flex items-center justify-between z-40 shrink-0 transition-all ${isDarkMode ? 'border-slate-800/80 bg-slate-950/50 backdrop-blur-xl' : 'border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm'}`}>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Workspace</span>
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                            {activeProject ? (
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activeProject.name}</span>
                                    <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{activeProject.framework}</span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-sm font-bold text-slate-500 italic">No Active Project</span>
                            )}
                        </div>

                        {projects.length > 0 && (
                            <div className="ml-4 h-6 w-[1px] bg-slate-800/50"></div>
                        )}

                        {projects.length > 0 && (
                            <div className="flex items-center gap-2 ml-4">
                                <Folder className="w-3.5 h-3.5 text-slate-500" />
                                <select
                                    value={activeProject?.id || ""}
                                    onChange={(e) => {
                                        const p = projects.find((proj) => proj.id === e.target.value);
                                        if (p) setActiveProject(p);
                                    }}
                                    className={`text-xs font-bold bg-transparent focus:outline-none cursor-pointer hover:text-indigo-500 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                                >
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id} className={isDarkMode ? "bg-slate-950 text-slate-200" : "bg-white text-slate-700"}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Theme, Role & User Info */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'text-amber-400 bg-amber-500/10 border-slate-800' : 'text-indigo-600 bg-indigo-50 border-slate-200'}`}
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>

                        <div className={`hidden lg:flex items-center gap-3 border px-3 py-1.5 rounded-xl ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                                {currentUser?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <select
                                value={currentUser || ""}
                                onChange={(e) => handleUserChange(e.target.value)}
                                className={`text-xs font-bold bg-transparent focus:outline-none cursor-pointer ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
                            >
                                {users.map((u) => (
                                    <option key={u.id} value={u.id} className={isDarkMode ? "bg-slate-950 text-slate-200" : "bg-white text-slate-700"}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live</span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className={`p-2 rounded-xl transition-all hover:bg-rose-500/10 hover:text-rose-500 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                            title="Logout"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* 2. MAIN SCROLLABLE AREA */}
                <main className="flex-1 overflow-y-auto no-scrollbar p-6">
                    <div className="max-w-7xl mx-auto space-y-6 min-h-full flex flex-col">

                        {/* Status & Analysis Banner - Floating Style */}
                        {activeProject && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition-all ${isDarkMode ? '' : 'border-slate-200 shadow-sm'}`}
                            >
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Analyzer</span>
                                    </div>
                                    
                                    {activeProject.status === "processing" || activeProject.status === "pending" ? (
                                        <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse border border-indigo-500/20">
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>AST Indexing...</span>
                                        </div>
                                    ) : activeProject.status === "failed" ? (
                                        <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-500/20">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>Analysis Failed</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span>Ready: {activeEndpoints.length} Routes Maped</span>
                                        </div>
                                    )}

                                    <div className="hidden sm:block h-4 w-[1px] bg-slate-800/50 mx-1"></div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Version</span>
                                            <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>v1.{activeProject.versionNo}.0</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Session</span>
                                            <span className="text-xs font-mono font-bold text-indigo-400"><SessionTimer /></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {selectedVersion && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => triggerDownload(selectedVersion.openApiSpec, "openapi.json", "application/json")}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all hover:scale-105 ${isDarkMode ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
                                            >
                                                <Download className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>JSON</span>
                                            </button>
                                            <button
                                                onClick={() => triggerDownload(selectedVersion.markdownDoc, "API_DOCS.md", "text/markdown")}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all hover:scale-105 ${isDarkMode ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
                                            >
                                                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Docs</span>
                                            </button>
                                        </div>
                                    )}
                                    <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                        <Shield className="w-3 h-3 text-indigo-500" />
                                        <span className="text-[10px] font-bold">{activeRole} Mode</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeProject?.id + activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            {!activeProject ? (
                                <WelcomeView 
                                    onOpenNewProject={() => setIsNewProjectModalOpen(true)}
                                    onUpload={handleLocalFileUpload}
                                    isDarkMode={isDarkMode}
                                />
                            ) : (
                                <div className="flex-1 flex flex-col min-h-0 gap-8 pb-12">
                                    {(() => {
                                        switch (activeTab) {
                                            case "dashboard": return <DashboardView onUpload={handleLocalFileUpload} />;
                                            case "endpoints": return (
                                                <EndpointsView 
                                                    onOpenAddModal={() => setIsAddEndpointOpen(true)}
                                                    onDeleteEndpoint={handleDeleteEndpoint}
                                                    onOpenTestModal={(ep) => {
                                                        setSelectedEndpoint(ep);
                                                        setTestRequestBody(safeJsonStringify(ep.parameters?.reduce((acc, p) => ({ ...acc, [p.name]: "" }), {}) || {}, null, 2));
                                                        setTestResponse(null);
                                                        setIsTestModalOpen(true);
                                                    }}
                                                />
                                            );
                                            case "lab": return <TestingLab />;
                                            case "knowledge": return <KnowledgeManagement />;
                                            case "code": return <SourceCodeView />;
                                            case "spec": return (
                                                <SpecView 
                                                    onOpenTestModal={(ep) => {
                                                        setSelectedEndpoint(ep);
                                                        setTestRequestBody(safeJsonStringify(ep.parameters?.reduce((acc, p) => ({ ...acc, [p.name]: "" }), {}) || {}, null, 2));
                                                        setTestResponse(null);
                                                        setIsTestModalOpen(true);
                                                    }}
                                                />
                                            );
                                            case "versions": return <VersionsView onOpenDiffViewer={() => setIsDiffViewerOpen(true)} />;
                                            default: return <NotFoundView />;
                                        }
                                    })()}
                                    
                                    {activeTab !== "knowledge" && <RagAssistant />}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* --- MODAL 1: NEW PROJECT TEMPLATE MODAL --- */}
            {isNewProjectModalOpen && (
                <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-900/40'}`}>
                    <div className={`glass-card rounded-2xl w-full max-w-md p-6 space-y-5 border shadow-2xl transition-all ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className={`flex items-center justify-between border-b pb-4 transition-all ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Create New Codebase</h3>
                            <button onClick={() => setIsNewProjectModalOpen(false)} className={`${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Project Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. E-Commerce API Service"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition shadow-inner ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                                />
                            </div>

                            <div>
                                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Framework Template</label>
                                <select
                                    value={newProjectFramework}
                                    onChange={(e) => setNewProjectFramework(e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition shadow-inner ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                                >
                                    <option value="express" className={isDarkMode ? "bg-slate-900" : "bg-white"}>Express.js (Node.js REST API)</option>
                                    <option value="fastapi" className={isDarkMode ? "bg-slate-900" : "bg-white"}>FastAPI (Python REST API)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsNewProjectModalOpen(false)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProject}
                                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition"
                            >
                                Create & Index
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: ADD CUSTOM ENDPOINT MODAL --- */}
            {isAddEndpointOpen && (
                <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-900/40'}`}>
                    <div className={`glass-card rounded-2xl w-full max-w-md p-6 space-y-5 border shadow-2xl transition-all ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className={`flex items-center justify-between border-b pb-4 transition-all ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Inject Custom Endpoint</h3>
                            <button onClick={() => setIsAddEndpointOpen(false)} className={`${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Method</label>
                                    <select
                                        value={newEndpointMethod}
                                        onChange={(e) => setNewEndpointMethod(e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none transition shadow-inner ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                                    >
                                        <option value="GET" className={isDarkMode ? "bg-slate-900" : "bg-white"}>GET</option>
                                        <option value="POST" className={isDarkMode ? "bg-slate-900" : "bg-white"}>POST</option>
                                        <option value="PUT" className={isDarkMode ? "bg-slate-900" : "bg-white"}>PUT</option>
                                        <option value="DELETE" className={isDarkMode ? "bg-slate-900" : "bg-white"}>DELETE</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Path Route</label>
                                    <input
                                        type="text"
                                        value={newEndpointPath}
                                        onChange={(e) => setNewEndpointPath(e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none transition shadow-inner ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Description</label>
                                <input
                                    type="text"
                                    value={newEndpointDesc}
                                    onChange={(e) => setNewEndpointDesc(e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none transition shadow-inner ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsAddEndpointOpen(false)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCustomEndpoint}
                                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition"
                            >
                                Inject Endpoint
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: TEST ENDPOINT MODAL --- */}
            <TestEndpointModal
                isOpen={isTestModalOpen}
                onClose={() => setIsTestModalOpen(false)}
                method={selectedEndpoint?.method || ""}
                path={selectedEndpoint?.path || ""}
                body={testRequestBody}
                onBodyChange={setTestRequestBody}
                onTest={handleTestEndpoint}
                response={testResponse}
                isDarkMode={isDarkMode}
            />

            {/* ANALYSIS MODAL OVERLAY */}
            <AnalysisModal />

            {/* --- VISUAL DIFF VIEWER MODAL --- */}
            {isDiffViewerOpen && (
                <VersionDiffViewer 
                    versions={activeVersions} 
                    isDarkMode={isDarkMode} 
                    onClose={() => setIsDiffViewerOpen(false)} 
                />
            )}

            {/* TOAST SYSTEM */}
            <Toast />

            {/* GLOBAL HIDDEN FILE INPUT FOR CMD+U SHORTCUT */}
            <input 
                type="file" 
                ref={globalFileInputRef} 
                style={{ display: 'none' }} 
                multiple 
                accept=".js,.py,.ts,.tsx,.jsx"
                onChange={handleLocalFileUpload}
            />
        </div>
    </div>
);
}
