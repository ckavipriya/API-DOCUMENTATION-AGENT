/**
 * Split source code into logical chunks of roughly maxLines (50 lines) or maxCharacters (1500 chars).
 * Splits on line breaks, keeping logical functions and import/route groups together when possible.
 */
export function chunkCode(file, projectId) {
    const lines = file.content.split("\n");
    const chunks = [];
    let currentChunkLines = [];
    let currentStartLine = 1;
    let currentCharCount = 0;
    const maxLines = 60;
    const maxChars = 2000;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        currentChunkLines.push(line);
        currentCharCount += line.length + 1;
        // Check if we should split
        const isBlankLine = line.trim() === "";
        const isClosingBrace = line.trim() === "}" || line.trim() === "};" || line.trim() === "]" || line.trim() === "];";
        const reachedSizeLimit = currentChunkLines.length >= maxLines || currentCharCount >= maxChars;
        if (reachedSizeLimit && (isBlankLine || isClosingBrace || currentChunkLines.length > maxLines + 20)) {
            chunks.push({
                id: `${projectId}-${file.name}-${currentStartLine}`,
                projectId,
                filePath: file.path,
                content: currentChunkLines.join("\n"),
                lineStart: currentStartLine,
                lineEnd: i + 1,
            });
            // Reset
            currentChunkLines = [];
            currentStartLine = i + 2;
            currentCharCount = 0;
        }
    }
    // Handle trailing lines
    if (currentChunkLines.length > 0) {
        chunks.push({
            id: `${projectId}-${file.name}-${currentStartLine}`,
            projectId,
            filePath: file.path,
            content: currentChunkLines.join("\n"),
            lineStart: currentStartLine,
            lineEnd: lines.length,
        });
    }
    return chunks;
}
/**
 * Compute the cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length)
        return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0)
        return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
/**
 * Detect the backend framework based on file structure, dependencies, and code patterns.
 */
export function detectFramework(codeFiles) {
    let scores = {
        express: 0,
        fastapi: 0,
        flask: 0,
        django: 0,
        springboot: 0
    };

    const fileNames = codeFiles.map(f => f.name.toLowerCase());
    const filePaths = codeFiles.map(f => f.path.toLowerCase());
    
    // 1. Dependency Analysis
    const packageJson = codeFiles.find(f => f.name === 'package.json');
    if (packageJson) {
        if (packageJson.content.includes('"express"')) scores.express += 10;
        if (packageJson.content.includes('"hapi"')) scores.express += 5; // Grouping Node frameworks for now
        if (packageJson.content.includes('"koa"')) scores.express += 5;
    }

    const requirementsTxt = codeFiles.find(f => f.name === 'requirements.txt');
    if (requirementsTxt) {
        if (requirementsTxt.content.toLowerCase().includes('fastapi')) scores.fastapi += 10;
        if (requirementsTxt.content.toLowerCase().includes('flask')) scores.flask += 10;
        if (requirementsTxt.content.toLowerCase().includes('django')) scores.django += 10;
    }

    const pomXml = codeFiles.find(f => f.name === 'pom.xml');
    const buildGradle = codeFiles.find(f => f.name === 'build.gradle');
    if (pomXml || buildGradle) {
        const content = (pomXml?.content || '') + (buildGradle?.content || '');
        if (content.toLowerCase().includes('spring-boot')) scores.springboot += 10;
    }

    // 2. File Structure Analysis
    if (fileNames.includes('manage.py')) scores.django += 15;
    if (fileNames.includes('wsgi.py') || fileNames.includes('asgi.py')) {
        scores.django += 5;
        scores.fastapi += 5;
    }
    if (filePaths.some(p => p.includes('spring')) || fileNames.includes('application.properties') || fileNames.includes('application.yml')) {
        scores.springboot += 10;
    }

    // 3. Code Pattern Analysis (Imports & Syntax)
    codeFiles.forEach(file => {
        const content = file.content;
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'js' || ext === 'ts') {
            if (content.includes("require('express')") || content.includes('from "express"') || content.includes("from 'express'")) scores.express += 10;
            if (content.includes('express()')) scores.express += 10;
            if (content.includes('router.get(') || content.includes('router.post(')) scores.express += 2;
        }

        if (ext === 'py') {
            // FastAPI patterns
            if (content.includes('from fastapi import') || content.includes('import fastapi')) scores.fastapi += 15;
            if (content.includes('FastAPI()')) scores.fastapi += 15;
            if (content.includes('@app.get(') && content.includes('async def')) scores.fastapi += 5;
            
            // Flask patterns
            if (content.includes('from flask import') || content.includes('import flask')) scores.flask += 15;
            if (content.includes('Flask(__name__)')) scores.flask += 15;
            if (content.includes('@app.route(')) scores.flask += 10;

            // Django patterns
            if (content.includes('from django.') || content.includes('import django')) scores.django += 10;
            if (content.includes('models.Model') && file.path.includes('models')) scores.django += 5;
            if (content.includes('urlpatterns = [') && file.path.includes('urls')) scores.django += 10;
        }

        if (ext === 'java' || ext === 'kt') {
            if (content.includes('org.springframework.boot') || content.includes('@SpringBootApplication')) scores.springboot += 20;
            if (content.includes('@RestController') || content.includes('@RequestMapping')) scores.springboot += 15;
            if (content.includes('@GetMapping') || content.includes('@PostMapping')) scores.springboot += 10;
        }
    });

    // Determine highest score
    let bestFramework = 'express'; // Default fallback
    let maxScore = 0;
    let foundAny = false;
    
    Object.entries(scores).forEach(([fw, score]) => {
        if (score > 0) foundAny = true;
        if (score > maxScore) {
            maxScore = score;
            bestFramework = fw;
        }
    });

    // Calculate confidence (0 to 1)
    // If we found something, confidence is based on score. If not, it's very low.
    const confidence = foundAny ? Math.min(maxScore / 40, 0.95) : 0.1;

    return {
        framework: bestFramework,
        confidence: parseFloat(confidence.toFixed(2)),
        allScores: scores,
        detected: foundAny
    };
}
/**
 * Realistic Template Codebases to pre-populate or import instantly
 */
