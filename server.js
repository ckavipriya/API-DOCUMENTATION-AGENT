import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import PDFDocument from "pdfkit";
import dotenv from "dotenv";
import axios from "axios";
import { chunkCode, detectFramework, cosineSimilarity, TEMPLATE_PROJECTS } from "./src/backendUtils.js";
import { UserRole } from "./src/types.js";
// Load environment variables
dotenv.config();
const PORT = 3000;
const serverStartTime = Date.now();
const DB_FILE = path.join(process.cwd(), "data", "db.json");
// Ensure the data directory exists
if (!fs.existsSync(path.dirname(DB_FILE))) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}
// In-Memory fallback if files fail
let dbState = {
    users: [
        { id: "u-1", name: "ckavipriya", email: "ckavipriya2006@gmail.com", role: UserRole.DEVELOPER, createdAt: new Date().toISOString() },
        { id: "u-2", name: "Jane Tester", email: "jane@test.com", role: UserRole.QA_ENGINEER, createdAt: new Date().toISOString() },
        { id: "u-3", name: "Bob Product", email: "bob@pm.com", role: UserRole.PROJECT_MANAGER, createdAt: new Date().toISOString() },
        { id: "u-4", name: "Alice Consumer", email: "alice@external.com", role: UserRole.API_CONSUMER, createdAt: new Date().toISOString() },
    ],
    projects: [],
    endpoints: [],
    chunks: [],
    graphs: {}, // Store pre-computed knowledge graphs for projects
    chatHistories: {},
    versions: [],
};
// Load database state from file if exists
function loadDb() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, "utf-8");
            const loadedData = JSON.parse(data);
            dbState = { ...dbState, ...loadedData };
            // Ensure critical sub-objects exist even if they were missing in the loaded JSON
            if (!dbState.graphs) dbState.graphs = {};
            if (!dbState.chatHistories) dbState.chatHistories = {};
        }
        else {
            saveDb();
        }
    }
    catch (error) {
        console.error("Error loading database:", error.message || String(error));
    }
}
// Save database state to file
function saveDb() {
    try {
        const safeData = safeJsonStringify(dbState, 2);
        fs.writeFileSync(DB_FILE, safeData, "utf-8");
    }
    catch (error) {
        console.error("Error saving database:", error.message || String(error));
    }
}

// Safe JSON stringify to handle potential circular refs in DB state
function safeJsonStringify(obj, space) {
    if (obj === null || obj === undefined) return String(obj);
    
    const isRestricted = (v, k) => {
        if (!v || typeof v !== 'object') return false;
        try {
            // Check for React/DOM markers (defensive)
            if (v.$$typeof || v._owner || ('nodeType' in v) || ('nodeName' in v)) return true;
            
            // Check keys for internal markers
            if (k && typeof k === 'string') {
                const kl = k.toLowerCase();
                if (kl.includes('react') || kl.includes('fiber') || kl.includes('framer') || kl.startsWith('__') || kl.startsWith('_')) {
                    if (typeof v === 'object') return true;
                }
            }
            
            // Node.js specific circulars
            if (v.socket || v.connection || v.client || v.stream || v.readable || v.writable) return true;
            
            // Constructor checks
            const c = v.constructor;
            if (c) {
                const n = c.name;
                if (typeof n === 'string') {
                    if (['IncomingMessage', 'ServerResponse', 'Socket', 'Domain', 'EventEmitter', 'Window', 'HTMLElement', 'FiberNode', 'FileList', 'File', 'Blob'].includes(n)) return true;
                    if (n.includes('Fiber')) return true;
                }
            }
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
                    if (isRestricted(value, key)) return `[Restricted: ${value.constructor?.name || 'Object'}]`;
                    if (seen.has(value)) return "[Circular]";
                    seen.add(value);
                }
                return value;
            } catch (e) {
                return "[Error during serialization]";
            }
        }, space);
    } catch (err) {
        console.error("server safeJsonStringify error:", err.message || String(err));
        return `[Serialization Error: ${String(err)}]`;
    }
}
// Load DB initially
loadDb();
// Retry wrapper for Gemini API calls with exponential backoff
async function callGeminiWithRetry(fn, maxRetries = 5, delayMs = 5000) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const status = err && (err.status || (err.response && err.response.status));
            const isRateLimitOrUnavailable = status === 429 || status === 503 || 
                (err.message && (err.message.includes("429") || err.message.includes("503") || err.message.includes("quota") || err.message.includes("unavailable") || err.message.includes("overloaded")));
            
            if (isRateLimitOrUnavailable && attempt < maxRetries) {
                // Exponential backoff with jitter
                const waitTime = (delayMs * Math.pow(2, attempt)) + (Math.random() * 1000);
                console.warn(`Gemini API rate limit or unavailability encountered (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(waitTime)}ms...`, err.message);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                throw err;
            }
        }
    }
}

// Fallback regex / JSDoc endpoint extractor if LLM quota is exhausted
function extractEndpointsFallback(codeFiles) {
    const endpoints = [];
    codeFiles.forEach(file => {
        const lines = file.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const routeMatch = line.match(/@route\s+(GET|POST|PUT|DELETE|PATCH)\s+(.+)/i) || line.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/i);
            if (routeMatch) {
                const method = routeMatch[1].toUpperCase();
                const path = routeMatch[2].trim();
                let description = "API endpoint extracted from source.";
                let authRequired = false;
                
                for (let j = Math.max(0, i - 6); j < Math.min(lines.length, i + 6); j++) {
                    if (lines[j].includes("@desc")) {
                        description = lines[j].replace(/.*\/\/\s*@desc|.*\*\s*@desc/, "").trim();
                    }
                    if (lines[j].includes("@access") && lines[j].toLowerCase().includes("private")) {
                        authRequired = true;
                    }
                }

                endpoints.push({
                    method: ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method) ? method : "GET",
                    path: path.startsWith("/") ? path : `/${path}`,
                    description,
                    authRequired,
                    requestBodySchema: "",
                    parameters: [],
                    responses: [{ statusCode: 200, description: "Successful response" }],
                    fileOrigin: file.path,
                    lineStart: i + 1,
                    lineEnd: i + 10
                });
            }
        }
    });
    return endpoints;
}

// Initialize Gemini SDK
let ai = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
            headers: {
                "User-Agent": "aistudio-build",
            },
        },
    });
}
else {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI operations will be mock-simulated.");
}
const app = express();
let globalRequestCount = 0;

// Middleware to count requests
app.use((req, res, next) => {
    globalRequestCount++;
    next();
});

