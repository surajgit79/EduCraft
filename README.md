# EduCraft - Transforming School Education using AI

A Minecraft-style 3D educational web game that makes learning fun through interactive gameplay, AI-powered questions, and personalized tutoring.

## Features

- **3D Voxel World**: Explore Minecraft-style worlds themed around different subjects
- **AI-Powered Questions**: Dynamic question generation using Groq's Llama model
- **Adaptive Difficulty**: Questions adjust based on student performance
- **AI Tutor**: In-game chat assistant for personalized help
- **Multiplayer**: Co-op and competitive modes with real-time leaderboards
- **Teacher Dashboard**: Track student progress with detailed analytics
- **Progress Tracking**: XP, levels, streaks, and achievements stored in Firebase

## Tech Stack

### Frontend
- React + Vite
- Three.js with @react-three/fiber and @react-three/drei
- Tailwind CSS
- Zustand (state management)
- Socket.io-client
- Firebase SDK v9+
- Recharts
- Framer Motion

### Backend
- Python + Flask
- Flask-SocketIO
- Groq API (llama-3.3-70b-versatile)

## Prerequisites

1. **Node.js** (v18+)
2. **Python** (v3.9+)
3. **Groq API Key** - Get one at https://console.groq.com
4. **Firebase Project** - Create at https://console.firebase.google.com

## Setup Instructions

### 1. Clone and Navigate

```bash
cd educraft
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your Groq API key:
# GROQ_API_KEY=your_api_key_here
```

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication**:
   - Email/Password
   - Google
3. Enable **Firestore Database**:
   - Create database in test mode (or set appropriate rules)
4. Get your config values:
   - Project Settings → General → Your apps → Web app

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
# Create a .env file with:
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Running the Application

### Terminal 1 - Backend

```bash
cd backend
python app.py
```

The backend will run on http://localhost:5000

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on http://localhost:5173

## Firestore Database Structure

```
users/{uid}
  - name, email, role (student|teacher), avatar_color
  - grade, subjects_played[], created_at

sessions/{sessionId}
  - uid, subject, grade, mode
  - questions_answered, correct_answers, xp_earned, accuracy

progress/{uid}/subjects/{subject}
  - total_xp, level, total_questions, correct_answers
  - accuracy, weak_topics[], last_played

achievements/{uid}
  - badges[], current_streak, longest_streak, last_played_date
```

## API Routes

- `POST /api/generate-world` - Generate 3D world context
- `POST /api/generate-question` - Generate AI questions
- `POST /api/tutor-chat` - AI tutor conversation
- `POST /api/analyze-session` - Identify weak topics
- `POST /api/class-insight` - Generate class insights for teachers

## Socket.io Events

- `join_room` - Join multiplayer room
- `player_answered` - Broadcast answer results
- `leaderboard_update` - Real-time score updates

## Game Controls

- **W/A/S/D** - Move
- **Mouse** - Look around
- **Click** - Interact with entities
- **ESC** - Release pointer lock

## License

MIT License
