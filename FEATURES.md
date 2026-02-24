# EduCraft - Feature Documentation

## Project Overview
EduCraft is an educational gamification platform that combines learning with Minecraft-style 3D gameplay. Students answer questions to defeat enemies, collect resources, and progress through chapters.

---

## Frontend Features

### 1. Authentication System (`AuthScreen.jsx`)
- **Login/Sign Up**: Email & password authentication
- **Google OAuth**: Sign in with Google
- **Demo Mode**: Works without Firebase (mock data)
- **Role Selection**: Student or Teacher
- **Grade Selection**: Grades 1-12

### 2. Student Dashboard (`StudentDashboard.jsx`)
- Welcome message with streak display
- "Start Learning" button to enter game
- Recent progress display (last 5 activities)
- Progress stats: XP earned, accuracy, session history
- Logout functionality

### 3. Teacher Dashboard (`TeacherDashboard.jsx`)
- Class code generation & display
- Student list with progress tracking
- XP & accuracy charts by subject (BarChart, LineChart)
- AI-powered class insights
- Real-time student progress table

### 4. Mode Selection (`ModeSelection.jsx`)
- Two learning modes:
  - **Syllabus Mode**: Upload PDF textbook, AI generates chapter-wise questions
  - **Quick Play**: General curriculum questions
- File upload with drag & drop
- AI syllabus analysis (subject/grade detection)

### 5. World Selection (`WorldSelection.jsx`)
- 5 subjects: Math, Science, History, Geography, English
- Subject-specific themed worlds
- Grade level selection (1-12)
- Game modes: Solo, Co-op, Competitive
- Room code system for multiplayer
- Syllabus upload integration

### 6. Game World (`GameWorld.jsx`)
- 3D Minecraft-style environment using Three.js
- **Player Movement**: WASD controls with PointerLockControls
- **Enemies**: 3 floating octahedrons to fight
- **Resources**: 3 collectible blocks
- **NPC**: Teacher/Quest Giver
- **Sky/Environment**: Dynamic sky with terrain

#### Game Mechanics:
- **Health (HP)**: Starts at 100, wrong answers deal 20 damage
- **XP System**: Earn XP for correct answers (easy: 10, medium: 15, hard: 20)
- **Leveling**: Level up every 100 XP
- **Healing**: +10 HP on correct answer
- **Difficulty**: Adjusts based on accuracy (easy < 50%, medium 50-80%, hard > 80%)

#### Quest Completion Logic:
- **Syllabus Mode**: Complete when all 3 enemies defeated
- **Default Mode**: Complete when ALL 7 entities attempted (3 enemies + 3 resources + 1 NPC)
- Results screen shows score, accuracy, grade, XP earned

### 7. Question Modal (`QuestionModal.jsx`)
- Timed questions (30 seconds)
- 4 multiple choice options
- Immediate feedback with explanations
- XP rewards and damage system
- Difficulty adjustment based on performance

### 8. AI Tutor Chat (`AITutorChat.jsx`)
- Real-time chat with AI tutor
- Subject-aware responses
- Chat history tracking
- Uses Groq API for AI responses

### 9. Game HUD (`GameHUD.jsx`)
- HP bar display
- XP/Level progress bar
- Subject/Grade display
- Mode indicator
- Multiplayer room code
- Game menu (stats, exit)
- Instructions/help modal
- Leaderboard for multiplayer

### 10. Chapter Results (`ChapterResult.jsx`)
- Grade calculation (A+ to F based on accuracy)
- Score display
- Accuracy percentage
- Correct/Total questions
- XP earned
- "Continue to Next Chapter" (syllabus mode only)
- "Exit to Home" option

---

## Backend Features (Flask + SocketIO)

### API Endpoints

#### 1. `/api/upload-syllabus` (POST)
- Accepts PDF or text files
- AI extracts chapters using PyPDF2
- Detects subject and grade using Groq
- Returns: syllabus_id, chapters, total_chapters, detected_subject, detected_grade

#### 2. `/api/get-chapters` (GET)
- Query: `syllabus_id`
- Returns chapter list for a syllabus

#### 3. `/api/generate-question` (POST)
- Generates unique questions using Groq (Llama 3.3)
- Parameters: subject, grade, difficulty, weak_topics, chapter_content
- Tracks question history to avoid duplicates
- Fallback to default questions if API fails