// Middleware to make res.json safe against circular structures
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
app.use(express.json({ limit: "50mb" }));
// Helper to check if AI is available
function getAiClient() {
    if (!ai) {
        throw new Error("Gemini API Client is not configured. Please add GEMINI_API_KEY in Settings > Secrets.");
    }
    return ai;
}
// --- API ROUTES ---
// 1. Authentication Simulators
// Health Endpoint
app.get("/api/health", (req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
    res.json({
        status: "ok",
        uptime: uptimeSeconds,
        requests: globalRequestCount,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        metrics: {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        }
    });
});

app.get("/api/metrics/historical", (req, res) => {
    const days = 30;
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toISOString().split('T')[0],
            latency: Math.floor(Math.random() * 50 + 20), // 20ms - 70ms
            successRate: 95 + Math.random() * 5, // 95% - 100%
            requests: Math.floor(Math.random() * 1000 + 500)
        });
    }
    res.json(data);
});

// Knowledge Management Endpoints
app.get("/api/projects/:id/knowledge", (req, res) => {
    const { id } = req.params;
    const project = dbState.projects.find(p => p.id === id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Group chunks by file to show indexed documents
    const projectChunks = dbState.chunks.filter(c => c.projectId === id);
    const files = project.codeFiles.map(file => {
        const fileChunks = projectChunks.filter(c => c.filePath === file.path);
        return {
            name: file.name,
            path: file.path,
            chunkCount: fileChunks.length,
            isIndexed: fileChunks.length > 0,
            lastIndexed: fileChunks.length > 0 ? project.updatedAt || project.createdAt : null
        };
    });

    res.json(files);
});

// GraphRAG: Knowledge Graph Endpoint
app.get("/api/projects/:id/graph", (req, res) => {
    const { id } = req.params;
    const project = dbState.projects.find(p => p.id === id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Return pre-computed graph if it exists
    if (dbState.graphs[id]) {
        return res.json(dbState.graphs[id]);
    }

    const endpoints = dbState.endpoints.filter(e => e.projectId === id);
    const graph = constructFallbackGraph(project, endpoints);
    res.json(graph);
});

// Hybrid Search Endpoint
app.post("/api/projects/:id/search", async (req, res) => {
    const projectId = req.params.id;
    const { query, mode = "hybrid" } = req.body;
    
    if (!query) return res.status(400).json({ error: "Query is required" });

    const project = dbState.projects.find(p => p.id === projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    try {
        const aiClient = getAiClient();
        const projectChunks = dbState.chunks.filter(c => c.projectId === projectId);
        const results = [];

        // 1. Keyword Search
        if (mode === "keyword" || mode === "hybrid") {
            const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            projectChunks.forEach(chunk => {
                const contentLower = chunk.content.toLowerCase();
                let keywordScore = 0;
                queryWords.forEach(word => {
                    if (contentLower.includes(word)) keywordScore += 1;
                });

                if (keywordScore > 0) {
                    results.push({
                        source: chunk.filePath,
                        target: "",
                        type: "keyword_match",
                        matchType: "keyword",
                        insight: chunk.content.substring(0, 200) + "...",
                        score: keywordScore / (queryWords.length || 1)
                    });
                }
            });
        }

        // 2. Semantic Search (Vector RAG)
        if (mode === "semantic" || mode === "hybrid") {
            let queryEmbedding = null;
            try {
                const embedRes = await aiClient.models.embedContent({
                    model: "gemini-embedding-2-preview",
                    contents: query,
                });
                queryEmbedding = embedRes.embedding?.values || embedRes.embeddings?.[0]?.values;
            } catch (err) {
                console.error("Semantic embedding failed", err);
            }

            if (queryEmbedding) {
                const semanticMatches = projectChunks
                    .map(chunk => ({
                        chunk,
                        score: chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0
                    }))
                    .filter(m => m.score > 0.5)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5);

                semanticMatches.forEach(m => {
                    results.push({
                        source: m.chunk.filePath,
                        target: "Semantic Match",
                        type: "contextual",
                        matchType: "semantic",
                        insight: m.chunk.content.substring(0, 200) + "...",
                        score: m.score
                    });
                });
            }
        }

        // Deduplicate and sort
        const finalResults = results
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        res.json(finalResults);
    } catch (err) {
        console.error("Hybrid search error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});

app.delete("/api/projects/:id/knowledge", (req, res) => {
    const { id } = req.params;
    const { filePath } = req.body;

    if (!filePath) return res.status(400).json({ error: "filePath is required" });

    const beforeCount = dbState.chunks.length;
    dbState.chunks = dbState.chunks.filter(c => !(c.projectId === id && c.filePath === filePath));
    const afterCount = dbState.chunks.length;

    saveDb();
    res.json({ 
        success: true, 
        message: `Deleted ${beforeCount - afterCount} chunks for ${filePath}`,
        deletedCount: beforeCount - afterCount
    });
});

app.post("/api/projects/:id/knowledge/refresh", async (req, res) => {
    const { id } = req.params;
    const { filePath } = req.body;

    if (!filePath) return res.status(400).json({ error: "filePath is required" });

    const project = dbState.projects.find(p => p.id === id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const file = project.codeFiles.find(f => f.path === filePath);
    if (!file) return res.status(404).json({ error: "File not found in project" });

    try {
        const aiClient = getAiClient();
        
        // 1. Remove existing chunks for this file
        dbState.chunks = dbState.chunks.filter(c => !(c.projectId === id && c.filePath === filePath));

        // 2. Re-chunk and re-embed
        const fileChunks = chunkCode(file, id);
        const newChunks = [];

        for (const chunk of fileChunks) {
            try {
                const embedRes = await callGeminiWithRetry(async () => {
                    return await aiClient.models.embedContent({
                        model: "gemini-embedding-2-preview",
                        contents: chunk.content,
                    });
                }, 1, 1000);
                chunk.embedding = embedRes.embedding?.values || embedRes.embeddings?.[0]?.values;
            } catch (err) {
                console.warn(`Skipping embedding for chunk of ${file.name} during refresh:`, err.message);
            }
            newChunks.push(chunk);
        }

        dbState.chunks.push(...newChunks);
        saveDb();

        res.json({ 
            success: true, 
            message: `Refreshed ${newChunks.length} chunks for ${filePath}`,
            chunkCount: newChunks.length
        });
    } catch (error) {
        console.error("Error refreshing knowledge:", error);
        res.status(500).json({ error: "Failed to refresh knowledge index for file" });
    }
});

app.get("/api/auth/users", (req, res) => {

    res.json(dbState.users);
});
app.post("/api/auth/register", (req, res) => {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
        return res.status(400).json({ error: "Name, email, and role are required." });
    }
    const existing = dbState.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        return res.status(400).json({ error: "User with this email already exists." });
    }
    const newUser = {
        id: `u-${Date.now()}`,
        name,
        email,
        role: role,
        createdAt: new Date().toISOString(),
    };
    dbState.users.push(newUser);
    saveDb();
    res.status(201).json(newUser);
});
// 2. Project Templates
app.get("/api/projects/templates", (req, res) => {
    res.json(TEMPLATE_PROJECTS);
});
// 2.5 Framework Detection
app.post("/api/projects/detect-framework", (req, res) => {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "Files are required for detection." });
    }
    try {
        const result = detectFramework(files);
        res.json(result);
    }
    catch (error) {
        console.error("Error detecting framework:", error.message || String(error));
        res.status(500).json({ error: "Framework detection failed." });
    }
});
// --- GITHUB SYNC HELPERS ---
async function fetchGithubRepo(repoUrl, token, maxFiles = 150) {
    // Parse URL: https://github.com/owner/repo
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error("Invalid GitHub repository URL. Expected format: https://github.com/owner/repo");

    const owner = match[1];
    let repo = match[2].replace(/\.git$/, "");
    
    // Handle subpaths if present in URL (not standard for API, but helpful)
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const headers = { "Accept": "application/vnd.github.v3+json" };
    if (token) headers["Authorization"] = `token ${token}`;

    const files = [];
    let fileCount = 0;

    async function traverse(path = "") {
        if (fileCount >= maxFiles) return;

        const url = path ? `${apiBase}/${path}` : apiBase;
        const res = await axios.get(url, { headers });
        const items = Array.isArray(res.data) ? res.data : [res.data];

        for (const item of items) {
            if (fileCount >= maxFiles) break;

            if (item.type === "dir") {
                // Skip common non-code dirs
                if (["node_modules", ".git", "dist", "build", "vendor", "tests", "test", "__tests__"].includes(item.name)) continue;
                await traverse(item.path);
            } else if (item.type === "file") {
                // Check extension
                const ext = item.name.split(".").pop().toLowerCase();
                const validExts = ["js", "jsx", "ts", "tsx", "py", "java", "go", "php", "rb", "rs"];
                if (!validExts.includes(ext)) continue;

                // Skip very large files
                if (item.size > 200000) continue; 

                // Fetch content
                const contentRes = await axios.get(item.download_url);
                files.push({
                    name: item.name,
                    path: item.path,
                    content: typeof contentRes.data === 'string' ? contentRes.data : JSON.stringify(contentRes.data)
                });
                fileCount++;
            }
        }
    }

    await traverse();
    return { owner, repo, files };
}

// 3. Project Management
app.post("/api/projects/github-sync", async (req, res) => {
    const { repoUrl, token, userId } = req.body;
    
    if (!repoUrl) {
        return res.status(400).json({ error: "GitHub repository URL is required." });
    }

    try {
        console.log(`Syncing from GitHub: ${repoUrl}`);
        const { owner, repo, files } = await fetchGithubRepo(repoUrl, token);

        if (files.length === 0) {
            return res.status(400).json({ error: "No valid code files found in the repository." });
        }

        // Detect framework
        const frameworkRes = detectFramework(files);
        
        const projectId = `p-${Date.now()}`;
        const newProject = {
            id: projectId,
            userId: userId || "u-1",
            name: repo,
            framework: frameworkRes.framework,
            status: "pending",
            codeFiles: files,
            versionNo: 1,
            createdAt: new Date().toISOString(),
            githubUrl: repoUrl
        };

        dbState.projects.push(newProject);
        saveDb();

        // Process in background
        processProjectAnalysis(projectId).catch(err => {
            console.error(`Error processing GitHub project ${projectId}:`, err);
        });

        res.status(201).json(newProject);
    } catch (error) {
        console.error("GitHub Sync Error:", error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || "Failed to sync from GitHub.";
        res.status(status).json({ error: message });
    }
});

app.get("/api/projects", (req, res) => {
    // Return projects without the heavy codeFiles for the list view, but include count
    const projectSummaries = dbState.projects.map(({ codeFiles, ...rest }) => ({
        ...rest,
        codeFilesCount: codeFiles ? codeFiles.length : 0
    }));
    res.json(projectSummaries);
});
app.get("/api/projects/:id", (req, res) => {
    const project = dbState.projects.find((p) => p.id === req.params.id);
    if (!project)
        return res.status(404).json({ error: "Project not found." });
    res.json(project);
});
app.delete("/api/projects/:id", (req, res) => {
    const { id } = req.params;
    dbState.projects = dbState.projects.filter((p) => p.id !== id);
    dbState.endpoints = dbState.endpoints.filter((e) => e.projectId !== id);
    dbState.chunks = dbState.chunks.filter((c) => c.projectId !== id);
    dbState.versions = dbState.versions.filter((v) => v.projectId !== id);
    delete dbState.chatHistories[id];
    saveDb();
    res.json({ message: "Project deleted successfully" });
});
// Create/Upload Project
app.post("/api/projects/upload", async (req, res) => {
    const { name, framework, files, userId } = req.body;
    if (!name || !framework || !files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "Project name, framework, and code files are required." });
    }
    const projectId = `p-${Date.now()}`;
    const newProject = {
        id: projectId,
        userId: userId || "u-1",
        name,
        framework,
        status: "pending",
        codeFiles: files,
        versionNo: 1,
        createdAt: new Date().toISOString(),
    };
    dbState.projects.push(newProject);
    saveDb();
    // Async process the documentation generation in background
    processProjectAnalysis(projectId).catch((err) => {
        console.error(`Error processing project ${projectId}:`, err.message || String(err));
    });
    res.status(201).json(newProject);
});
// Trigger a new version / update of codefiles
app.post("/api/projects/:id/update", async (req, res) => {
    const { id } = req.params;
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "Updated files are required." });
    }
    const projectIndex = dbState.projects.findIndex((p) => p.id === id);
    if (projectIndex === -1)
        return res.status(404).json({ error: "Project not found." });
    const project = dbState.projects[projectIndex];
    project.codeFiles = files;
    project.versionNo += 1;
    project.status = "pending";
    saveDb();
    // Background process update
    processProjectAnalysis(id).catch((err) => {
        console.error(`Error updating project ${id}:`, err.message || String(err));
    });
    res.json(project);
});
// Get endpoints for a project
app.get("/api/projects/:id/endpoints", (req, res) => {
    const endpoints = dbState.endpoints.filter((e) => e.projectId === req.params.id);
    res.json(endpoints);
});
// Get documentation versions for a project
app.get("/api/projects/:id/versions", (req, res) => {
    const versions = dbState.versions.filter((v) => v.projectId === req.params.id);
    res.json(versions);
});