export const TEMPLATE_PROJECTS = {
    express: [
        {
            name: "authController.js",
            path: "controllers/authController.js",
            size: 1540,
            content: `const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password.' });
  }

  try {
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.createUser({ name, email, password: hashedPassword, role: role || 'Developer' });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT
 * @access Public
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
};`
        },
        {
            name: "projectController.js",
            path: "controllers/projectController.js",
            size: 1940,
            content: `const db = require('../db');

/**
 * @route GET /api/projects
 * @desc Get all projects for the logged-in user
 * @access Private
 */
exports.getProjects = async (req, res) => {
  try {
    const projects = await db.getProjectsByUserId(req.user.id);
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve projects.' });
  }
};

/**
 * @route GET /api/projects/:id
 * @desc Get project details by ID
 * @access Private
 */
exports.getProjectById = async (req, res) => {
  try {
    const project = await db.findProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    
    // Check ownership
    if (project.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Not authorized to access this project.' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching project details.' });
  }
};

/**
 * @route POST /api/projects/upload
 * @desc Upload and analyze a new project codebase
 * @access Private
 */
exports.uploadProject = async (req, res) => {
  const { name, framework } = req.body;
  if (!name || !framework) {
    return res.status(400).json({ error: 'Project name and framework (express) are required.' });
  }

  try {
    const newProject = await db.createProject({
      userId: req.user.id,
      name,
      framework,
      status: 'pending',
      createdAt: new Date()
    });

    res.status(201).json({
      message: 'Project uploaded and queued for documentation generation.',
      project: newProject
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload project.' });
  }
};`
        },
        {
            name: "routes.js",
            path: "routes/routes.js",
            size: 920,
            content: `const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const projectController = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

// Authentication Endpoints
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Project Management Endpoints (Requires JWT)
router.get('/projects', protect, projectController.getProjects);
router.get('/projects/:id', protect, projectController.getProjectById);
router.post('/projects/upload', protect, authorize('Developer', 'Admin'), projectController.uploadProject);

module.exports = router;`
        }
    ],
};
