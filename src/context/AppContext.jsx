import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserRole } from '../types';

const AppContext = createContext();

export function AppProvider({ children }) {
    // Authentication & Roles state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeRole, setActiveRole] = useState(UserRole.DEVELOPER);
    const [users, setUsers] = useState([]);
    
    // Project state
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [activeEndpoints, setActiveEndpoints] = useState([]);
    const [activeVersions, setActiveVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState(null);
    
    // UI Navigation Tabs
    const [activeTab, setActiveTab] = useState("dashboard");
    
    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    
    // Session Duration Timer
    const [sessionStartTime] = useState(Date.now());
    const [sessionDuration, setSessionDuration] = useState("0m 0s");

    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem("nexusdocs-theme");
        return saved === null ? true : saved === "dark";
    });

    const [toastMessage, setToastMessage] = useState(null);

    // Refs for active project tracking in intervals
    const activeProjectIdRef = useRef(activeProject?.id);
    const activeProjectStatusRef = useRef(activeProject?.status);

    useEffect(() => {
        activeProjectIdRef.current = activeProject?.id;
        activeProjectStatusRef.current = activeProject?.status;
    }, [activeProject?.id, activeProject?.status]);

    useEffect(() => {
        localStorage.setItem("nexusdocs-theme", isDarkMode ? "dark" : "light");
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [isDarkMode]);

    useEffect(() => {
        const timer = setInterval(() => {
            const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            setSessionDuration(`${mins}m ${secs}s`);
        }, 1000);
        return () => clearInterval(timer);
    }, [sessionStartTime]);

    const showToast = useCallback((text, type = "success") => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    }, []);

    const [projectTemplates, setProjectTemplates] = useState(null);
    const [analysisSteps, setAnalysisSteps] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [graphData, setGraphData] = useState(null);
    const [isBuildingGraph, setIsBuildingGraph] = useState(false);

    const fetchGraphData = useCallback(async (projectId) => {
        if (!projectId) return;
        setIsBuildingGraph(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/graph`);
            if (res.ok) {
                const data = await res.json();
                setGraphData(data);
            }
        } catch (err) {
            console.error("Failed to fetch graph data", err);
        } finally {
            setIsBuildingGraph(false);
        }
    }, []);

    const fetchProjectData = useCallback(async (projectId) => {
        try {
            const projRes = await fetch(`/api/projects/${projectId}`);
            if (projRes.ok) {
                const fullProject = await projRes.json();
                setActiveProject(fullProject);
            }

            const epRes = await fetch(`/api/projects/${projectId}/endpoints`);
            const epData = await epRes.json();
            setActiveEndpoints(epData);

            const verRes = await fetch(`/api/projects/${projectId}/versions`);
            const verData = await verRes.json();
            setActiveVersions(verData);
            if (verData.length > 0) {
                const sorted = [...verData].sort((a, b) => b.versionNo - a.versionNo);
                setSelectedVersion(sorted[0]);
            }

            const chatRes = await fetch(`/api/projects/${projectId}/chat`);
            const chatData = await chatRes.json();
            setChatHistory(chatData);

            // Fetch Graph Data for GraphRAG
            fetchGraphData(projectId);
        } catch (err) {
            console.error("Failed to load project details", err.message || String(err));
        }
    }, [fetchGraphData]);

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            setProjects(data);
            if (data.length > 0 && !activeProjectIdRef.current) {
                setActiveProject(data[0]);
                fetchProjectData(data[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch projects", err.message || String(err));
        }
    }, [fetchProjectData]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/users");
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users", err.message || String(err));
        }
    }, []);

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await fetch("/api/projects/templates");
            const data = await res.json();
            setProjectTemplates(data);
        } catch (err) {
            console.error("Failed to fetch templates", err.message || String(err));
        }
    }, []);

    const syncFromGithub = useCallback(async (repoUrl, token) => {
        setIsAnalyzing(true);
        setAnalysisSteps(["Connecting to GitHub API...", "Fetching repository contents...", "Parsing source code files...", "Detecting framework structure...", "Initializing Gemini RAG analysis..."]);
        
        try {
            const response = await fetch("/api/projects/github-sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoUrl, token, userId: currentUser }),
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "GitHub sync failed");
            }
            
            const newProject = await response.json();
            setProjects(prev => [...prev, newProject]);
            setActiveProject(newProject);
            setActiveTab("dashboard");
            return newProject;
        } catch (error) {
            console.error("GitHub Sync error:", error);
            throw error;
        } finally {
            setIsAnalyzing(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchUsers();
        fetchProjects();
        fetchTemplates();
    }, [fetchUsers, fetchProjects, fetchTemplates]);

    // Polling for processing projects
    useEffect(() => {
        const isAnyProcessing = projects.some((p) => p.status === "processing" || p.status === "pending");
        const interval = setInterval(async () => {
            if (isAnyProcessing) {
                const res = await fetch("/api/projects");
                const data = await res.json();
                setProjects(data);
                
                if (activeProjectIdRef.current) {
                    const updatedActive = data.find((p) => p.id === activeProjectIdRef.current);
                    if (updatedActive && activeProjectStatusRef.current !== updatedActive.status) {
                        setActiveProject(updatedActive);
                        fetchProjectData(updatedActive.id);
                        if (updatedActive.status === "completed") {
                            showToast(`Analysis for "${updatedActive.name}" completed!`);
                        } else if (updatedActive.status === "failed") {
                            showToast(`Analysis failed: ${updatedActive.error}`, "error");
                        }
                    }
                }
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [projects, fetchProjectData, showToast]);

    const handleLogin = useCallback((userId) => {
        const user = users.find((u) => u.id === userId);
        if (user) {
            setActiveRole(user.role);
            setIsLoggedIn(true);
            setCurrentUser(userId);
        }
    }, [users]);

    const handleLogout = useCallback(() => {
        setIsLoggedIn(false);
        setCurrentUser(null);
    }, []);

    const value = {
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
        fetchGraphData,
        syncFromGithub,
        projectTemplates, setProjectTemplates,
        analysisSteps, setAnalysisSteps,
        isAnalyzing, setIsAnalyzing,
        graphData, setGraphData,
        isBuildingGraph, setIsBuildingGraph,
        handleLogin, handleLogout,
        downloadPDF: (projectId, versionNo) => {
            if (!projectId) return;
            const url = `/api/projects/${projectId}/export/pdf${versionNo ? `?v=${versionNo}` : ''}`;
            window.open(url, '_blank');
        }
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