// PDF Export Endpoint
app.get("/api/projects/:id/export/pdf", async (req, res) => {
    const { id } = req.params;
    const { v } = req.query;
    const project = dbState.projects.find(p => p.id === id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const endpoints = dbState.endpoints.filter(e => e.projectId === id);
    let version;
    if (v) {
        version = dbState.versions.find(ver => ver.projectId === id && ver.versionNo == v);
    } else {
        version = dbState.versions.filter(ver => ver.projectId === id).sort((a, b) => b.versionNo - a.versionNo)[0];
    }

    const versionToDisplay = v || (version ? version.versionNo : project.versionNo);

    try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${project.name.replace(/\s+/g, '_')}_v${versionToDisplay}_Docs.pdf`);

        doc.pipe(res);

        // Header Style
        const primaryColor = '#4F46E5';
        const secondaryColor = '#64748B';

        // Title Page
        doc.fontSize(32).font('Helvetica-Bold').fillColor(primaryColor).text('API Documentation', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(24).font('Helvetica').fillColor('black').text(project.name, { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(12).fillColor(secondaryColor).text(`Version ${versionToDisplay}`, { align: 'center' });
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        
        doc.moveDown(4);
        doc.strokeColor(primaryColor).lineWidth(2).moveTo(100, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(4);

        doc.fontSize(14).font('Helvetica-Bold').fillColor('black').text('System Overview');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(`This document contains the automatically generated technical specification for the ${project.name} backend service. The documentation was extracted using structural AST parsing and Gemini RAG intelligence.`);
        doc.moveDown();
        doc.text(`Framework: ${project.framework}`);
        doc.text(`Total Endpoints Identified: ${endpoints.length}`);

        // Endpoints Catalog
        doc.addPage();
        doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text('Endpoint Catalog');
        doc.moveDown(1);

        endpoints.forEach((ep, index) => {
            // Check for page overflow
            if (doc.y > 680) doc.addPage();

            // Method Badge background
            const methodColors = {
                'GET': '#0EA5E9',
                'POST': '#10B981',
                'PUT': '#F59E0B',
                'DELETE': '#EF4444',
                'PATCH': '#8B5CF6'
            };
            const mColor = methodColors[ep.method] || '#64748B';

            doc.fontSize(14).font('Helvetica-Bold').fillColor(mColor).text(`${ep.method}`, { continued: true });
            doc.fillColor('black').text(`  ${ep.path}`);
            
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica').fillColor(secondaryColor).text(ep.description);
            
            if (ep.authRequired) {
                doc.moveDown(0.2);
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#BE123C').text('SECURE: REQUIRES AUTHORIZATION');
            }

            doc.moveDown(0.8);
            
            // Parameters
            if (ep.parameters && ep.parameters.length > 0) {
                doc.fontSize(10).font('Helvetica-Bold').fillColor('black').text('Request Parameters:');
                ep.parameters.forEach(p => {
                    doc.fontSize(9).font('Helvetica').fillColor('#334155')
                       .text(`• ${p.name} (${p.in}): ${p.description}`, { indent: 15 });
                    doc.fontSize(8).fillColor(secondaryColor)
                       .text(`Type: ${p.type} | ${p.required ? 'Required' : 'Optional'}`, { indent: 25 });
                });
                doc.moveDown(0.5);
            }

            // Responses
            if (ep.responses && ep.responses.length > 0) {
                doc.fontSize(10).font('Helvetica-Bold').fillColor('black').text('Expected Responses:');
                ep.responses.forEach(r => {
                    doc.fontSize(9).font('Helvetica').fillColor('#334155')
                       .text(`• ${r.statusCode}: ${r.description}`, { indent: 15 });
                });
                doc.moveDown(0.5);
            }

            doc.moveDown(1);
            doc.strokeColor('#F1F5F9').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(1);
        });

        // OpenAPI Spec Appendix
        if (version && version.openApiSpec) {
            doc.addPage();
            doc.fontSize(18).font('Helvetica-Bold').fillColor(primaryColor).text('Appendix: OpenAPI v3.0 Specification');
            doc.moveDown(1);
            
            doc.fontSize(7).font('Courier').fillColor('#1E293B').text(version.openApiSpec, {
                width: 500,
                align: 'left',
                lineGap: 1
            });
        }

        doc.end();
    } catch (err) {
        console.error("PDF Generation Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate PDF document" });
        }
    }
});
// Update/Edit an endpoint directly
app.put("/api/endpoints/:id", (req, res) => {
    const { id } = req.params;
    const updatedEndpoint = req.body;
    const idx = dbState.endpoints.findIndex((e) => e.id === id);
    if (idx === -1)
        return res.status(404).json({ error: "Endpoint not found." });
    dbState.endpoints[idx] = { ...dbState.endpoints[idx], ...updatedEndpoint };
    saveDb();
    // Also update the OpenAPI Spec on the active version
    updateOpenApiSpec(dbState.endpoints[idx].projectId);
    res.json(dbState.endpoints[idx]);
});
// Create custom endpoint manually
app.post("/api/projects/:id/endpoints", (req, res) => {
    const projectId = req.params.id;
    const endpointData = req.body;
    const newEndpoint = {
        id: `e-${Date.now()}`,
        projectId,
        method: endpointData.method || "GET",
        path: endpointData.path || "/api/custom",
        description: endpointData.description || "Custom endpoint description",
        authRequired: !!endpointData.authRequired,
        requestBodySchema: endpointData.requestBodySchema || "",
        parameters: endpointData.parameters || [],
        responses: endpointData.responses || [{ statusCode: 200, description: "Success" }],
        fileOrigin: "Manual Entry",
        lineStart: 0,
        lineEnd: 0,
    };
    dbState.endpoints.push(newEndpoint);
    saveDb();
    updateOpenApiSpec(projectId);
    res.status(201).json(newEndpoint);
});
// Delete an endpoint
app.delete("/api/endpoints/:id", (req, res) => {
    const { id } = req.params;
    const endpoint = dbState.endpoints.find((e) => e.id === id);
    if (!endpoint)
        return res.status(404).json({ error: "Endpoint not found." });
    const projectId = endpoint.projectId;
    dbState.endpoints = dbState.endpoints.filter((e) => e.id !== id);
    saveDb();
    updateOpenApiSpec(projectId);
    res.json({ message: "Endpoint deleted" });
});
// Get Chat history
app.get("/api/projects/:id/chat", (req, res) => {
    const history = dbState.chatHistories[req.params.id] || [];
    res.json(history);
});
// Delete Chat history
app.delete("/api/projects/:id/chat", (req, res) => {
    dbState.chatHistories[req.params.id] = [];
    saveDb();
    res.json({ message: "Chat history cleared" });
});
// Ask the RAG chatbot
app.post("/api/projects/:id/chat", async (req, res) => {
    const projectId = req.params.id;
    const { question } = req.body;
    if (!question) {
        return res.status(400).json({ error: "Question is required." });
    }
    const project = dbState.projects.find((p) => p.id === projectId);
    if (!project)
        return res.status(404).json({ error: "Project not found." });
    try {
        const aiClient = getAiClient();
        const docChunks = (dbState.docChunks || []).filter((c) => c.projectId === projectId);
        const projectChunks = docChunks.length > 0 ? docChunks : dbState.chunks.filter((c) => c.projectId === projectId);
        let topChunks = [];
        if (projectChunks.length > 0) {
            // 1. Generate embedding for query
            let queryEmbedding = null;
            try {
                const embedResponse = await aiClient.models.embedContent({
                    model: "gemini-embedding-2-preview",
                    contents: question,
                });
                queryEmbedding = embedResponse.embedding?.values || embedResponse.embeddings?.[0]?.values || null;
            }
            catch (err) {
                console.error("Embedding generation failed, falling back to substring keyword search:", err.message || String(err));
            }
            if (queryEmbedding) {
                // Compute similarity to all chunks
                const matches = projectChunks.map((chunk) => {
                    const similarity = chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0;
                    return { chunk, similarity };
                });
                // Sort descending by similarity
                matches.sort((a, b) => b.similarity - a.similarity);
                topChunks = matches.slice(0, 3);
            }
            else {
                // Keyword fallback matching
                const words = question.toLowerCase().split(/\s+/);
                const matches = projectChunks.map((chunk) => {
                    let score = 0;
                    const contentLower = chunk.content.toLowerCase();
                    words.forEach((word) => {
                        if (word.length > 2 && contentLower.includes(word))
                            score += 1;
                    });
                    return { chunk, similarity: score > 0 ? 0.3 + (score / 10) : 0 };
                });
                matches.sort((a, b) => b.similarity - a.similarity);
                topChunks = matches.slice(0, 3).filter(m => m.similarity > 0);
            }
        }

        // 1.5. GraphRAG: Retrieve graph context
        let graphContext = "";
        const projectGraph = dbState.graphs[projectId];
        if (projectGraph) {
            // Find nodes mentioned in the question or relevant to retrieved chunks
            const relevantNodes = projectGraph.nodes.filter(node => 
                question.toLowerCase().includes(node.name.toLowerCase()) ||
                topChunks.some(m => m.chunk.content.toLowerCase().includes(node.name.toLowerCase()))
            );

            if (relevantNodes.length > 0) {
                graphContext = "\nKnowledge Graph Relationships:\n";
                relevantNodes.forEach(node => {
                    const connections = projectGraph.links.filter(l => l.source === node.id || l.target === node.id);
                    connections.forEach(link => {
                        const otherId = link.source === node.id ? link.target : link.source;
                        const otherNode = projectGraph.nodes.find(n => n.id === otherId);
                        if (otherNode) {
                            graphContext += `- ${node.name} (${node.type}) ${link.type} ${otherNode.name} (${otherNode.type})\n`;
                        }
                    });
                });
            }
        }

        // 2. Prepare LLM prompt with retrieved chunks context and graph context
        const contextContent = topChunks.length > 0
            ? topChunks.map((match, i) => `[Chunk #${i + 1} from ${match.chunk.filePath} Lines ${match.chunk.lineStart}-${match.chunk.lineEnd}, Similarity: ${(match.similarity * 100).toFixed(1)}%]\n${match.chunk.content}`).join("\n\n")
            : "No matching documentation chunks found.";

        const systemInstruction = `You are an AI API Documentation Agent powered by GraphRAG. 
        You answer technical questions about an API using documentation chunks and knowledge graph relationships extracted from the codebase.
    
    Format your response in beautiful, clear Markdown.
    Quote relevant paths, endpoints, and status codes in your answer.
    Use the graph relationships to explain how different parts of the system interact (e.g., which controllers use which services).
    Be precise, accurate, and direct. Ground your response strictly in the provided context.`;

        const contents = `Context of retrieved documentation chunks:
    ${contextContent}
    
    ${graphContext}
    
    User Question: ${question}
    
    Please provide an accurate answer based on the provided documentation and architectural relationships.`;
        let answer = "";
        try {
            const chatResponse = await callGeminiWithRetry(async () => {
                return await aiClient.models.generateContent({
                    model: "gemini-3.6-flash",
                    contents,
                    config: {
                        systemInstruction,
                        temperature: 0.2,
                    },
                });
            });
            answer = chatResponse.text || "I was unable to analyze the codebase for this question.";
        } catch (llmErr) {
            console.warn("Gemini chat LLM failed due to quota/rate limit, falling back to context chunk summary:", llmErr.message);
            if (topChunks.length > 0) {
                answer = `*(Note: Gemini API rate limit or quota reached. Showing direct matching code/documentation context)*\n\n` +
                    topChunks.map(m => `**File:** \`${m.chunk.filePath}\` (Lines ${m.chunk.lineStart}-${m.chunk.lineEnd})\n\`\`\`javascript\n${m.chunk.content}\n\`\`\``).join("\n\n");
            } else {
                answer = `I'm currently experiencing rate limits or quota exhaustion with the Gemini API. Please try again shortly, or inspect your project endpoints directly in the Endpoint Catalog.`;
            }
        }
        const message = {
            id: `msg-${Date.now()}`,
            projectId,
            sender: "assistant",
            content: answer,
            retrievedChunks: topChunks.map((match) => ({
                filePath: match.chunk.filePath,
                content: match.chunk.content,
                lineStart: match.chunk.lineStart,
                lineEnd: match.chunk.lineEnd,
                similarity: match.similarity,
            })),
            createdAt: new Date().toISOString(),
        };
        if (!dbState.chatHistories[projectId]) {
            dbState.chatHistories[projectId] = [];
        }
        // Save user message and assistant response
        const userMsg = {
            id: `msg-u-${Date.now()}`,
            projectId,
            sender: "user",
            content: question,
            createdAt: new Date().toISOString(),
        };
        dbState.chatHistories[projectId].push(userMsg);
        dbState.chatHistories[projectId].push(message);
        saveDb();
        res.json(message);
    }
    catch (error) {
        console.error("Error in chat assistant:", error.message || String(error));
        res.status(500).json({ error: error.message || "Failed to generate chat answer." });
    }
});
// --- HELPER BACKGROUND PROCESSING LOGIC ---
/**
 * Split project files into chunks, compute vector embeddings using Gemini,
 * and invoke LLM to extract all structured endpoints.
 */
async function processProjectAnalysis(projectId) {
    const projectIdx = dbState.projects.findIndex((p) => p.id === projectId);
    if (projectIdx === -1)
        return;
    const project = dbState.projects[projectIdx];
    project.status = "processing";
    saveDb();
    try {
        const aiClient = getAiClient();
        // Remove any existing endpoints & chunks for this project
        dbState.endpoints = dbState.endpoints.filter((e) => e.projectId !== projectId);
        dbState.chunks = dbState.chunks.filter((c) => c.projectId !== projectId);
        // 1. CHUNK FILES AND GENERATE EMBEDDINGS
        const chunks = [];
        let totalEmbedded = 0;
        const MAX_EMBEDDINGS = 25; // Even more restricted to stay within free tier
        
        for (const file of project.codeFiles) {
            if (totalEmbedded >= MAX_EMBEDDINGS) break;
            
            const fileChunks = chunkCode(file, projectId);
            for (const chunk of fileChunks) {
                if (totalEmbedded >= MAX_EMBEDDINGS) break;
                
                // Generate embedding for chunk with retry
                try {
                    // Increased artificial delay to avoid burst rate limits
                    await new Promise(resolve => setTimeout(resolve, 800));
                    
                    const embedRes = await callGeminiWithRetry(async () => {
                        return await aiClient.models.embedContent({
                            model: "gemini-embedding-2-preview",
                            contents: chunk.content,
                        });
                    }, 2, 3000);
                    chunk.embedding = embedRes.embedding?.values || embedRes.embeddings?.[0]?.values;
                    totalEmbedded++;
                }
                catch (err) {
                    console.warn(`Skipping embedding for chunk of ${file.name} due to rate limit/error:`, err.message);
                }
                chunks.push(chunk);
            }
        }
        dbState.chunks.push(...chunks);
        saveDb();
        // 2. LLM ENDPOINT EXTRACTION
        // We limit content sent to LLM to avoid token quota exhaustion. 
        // We prioritize files that look like routes/controllers and truncate them to first 200 lines.
        const codebaseOverview = project.codeFiles
            .filter(f => {
                const p = f.path.toLowerCase();
                return p.includes('route') || p.includes('controller') || p.includes('api') || p.includes('app.js') || p.includes('server.js') || p.includes('main.py');
            })
            .slice(0, 15) // Limit number of files
            .map(f => {
                const content = f.content.split('\n').slice(0, 200).join('\n');
                return `File Path: ${f.path}\n\`\`\`\n${content}\n\`\`\``;
            })
            .join("\n\n");
        const endpointSchema = {
            type: Type.OBJECT,
            properties: {
                method: { type: Type.STRING, description: "HTTP Method, e.g., GET, POST, PUT, DELETE, PATCH" },
                path: { type: Type.STRING, description: "The relative endpoint route path, e.g. /api/auth/register" },
                description: { type: Type.STRING, description: "Detailed description of what this API endpoint does" },
                authRequired: { type: Type.BOOLEAN, description: "Whether JWT authorization header is required" },
                requestBodySchema: { type: Type.STRING, description: "Detailed explanation or JSON Schema of request body (if any)" },
                parameters: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            in: { type: Type.STRING, description: "query, path, header, or body" },
                            type: { type: Type.STRING, description: "string, integer, boolean, object, etc" },
                            required: { type: Type.BOOLEAN },
                            description: { type: Type.STRING },
                        },
                        required: ["name", "in", "type", "required", "description"]
                    }
                },
                responses: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            statusCode: { type: Type.INTEGER },
                            description: { type: Type.STRING },
                            schema: { type: Type.STRING, description: "JSON format or visual description of response schema payload" },
                        },
                        required: ["statusCode", "description"]
                    }
                },
                fileOrigin: { type: Type.STRING, description: "Relative file path where this route is defined" },
                lineStart: { type: Type.INTEGER, description: "Approximate start line of this endpoint definition in code" },
                lineEnd: { type: Type.INTEGER, description: "Approximate end line of this endpoint definition in code" },
            },
            required: ["method", "path", "description", "authRequired", "parameters", "responses", "fileOrigin"]
        };
        const systemInstruction = `You are a professional API Documentation Engineer. 
        Analyze the provided source code for a ${project.framework.toUpperCase()} backend project.
        Identify all API endpoints/routes declared, parsing their methods, paths, descriptions, authentication requirements, parameters, and response schemas.
        
        Guidelines:
        - If the project uses ${project.framework}, look for standard patterns (e.g., decorators in Python, router methods in Express, annotations in Spring Boot).
        - Be thorough and capture all possible metadata for each endpoint.
        - Ground your extraction strictly in the source code provided.
        - Ensure paths are relative to the API root.
        
        Return a structured JSON list of all endpoints found.`;
        
        const prompt = `Source Files for ${project.framework.toUpperCase()} project:
        ${codebaseOverview}`;
        
        let extractedEndpoints = [];
        try {
            const modelResponse = await callGeminiWithRetry(async () => {
                return await aiClient.models.generateContent({
                    model: "gemini-3.6-flash",
                    contents: prompt,
                    config: {
                        systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.ARRAY,
                            items: endpointSchema,
                        },
                        temperature: 0.1,
                    },
                });
            });
            extractedEndpoints = JSON.parse(modelResponse.text.trim());
        }
        catch (err) {
            console.warn("Gemini LLM endpoint extraction failed (rate limit or quota), falling back to rule-based AST extractor:", err.message);
            extractedEndpoints = extractEndpointsFallback(project.codeFiles);
        }

        // Normalize and add to database
        const finalEndpoints = extractedEndpoints.map((item, idx) => ({
            id: `e-${projectId}-${idx}-${Date.now()}`,
            projectId,
            method: (item.method || "GET").toUpperCase(),
            path: item.path.startsWith("/") ? item.path : `/${item.path}`,
            description: item.description || "No description provided.",
            authRequired: !!item.authRequired,
            requestBodySchema: item.requestBodySchema || "",
            parameters: item.parameters || [],
            responses: item.responses || [{ statusCode: 200, description: "OK" }],
            fileOrigin: item.fileOrigin || "unknown",
            lineStart: item.lineStart || 1,
            lineEnd: item.lineEnd || 10,
        }));
        dbState.endpoints.push(...finalEndpoints);
        
        // Calculate Security Score: % of endpoints with authRequired
        const authCount = finalEndpoints.filter(e => e.authRequired).length;
        project.securityScore = Math.round((authCount / (finalEndpoints.length || 1)) * 100);
        
        saveDb();

        // 2.5 GRAPH EXTRACTION (GraphRAG)
        try {
            console.log(`Starting graph extraction for project: ${project.name}`);
            const graphData = await extractGraphWithAi(projectId, project.codeFiles, project.framework);
            dbState.graphs[projectId] = graphData;
            saveDb();
        } catch (graphErr) {
            console.error(`Graph extraction failed for project ${projectId}:`, graphErr.message);
            // Fallback to simple rule-based graph if AI fails
            dbState.graphs[projectId] = constructFallbackGraph(project, finalEndpoints);
            saveDb();
        }

        // 3. GENERATE OPENAPI AND MARKDOWN DOCUMENTS
        await generateDocsAndSaveVersion(projectId, project.versionNo);
        // Mark completed
        project.status = "completed";
        saveDb();
        console.log(`Successfully completed documentation generation for project: ${project.name}`);
    }
    catch (err) {
        console.error(`Error processing project ${projectId}:`, err);
        // Fallback: extract endpoints via fallback so project never fails
        try {
            const fallbackEndpoints = extractEndpointsFallback(project.codeFiles);
            const finalEndpoints = fallbackEndpoints.map((item, idx) => ({
                id: `e-${projectId}-${idx}-${Date.now()}`,
                projectId,
                method: item.method,
                path: item.path,
                description: item.description,
                authRequired: item.authRequired,
                requestBodySchema: item.requestBodySchema || "",
                parameters: item.parameters || [],
                responses: item.responses || [{ statusCode: 200, description: "OK" }],
                fileOrigin: item.fileOrigin || "unknown",
                lineStart: item.lineStart || 1,
                lineEnd: item.lineEnd || 10,
            }));
            dbState.endpoints.push(...finalEndpoints);
            await generateDocsAndSaveVersion(projectId, project.versionNo);
            
            // Fallback Graph
            dbState.graphs[projectId] = constructFallbackGraph(project, finalEndpoints);
            
            project.status = "completed";
            delete project.error;
            saveDb();
            console.log(`Successfully recovered project ${project.name} using fallback parser.`);
        } catch (fallbackErr) {
            project.status = "failed";
            project.error = err.message || "Unknown analysis error occurred.";
            saveDb();
        }
    }
}
/**
 * Re-generate OpenAPI Spec and Markdown representation and save a historical document version.
 */