#### 4. `/api/complete-chapter` (POST)
- Saves chapter completion data
- Parameters: user_id, syllabus_id, chapter_id, score, accuracy, time_taken, etc.
- Returns: success status, completion data, next_chapter

#### 5. `/api/get-progress` (GET)
- Query: user_id, (optional) subject
- Returns: syllabus_progress, default_progress, total_completions

#### 6. `/api/generate-world` (POST)
- Generates themed world data using Groq
- Parameters: subject, grade
- Returns: world_name, biome_description, enemies, resources, quest details

#### 7. `/api/tutor-chat` (POST)
- AI tutor conversation endpoint
- Parameters: subject, grade, message, chat_history
- Returns: AI response

#### 8. `/api/analyze-session` (POST)
- Analyzes wrong answers to identify weak topics
- Parameters: subject, grade, wrong_answers
- Returns: weak_topics array

#### 9. `/api/class-insight` (POST)
- Teacher AI insights
- Parameters: students array with stats
- Returns: actionable insight text

### Socket.IO Events

#### `join_room`
- Join multiplayer room
- Data: room_code, username, user_id

#### `player_answered`
- Broadcast answer results
- Data: room_code, user_id, correct, username

#### `leave_room`
- Leave multiplayer room

---

## State Management (Zustand)

### authStore (`authStore.js`)
- user, userData
- login, signup, logout functions
- Google OAuth integration
- Demo mode support

### gameStore (`gameStore.js`)
- worldData, sessionData, playerStats
- Question/answer handling
- XP/HP management
- Multiplayer state
- Syllabus/chapter tracking
- Session saving

---

## Current Game Flow

```
1. Login/Sign Up
   ↓
2. Student Dashboard
   ↓
3. World Selection (choose subject/grade/mode)
   ↓
4. Enter Game World
   ↓
5. Interact with Entities (enemies/resources/NPC)
   - Each interaction triggers question
   - Correct: +XP, +HP, difficulty may increase
   - Wrong: -HP, difficulty decreases
   ↓
6. Quest Completion Check
   - Syllabus Mode: All 3 enemies defeated
   - Default Mode: All 7 entities attempted
   ↓
7. Results Screen
   - Show grade, score, accuracy, XP
   - Option to continue or exit
```

---

## Known Features & Configurations

### Demo Mode
- Activated when `VITE_FIREBASE_API_KEY` is not set or starts with "your_"
- Mock user data provided
- Firebase features disabled
- Works without backend for basic UI testing

### Subjects & Colors
| Subject   | Primary Color | World Name        |
|-----------|---------------|-------------------|
| Math      | #06b6d4       | Crystal Peaks     |
| Science   | #10b981       | Neon Lab Zone    |
| History   | #f59e0b       | Ancient Ruins    |
| Geography | #0891b2       | Terra Nova       |
| English   | #a855f7       | Storybook Library|

### Difficulty Levels
| Difficulty | XP Reward | Condition          |
|------------|-----------|--------------------|
| Easy       | 10 XP     | Accuracy < 50%     |
| Medium     | 15 XP     | 50% ≤ Accuracy < 80%|
| Hard       | 20 XP     | Accuracy ≥ 80%     |

---

## Environment Variables

### Frontend (.env)
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
```

### Backend (.env)
```
GROQ_API_KEY=your_groq_api_key
SECRET_KEY=your_secret_key
```

---

## Dependencies

### Frontend
- React 18
- React Router DOM
- Zustand (state management)
- Three.js / @react-three/fiber / @react-three/drei (3D)
- Framer Motion (animations)
- Firebase (auth, firestore)
- Socket.IO Client
- Recharts (charts)

### Backend
- Flask
- Flask-SocketIO
- Flask-CORS
- Groq (AI)
- PyPDF2 (PDF parsing)
- python-dotenv

---

## To Do / Potential Issues

1. **Backend Required**: Frontend needs Flask backend running on port 5000
2. **Groq API Key**: Required for AI features (questions, tutor, world generation)
3. **Firebase Config**: Optional - works in demo mode without it
4. **Multiplayer**: SocketIO needs backend running
5. **Question History**: Stored in memory (resets on server restart)
6. **Syllabus Storage**: Stored in memory (resets on server restart)
