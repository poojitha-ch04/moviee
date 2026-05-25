# Moviee 🍿

Welcome to **Moviee**, a premium, highly-interactive movie streaming and discovery platform! This project is a full-stack application featuring a React frontend and a FastAPI backend with PostgreSQL/SQLite, integrated with AI features using Google Gemini.

## 📁 Project Structure

The repository is divided into two main directories:

- `/backend`: The Python FastAPI server. Handles database operations, user authentication, AI integrations, TMDB fetching, and WebSockets.
- `/frontend`: The React application (built with Vite). Contains the user interface, routing, styling (Tailwind CSS), and client-side logic.

## 🚀 Features

- **Stunning UI/UX:** Dark mode aesthetics, glassmorphism, dynamic gradients, and smooth animations using Tailwind CSS.
- **AI Movie Assistant:** A floating chatbot powered by Gemini 2.5 Flash that gives recommendations, trivia, and semantic search.
- **Social Follow System:** Follow other users and see their recent reviews in a dedicated Social Feed.
- **Interactive Watch Parties:** Real-time synchronized YouTube trailer playback using WebSockets.
- **Advanced Discovery:** Filter movies by rating, year, runtime, and genre.
- **Offline Mode:** Uses Service Workers for basic offline capabilities.

---

## 💻 Local Development Setup

To run this project locally, you will need to run both the backend and frontend servers in separate terminal windows.

### 1. Backend Setup (FastAPI)

**Prerequisites:** Python 3.10+

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   Create a `.env` file in the `backend` directory and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   # Optional: For PostgreSQL (Neon). If omitted, it defaults to a local SQLite database.
   DATABASE_URL=postgresql://user:password@hostname/dbname
   ```
5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will be running at `http://localhost:8000`*

### 2. Frontend Setup (React/Vite)

**Prerequisites:** Node.js (v18+)

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the node modules:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will be running at `http://localhost:5173`*

---

## 🌐 Deployment (Render)

This project is configured to be deployed on platforms like [Render.com](https://render.com).

### Backend Deployment
- **Type:** Web Service
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:** Set `GEMINI_API_KEY` and `DATABASE_URL`.

### Frontend Deployment
- **Type:** Static Site
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:** Set `VITE_API_URL` to your live backend URL (e.g., `https://your-backend.onrender.com/api/v1`).