async function generateDocsAndSaveVersion(projectId, versionNo) {
    const project = dbState.projects.find((p) => p.id === projectId);
    if (!project)
        return;
    const endpoints = dbState.endpoints.filter((e) => e.projectId === projectId);
    // A. Generate OpenAPI Spec object
    const paths = {};
    endpoints.forEach((ep) => {
        const formattedPath = ep.path.replace(/:(\w+)/g, "{$1}"); // Convert /api/projects/:id to /api/projects/{id}
        if (!paths[formattedPath]) {
            paths[formattedPath] = {};
        }
        const pathParameters = ep.parameters
            .filter((p) => p.in === "path")
            .map((p) => ({
            name: p.name,
            in: "path",
            required: true,
            schema: { type: p.type || "string" },
            description: p.description,
        }));
        const queryParameters = ep.parameters
            .filter((p) => p.in === "query")
            .map((p) => ({
            name: p.name,
            in: "query",
            required: p.required,
            schema: { type: p.type || "string" },
            description: p.description,
        }));
        const headerParameters = ep.parameters
            .filter((p) => p.in === "header")
            .map((p) => ({
            name: p.name,
            in: "header",
            required: p.required,
            schema: { type: p.type || "string" },
            description: p.description,
        }));
        const parameters = [...pathParameters, ...queryParameters, ...headerParameters];
        const responses = {};
        ep.responses.forEach((res) => {
            responses[res.statusCode] = {
                description: res.description,
                content: res.schema
                    ? {
                        "application/json": {
                            schema: {
                                type: "object",
                                example: safeJsonParse(res.schema),
                            },
                        },
                    }
                    : undefined,
            };
        });
        const requestBody = ep.requestBodySchema
            ? {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            description: ep.requestBodySchema,
                        },
                    },
                },
            }
            : undefined;
        paths[formattedPath][ep.method.toLowerCase()] = {
            summary: ep.description.split(".")[0],
            description: ep.description,
            operationId: `${ep.method.toLowerCase()}_${ep.path.replace(/\//g, "_").replace(/{|}/g, "")}`,
            security: ep.authRequired ? [{ BearerAuth: [] }] : [],
            parameters,
            requestBody,
            responses,
        };
    });
    const openApiObject = {
        openapi: "3.0.0",
        info: {
            title: project.name,
            description: `Generated API Documentation for the ${project.framework} backend service.`,
            version: `1.${versionNo}.0`,
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your bearer token in the format: Bearer <token>",
                },
            },
        },
        paths,
    };
    const openApiSpec = safeJsonStringify(openApiObject, 2);
    // B. Generate Markdown Doc
    let markdownDoc = `# ${project.name} - API Documentation\n\n`;
    markdownDoc += `**Framework:** ${project.framework.toUpperCase()}\n`;
    markdownDoc += `**Version:** 1.${versionNo}.0\n`;
    markdownDoc += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    markdownDoc += `## Table of Endpoints\n\n`;
    markdownDoc += `| Method | Path | Description | Auth Required |\n`;
    markdownDoc += `|---|---|---|---|\n`;
    endpoints.forEach((ep) => {
        markdownDoc += `| \`${ep.method}\` | \`${ep.path}\` | ${ep.description.split("\n")[0]} | ${ep.authRequired ? "✅ Yes" : "❌ No"} |\n`;
    });
    markdownDoc += `\n---\n\n## API Specification Details\n\n`;
    endpoints.forEach((ep) => {
        markdownDoc += `### ${ep.method} ${ep.path}\n\n`;
        markdownDoc += `**Description:** ${ep.description}\n\n`;
        markdownDoc += `**Auth Required:** ${ep.authRequired ? "Yes (Bearer Token)" : "No"}\n\n`;
        markdownDoc += `**Source Location:** \`${ep.fileOrigin}\` (Lines ${ep.lineStart}-${ep.lineEnd})\n\n`;
        const params = ep.parameters;
        if (params.length > 0) {
            markdownDoc += `#### Request Parameters\n\n`;
            markdownDoc += `| Name | Position | Type | Required | Description |\n`;
            markdownDoc += `|---|---|---|---|---|\n`;
            params.forEach((p) => {
                markdownDoc += `| \`${p.name}\` | \`${p.in}\` | \`${p.type}\` | ${p.required ? "Required" : "Optional"} | ${p.description} |\n`;
            });
            markdownDoc += `\n`;
        }
        if (ep.requestBodySchema) {
            markdownDoc += `#### Request Body Schema\n\n`;
            markdownDoc += `\`\`\`json\n${ep.requestBodySchema}\n\`\`\`\n\n`;
        }
        markdownDoc += `#### Responses\n\n`;
        ep.responses.forEach((res) => {
            markdownDoc += `##### Status \`${res.statusCode}\`\n\n`;
            markdownDoc += `${res.description}\n\n`;
            if (res.schema) {
                markdownDoc += `\`\`\`json\n${res.schema}\n\`\`\`\n\n`;
            }
        });
        markdownDoc += `\n---\n`;
    });
    // Save the historical version
    const newVersion = {
        id: `v-${projectId}-${versionNo}-${Date.now()}`,
        projectId,
        versionNo,
        generatedAt: new Date().toISOString(),
        endpoints,
        openApiSpec,
        markdownDoc,
    };
    dbState.versions.push(newVersion);
    saveDb();

    // Chunk generated documentation for RAG
    try {
        const docChunks = [];
        const sections = markdownDoc.split("\n---\n");
        const aiClient = getAiClient();
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i].trim();
            if (!section) continue;
            
            const chunk = {
                id: `doc-${projectId}-${versionNo}-${i}`,
                projectId,
                versionNo,
                content: section,
                lineStart: 1,
                lineEnd: section.split("\n").length,
                filePath: "API_DOCUMENTATION.md"
            };
            try {
                const embedRes = await aiClient.models.embedContent({
                    model: "gemini-embedding-2-preview",
                    contents: section,
                });
                chunk.embedding = embedRes.embedding?.values || embedRes.embeddings?.[0]?.values;
            } catch (err) {
                console.error("Failed embedding for doc chunk:", err.message || String(err));
            }
            docChunks.push(chunk);
        }
        
        dbState.docChunks = dbState.docChunks || [];
        dbState.docChunks = dbState.docChunks.filter((c) => c.projectId !== projectId);
        dbState.docChunks.push(...docChunks);
        saveDb();
    } catch (err) {
        console.error("Error generating doc chunks:", err.message || String(err));
    }
}
/**
 * Trigger update of active specification files
 */
