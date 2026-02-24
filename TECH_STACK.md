# EduCraft - Technical Documentation

## 🎮 What is EduCraft?

EduCraft is an educational gamification platform that transforms learning into a Minecraft-style 3D adventure. Students answer questions to defeat enemies, collect resources, and progress through chapters while earning XP and leveling up.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **Vite** | Build tool & dev server |
| **Zustand** | State management |
| **React Router DOM** | Navigation |
| **React Three Fiber** | 3D rendering (Three.js) |
| **@react-three/drei** | 3D helpers (Sky, Text, PointerLockControls) |
| **Framer Motion** | Animations |
| **Tailwind CSS** | Styling |
| **Firebase** | Authentication & database |
| **Socket.IO Client** | Real-time multiplayer |

### Backend
| Technology | Purpose |
|------------|---------|
| **Flask** | Web framework |
| **Flask-SocketIO** | Real-time multiplayer |
| **Flask-CORS** | Cross-origin requests |
| **Groq API** | AI-powered question generation |
| **PyPDF2** | PDF syllabus parsing |

---

## 🤖 AI Implementation

### Which AI is Used?
**Groq API** with **Llama 3.3 70B** model

### How AI is Used?

#### 1. Question Generation (`/api/generate-question`)
- Generates unique questions based on:
  - Subject (Math, Science, History, Geography, English)
  - Grade level (1-12)
  - Difficulty (easy/medium/hard)
  - Chapter content (for syllabus mode)
  - Entity name (for contextual questions)
- Each entity gets a unique question
- Questions are tracked to avoid duplicates

#### 2. Syllabus Analysis (`/api/upload-syllabus`)
- Extracts text from PDF using PyPDF2
- Sends content to Groq for analysis
- Detects:
  - Subject
  - Grade level
  - Chapter divisions with titles and content

#### 3. World Generation (`/api/generate-world`)
- Creates themed 3D world data based on subject
- Generates:
  - World name
  - Biome description
  - Enemy names (themed)
  - Resource names (themed)
  - Quest details

#### 4. AI Tutor Chat (`/api/tutor-chat`)
- Conversational AI assistant
- Answers subject-related questions
- Provides explanations

#### 5. Weak Topic Analysis (`/api/analyze-session`)
- Analyzes wrong answers
- Identifies topics student struggles with
- Adjusts question difficulty accordingly

### Why Groq API?

1. **Fast Inference** - Groq provides extremely fast AI responses
2. **Cost-Effective** - Pay per token, no subscription
3. **High Quality** - Llama 3.3 70B is a powerful model
4. **Easy Integration** - Simple REST API

---

## 📋 FAQ - Demonstration Questions

### General
**Q: Does this work without internet?**
A: No, requires internet for AI question generation. Some features work offline (gameplay).

**Q: Can multiple students play together?**
A: Yes! Co-op and Competitive modes support multiplayer via Socket.IO.

**Q: Is this free?**
A: The code is free. You'll need to provide your own:
- Groq API key (free tier available)
- Firebase project (free tier available)

---

### Technical

**Q: Why does the backend need to run separately?**
A: The backend handles AI API calls and data storage. Frontend alone cannot generate questions.

**Q: Where is data stored?**
- **Backend**: In-memory (resets on restart)
- **Production**: Would use a database (Firebase Firestore or PostgreSQL)

**Q: What if the AI generates a bad question?**
A: System has fallback default questions for each subject/difficulty. Also retries up to 15 times for uniqueness.

---

### Gameplay

**Q: How do I advance to the next chapter?**
A: Complete all 7 entities (3 enemies + 3 resources + 1 NPC) in a chapter to unlock the next one.

**Q: What's the difference between Quick Play and Syllabus mode?**
- **Quick Play**: General questions across subjects
- **Syllabus Mode**: Questions generated from uploaded textbook PDF

**Q: How is difficulty determined?**
- Easy: <50% accuracy
- Medium: 50-80% accuracy  
- Hard: >80% accuracy

**Q: What happens if I get a question wrong?**
- Lose 20 HP (or 25 for timeout)
- Difficulty decreases
- Can still retry other entities

---

### AI & Questions

**Q: Why do questions sometimes seem generic?**
A: If Groq API fails, system falls back to default questions. Check backend terminal for error logs.

**Q: Can I customize the questions?**
A: Yes! Modify the prompts in `backend/app.py` to change question style.

**Q: Are questions repeated?**
A: System tracks question history per entity/chapter to prevent duplicates.

---

## 🚀 Running the Project

### Prerequisites
- Node.js 18+
- Python 3.8+
- Groq API key
- (Optional) Firebase project

### Setup

1. **Clone and install frontend:**
```bash
cd frontend
npm install
npm run dev
```

2. **Setup backend:**
```bash
cd backend
pip install -r requirements.txt
# Add your GROQ_API_KEY to .env
python app.py
```

3. **Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## 📁 Project Structure

```
educraft/
├── frontend/           # React app
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── screens/      # Page components
│   │   ├── store/        # Zustand stores
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utilities
│   └── ...
├── backend/           # Flask API
│   ├── app.py         # Main API
│   └── requirements.txt
├── FEATURES.md        # Feature documentation
└── README.md          # This file
```

---

## 🔑 Environment Variables

### Frontend (.env)
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Backend (.env)
```
GROQ_API_KEY=your_groq_api_key
SECRET_KEY=your_secret_key
```

---

## 🎯 Key Features

1. ✅ 3D Minecraft-style game world
2. ✅ AI-generated questions per subject
3. ✅ PDF syllabus upload & analysis
4. ✅ Chapter-wise progression
5. ✅ XP & leveling system
6. ✅ AI Tutor chat
7. ✅ Multiplayer support
8. ✅ Progress tracking
9. ✅ Subject-themed worlds
10. ✅ Adaptive difficulty

---

*For more details, see FEATURES.md*
