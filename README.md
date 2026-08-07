# API Documentation Agent

An AI-powered documentation agent using React.js, Node.js + Express.js, MongoDB, and Gemini to parse backend code, generate OpenAPI specifications, and answer questions via RAG.

## Technology Stack

### Frontend
* **React.js** (v19)
* **HTML5 & CSS3** (Tailwind CSS)
* **JavaScript (ES6+)**

### Backend
* **Node.js**
* **Express.js**

### Database
* **MongoDB**

### AI Engine
* **Google Gemini API** (Models: `gemini-embedding-2-preview`, `gemini-3.5-flash`)
* **Mongoose** (for document orchestration)

## Project Architecture

1. **Frontend:** React.js dashboard interface designed with Tailwind CSS. It allows developers and product managers to view parsed code, test API endpoints, and chat with the AI assistant.
2. **Backend:** Node.js + Express.js server that processes user uploads, orchestrates code parsing, handles API routes, and manages embeddings.
3. **Database:** MongoDB acts as the vector store engine. When code is uploaded, it is split into chunks, vectorized via Gemini, and indexed into MongoDB for rapid semantic search (RAG).

## Installation Steps

1. Clone the repository.
2. Ensure you have **Node.js** installed (v18+ recommended).
3. Ensure you have **MongoDB** installed and running locally, or have a MongoDB Atlas connection string.
4. Run `npm install` to install all dependencies for both frontend and backend.
5. Create a `.env` file from `.env.example` and add your `GEMINI_API_KEY` and MongoDB URI.
6. Run `npm run dev` to start the development server.

## Features

- **Automated OpenAPI Spec Generation**: Upload your Node.js/Express.js codebase and get a complete OpenAPI spec.
- **RAG-Powered Chat**: Ask questions about your API codebase, and the assistant uses MongoDB vector search to provide grounded answers.
- **Interactive Code Editor**: View the source files natively in the browser with syntax highlighting.

## Deployment

1. Run `npm run build` to build the React frontend and compile the Express backend.
2. Start the production server with `npm start`.
3. The app is ready to be deployed to platforms like Google Cloud Run, Heroku, or any environment supporting Node.js containers.