function updateOpenApiSpec(projectId) {
    const project = dbState.projects.find((p) => p.id === projectId);
    if (!project)
        return;
    generateDocsAndSaveVersion(projectId, project.versionNo);
}
// JSON parsing helper
function safeJsonParse(val) {
    try {
        return JSON.parse(val);
    }
    catch {
        return val;
    }
}
// Start Server Setup
async function startServer() {
    // Integrate Vite as Middleware
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }
    else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}
/**
 * Simple rule-based graph construction fallback
 */
function constructFallbackGraph(project, endpoints) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    const addNode = (name, type) => {
        const nodeId = `${type}:${name}`;
        if (!nodeMap.has(nodeId)) {
            const node = { id: nodeId, name, type };
            nodes.push(node);
            nodeMap.set(nodeId, node);
        }
        return nodeId;
    };

    const addLink = (source, target, value = 1, type = "relates_to") => {
        links.push({ source, target, value, type });
    };

    const projectNodeId = addNode(project.name, "project");

    endpoints.forEach(ep => {
        const epNodeId = addNode(`${ep.method} ${ep.path}`, "route");
        addLink(projectNodeId, epNodeId);

        if (ep.fileOrigin) {
            const fileName = path.basename(ep.fileOrigin);
            const controllerNodeId = addNode(fileName, "controller");
            addLink(epNodeId, controllerNodeId);
        }
    });

    project.codeFiles.forEach(file => {
        const content = file.content.toLowerCase();
        const fileName = file.name.toLowerCase();

        if (content.includes("class ") || content.includes("interface ")) {
            if (fileName.includes("model") || content.includes("schema") || content.includes("table")) {
                const modelId = addNode(file.name, "model");
                addLink(projectNodeId, modelId);
            } else if (fileName.includes("service") || content.includes("service")) {
                const serviceId = addNode(file.name, "service");
                addLink(projectNodeId, serviceId);
            }
        }
    });

    return { nodes, links };
}

/**
 * Advanced LLM-powered graph extraction for GraphRAG
 */
async function extractGraphWithAi(projectId, codeFiles, framework) {
    const aiClient = getAiClient();
    
    // Overview of file structure and sample content for relationship discovery
    // We limit to the first 20 files and first 50 lines each to keep prompt within free tier token limits
    const structureSummary = codeFiles.slice(0, 20).map(f => {
        const contentSample = f.content.split('\n').slice(0, 50).join('\n');
        return `File: ${f.path}\nContent Sample:\n${contentSample}`;
    }).join('\n\n---\n\n');

    const systemInstruction = `You are a Code Architecture Expert. 
    Analyze the provided source code structure for a ${framework.toUpperCase()} project.
    Your goal is to identify high-level relationships between architectural components:
    - Controllers/Routes
    - Services/Business Logic
    - Models/Entities/Schemas
    - Repositories/Database Access
    - External API Clients
    
    Identify how these components call or reference each other.
    
    Return a structured JSON object with "nodes" and "links".
    Nodes should have: { "id": "type:name", "name": "string", "type": "route|controller|service|model|database|external" }
    Links should have: { "source": "node_id", "target": "node_id", "type": "calls|uses|references|implements" }`;

    const prompt = `Codebase Structure and Samples:\n${structureSummary}`;

    try {
        const response = await callGeminiWithRetry(async () => {
            return await aiClient.models.generateContent({
                model: "gemini-3.6-flash",
                contents: prompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            nodes: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        type: { type: Type.STRING }
                                    },
                                    required: ["id", "name", "type"]
                                }
                            },
                            links: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        source: { type: Type.STRING },
                                        target: { type: Type.STRING },
                                        type: { type: Type.STRING }
                                    },
                                    required: ["source", "target", "type"]
                                }
                            }
                        },
                        required: ["nodes", "links"]
                    },
                    temperature: 0.1,
                }
            });
        }, 2, 2000);

        const graphData = JSON.parse(response.text.trim());
        return graphData;
    } catch (err) {
        console.error("AI Graph Extraction failed:", err);
        throw err;
    }
}
startServer();
