from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
import os
import json
import uuid
from datetime import datetime
import re
import hashlib

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'educraft-secret-key')
CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))

rooms = {}
syllabus_storage = {}
question_history = {}
chapter_completions = {}

def extract_text_from_pdf_content(content):
    text = ""
    try:
        import PyPDF2
        import io
        pdf_file = io.BytesIO(content)
        reader = PyPDF2.PdfReader(pdf_file)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")
        text = content.decode('utf-8', errors='ignore') if isinstance(content, bytes) else str(content)
    return text

def parse_syllabus_into_chapters(text):
    chapters = []
    lines = text.split('\n')
    
    chapter_patterns = [
        r'^chapter\s*(\d+)',
        r'^unit\s*(\d+)',
        r'^module\s*(\d+)',
        r'^lesson\s*(\d+)',
        r'^(\d+)[\.\)]\s*',
    ]
    
    current_chapter = None
    current_content = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        is_chapter_start = False
        for pattern in chapter_patterns:
            if re.match(pattern, line, re.IGNORECASE):
                is_chapter_start = True
                break
        
        if is_chapter_start:
            if current_chapter:
                chapters.append({
                    'id': len(chapters) + 1,
                    'title': current_chapter,
                    'content': ' '.join(current_content[:50])
                })
            current_chapter = line
            current_content = []
        else:
            current_content.append(line)
    
    if current_chapter and current_content:
        chapters.append({
            'id': len(chapters) + 1,
            'title': current_chapter,
            'content': ' '.join(current_content[:50])
        })
    
    if not chapters:
        chapters = [
            {'id': 1, 'title': 'Chapter 1: Introduction', 'content': text[:500]},
            {'id': 2, 'title': 'Chapter 2: Basics', 'content': text[500:1000] if len(text) > 500 else text},
        ]
    
    return chapters

def get_question_hash(question_text, options):
    content = f"{question_text}_{'_'.join(options)}"
    return hashlib.md5(content.encode()).hexdigest()

def detect_subject_and_grade(text):
    sample_text = text[:2000]
    
    prompt = f"""Analyze this educational content and determine:
1. The subject (Math, Science, History, Geography, English, or other)
2. The likely grade level (1-12)

Content sample:
{sample_text}

Return ONLY valid JSON: {{ "subject": "string", "grade": "number", "reason": "short explanation" }}"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200
        )
        content = response.choices[0].message.content
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            result = json.loads(content[json_start:json_end])
            return result.get('subject', 'Math'), str(result.get('grade', 5))
    except Exception as e:
        print(f"Error detecting subject/grade: {e}")
    
    return 'Math', '5'

@app.route('/api/upload-syllabus', methods=['POST'])
def upload_syllabus():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    user_id = request.form.get('user_id', 'anonymous')
    
    try:
        content = file.read()
        
        if file.filename.endswith('.pdf'):
            text = extract_text_from_pdf_content(content)
        else:
            text = content.decode('utf-8', errors='ignore')
        
        detected_subject, detected_grade = detect_subject_and_grade(text)
        
        chapters = parse_syllabus_into_chapters(text)
        
        syllabus_id = str(uuid.uuid4())
        syllabus_storage[syllabus_id] = {
            'id': syllabus_id,
            'user_id': user_id,
            'subject': detected_subject,
            'grade': detected_grade,
            'chapters': chapters,
            'filename': file.filename,
            'created_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'syllabus_id': syllabus_id,
            'chapters': chapters,
            'total_chapters': len(chapters),
            'detected_subject': detected_subject,
            'detected_grade': detected_grade
        })
    
    except Exception as e:
        print(f"Error uploading syllabus: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-chapters', methods=['GET'])
def get_chapters():
    syllabus_id = request.args.get('syllabus_id')
    
    if syllabus_id and syllabus_id in syllabus_storage:
        return jsonify(syllabus_storage[syllabus_id])
    
    return jsonify({'chapters': [], 'error': 'Syllabus not found'}), 404

@app.route('/api/get-syllabus-list', methods=['GET'])
def get_syllabus_list():
    user_id = request.args.get('user_id', 'anonymous')
    user_syllabi = [s for s in syllabus_storage.values() if s['user_id'] == user_id]
    return jsonify({'syllabi': user_syllabi})

@app.route('/api/generate-question', methods=['POST'])
def generate_question():
    data = request.json
    subject = data.get('subject', 'Math')
    grade = data.get('grade', '5')
    difficulty = data.get('difficulty', 'medium')
    interaction_type = data.get('interaction_type', 'enemy')
    weak_topics = data.get('weak_topics', [])
    chapter_content = data.get('chapter_content', '')
    syllabus_id = data.get('syllabus_id')
    chapter_id = data.get('chapter_id')
    user_id = data.get('user_id', 'anonymous')
    
    # Create unique key for tracking question history - include subject for uniqueness
    if syllabus_id and chapter_id:
        user_key = f"{user_id}_{syllabus_id}_ch{chapter_id}"
    else:
        user_key = f"{user_id}_{subject}_grade{grade}_{interaction_type}"
    
    if user_key not in question_history:
        question_history[user_key] = []
    
    used_hashes = question_history[user_key]
    
    max_attempts = 15
    for attempt in range(max_attempts):
        weak_topics_str = ", ".join(weak_topics) if weak_topics else "general concepts"
        
        if chapter_content:
            prompt = f"""You are an educational game master. Generate a unique {difficulty} {subject} question for grade {grade} students.
Based on this chapter content: {chapter_content[:500]}
IMPORTANT: Generate a DIFFERENT question from any previous ones.
Return ONLY valid JSON: {{ "question": "string", "options": ["option1", "option2", "option3", "option4"], "correct_index": 0-3, "explanation": "string" }}
Make it completely different from any question you've generated before."""
        else:
            # For non-syllabus mode, generate subject-specific questions
            prompt = f"""You are an educational game master. Generate a unique {difficulty} level {subject} question for grade {grade} students. 
This is a {interaction_type} interaction - {'battle against an enemy' if interaction_type == 'enemy' else 'collecting a resource' if interaction_type == 'resource' else 'completing a quest'}.
IMPORTANT: Make this question specifically about {subject} - NOT any other subject.
Make it COMPLETELY DIFFERENT from previous ones.
Prioritize these weak topics if relevant: {weak_topics_str}.
Return ONLY valid JSON: {{ "question": "string", "options": ["option1", "option2", "option3", "option4"], "correct_index": 0-3, "explanation": "string" }}"""

        try:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.9,
                max_tokens=500
            )
            content = response.choices[0].message.content
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                question_data = json.loads(content[json_start:json_end])
            else:
                question_data = get_default_question(subject, difficulty)
            
            q_hash = get_question_hash(question_data.get('question', ''), question_data.get('options', []))
            
            if q_hash not in used_hashes:
                question_history[user_key].append(q_hash)
                return jsonify(question_data)
            
        except Exception as e:
            print(f"Error generating question: {e}")
            return jsonify(get_default_question(subject, difficulty))
    
    # If all attempts failed to generate unique question, clear history and try again
    question_history[user_key] = []
    return jsonify(get_default_question(subject, difficulty))

@app.route('/api/complete-chapter', methods=['POST'])
def complete_chapter():
    data = request.json
    user_id = data.get('user_id', 'anonymous')
    syllabus_id = data.get('syllabus_id')
    chapter_id = data.get('chapter_id')
    chapter_title = data.get('chapter_title', f'Chapter {chapter_id}')
    score = data.get('score', 0)
    total_questions = data.get('total_questions', 0)
    correct_answers = data.get('correct_answers', 0)
    accuracy = data.get('accuracy', 0)
    time_taken = data.get('time_taken', 0)
    mode = data.get('mode', 'syllabus')
    subject = data.get('subject', 'Math')
    grade = data.get('grade', '5')
    
    completion_id = str(uuid.uuid4())
    completion = {
        'id': completion_id,
        'user_id': user_id,
        'syllabus_id': syllabus_id,
        'chapter_id': chapter_id,
        'chapter_title': chapter_title,
        'score': score,
        'total_questions': total_questions,
        'correct_answers': correct_answers,
        'accuracy': accuracy,
        'time_taken': time_taken,
        'mode': mode,
        'subject': subject,
        'grade': grade,
        'completed_at': datetime.now().isoformat()
    }
    
    key = f"{user_id}_{syllabus_id}_{chapter_id}" if syllabus_id else f"{user_id}_{subject}_default"
    chapter_completions[key] = completion
    
    return jsonify({
        'success': True,
        'completion': completion,
        'next_chapter': (chapter_id + 1) if chapter_id else None
    })

@app.route('/api/get-progress', methods=['GET'])
def get_progress():
    user_id = request.args.get('user_id', 'anonymous')
    subject = request.args.get('subject')
    
    user_completions = {k: v for k, v in chapter_completions.items() if v.get('user_id') == user_id}
    
    if subject:
        subject_completions = {k: v for k, v in user_completions.items() if v.get('subject') == subject}
    else:
        subject_completions = user_completions
    
    syllabus_progress = {}
    default_progress = {}
    
    for comp in subject_completions.values():
        if comp.get('mode') == 'syllabus':
            sid = comp.get('syllabus_id', 'unknown')
            if sid not in syllabus_progress:
                syllabus_progress[sid] = []
            syllabus_progress[sid].append({
                'chapter_id': comp.get('chapter_id'),
                'chapter_title': comp.get('chapter_title'),
                'accuracy': comp.get('accuracy', 0),
                'score': comp.get('score', 0)
            })
        else:
            key = f"{comp.get('subject')}_{comp.get('grade')}"
            if key not in default_progress:
                default_progress[key] = {
                    'subject': comp.get('subject'),
                    'grade': comp.get('grade'),
                    'total_score': 0,
                    'sessions': 0,
                    'accuracy': 0
                }
            default_progress[key]['total_score'] += comp.get('score', 0)
            default_progress[key]['sessions'] += 1
    
    return jsonify({
        'syllabus_progress': syllabus_progress,
        'default_progress': default_progress,
        'total_completions': len(subject_completions)
    })

@app.route('/api/get-chapter-progress', methods=['GET'])
def get_chapter_progress():
    user_id = request.args.get('user_id', 'anonymous')
    syllabus_id = request.args.get('syllabus_id')
    
    if not syllabus_id:
        return jsonify({'completed_chapters': [], 'total_chapters': 0})
    
    completed = []
    for key, comp in chapter_completions.items():
        if comp['user_id'] == user_id and comp['syllabus_id'] == syllabus_id:
            completed.append({
                'chapter_id': comp['chapter_id'],
                'chapter_title': comp['chapter_title'],
                'accuracy': comp['accuracy'],
                'score': comp['score']
            })
    
    syllabus = syllabus_storage.get(syllabus_id, {})
    total = len(syllabus.get('chapters', []))
    
    return jsonify({
        'completed_chapters': completed,
        'total_chapters': total
    })

@app.route('/api/generate-world', methods=['POST'])
def generate_world():
    data = request.json
    subject = data.get('subject', 'Math')
    grade = data.get('grade', '5')

    prompt = f"""Generate a Minecraft fantasy world themed around {subject} for grade {grade} students.
Return ONLY valid JSON: {{ "world_name": "string", "biome_description": "string", "enemies": ["enemy1", "enemy2", "enemy3"], "resources": ["resource1", "resource2", "resource3"], "quest_title": "string", "quest_description": "string" }}"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500
        )
        content = response.choices[0].message.content
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            world_data = json.loads(content[json_start:json_end])
        else:
            world_data = get_default_world(subject)
        return jsonify(world_data)
    except Exception as e:
        print(f"Error generating world: {e}")
        return jsonify(get_default_world(subject))

def get_default_world(subject):
    worlds = {
        'Math': {
            "world_name": "Crystal Peaks",
            "biome_description": "A crystalline mountain world filled with geometric shapes and number runes",
            "enemies": ["Subtraction Slime", "Division Dragon", "Fraction Phantom"],
            "resources": ["Number Block", "Shape Crystal", "Equation Ore"],
            "quest_title": "Save the Crystal Kingdom",
            "quest_description": "Solve math problems to unlock the crystal gates and save the kingdom"
        },
        'Science': {
            "world_name": "Neon Lab Zone",
            "biome_description": "A futuristic laboratory world with glowing elements and chemical reactions",
            "enemies": ["Battery Bot", "Molecule Monster", "Gravity Golem"],
            "resources": ["Energy Cell", "Atom Fragment", "DNA Strand"],
            "quest_title": "Power Up the Lab",
            "quest_description": "Answer science questions to generate energy and power the laboratory"
        },
        'History': {
            "world_name": "Ancient Ruins",
            "biome_description": "A world of ancient civilizations and forgotten treasures",
            "enemies": ["Pharaoh's Curse", "Viking Raider", "Knight Specter"],
            "resources": ["Gold Coin", "Ancient Artifact", "Scroll of Wisdom"],
            "quest_title": "Uncover the Past",
            "quest_description": "Solve historical challenges to unlock ancient secrets"
        },
        'Geography': {
            "world_name": "Terra Nova",
            "biome_description": "A beautiful terrain world with mountains, rivers, and diverse biomes",
            "enemies": ["Storm Sprite", "Volcano Giant", "Tornado Spirit"],
            "resources": ["Map Fragment", "Compass Crystal", "Landmark Stone"],
            "quest_title": "Map the World",
            "quest_description": "Answer geography questions to chart new territories"
        },
        'English': {
            "world_name": "Storybook Library",
            "biome_description": "A magical library world where characters come to life from books",
            "enemies": ["Grammar Goblin", "Spelling Spider", "Punctuation Poltergeist"],
            "resources": ["Word Gem", "Story Page", "Magic Quill"],
            "quest_title": "Complete the Story",
            "quest_description": "Solve language challenges to write the final chapter"
        }
    }
    return worlds.get(subject, worlds['Math'])

def get_default_question(subject, difficulty):
    questions = {
        'Math': {
            'easy': {
                "question": "What is 5 + 7?",
                "options": ["10", "11", "12", "13"],
                "correct_index": 2,
                "explanation": "5 + 7 = 12"
            },
            'medium': {
                "question": "What is 24 ÷ 4?",
                "options": ["4", "5", "6", "7"],
                "correct_index": 2,
                "explanation": "24 ÷ 4 = 6"
            },
            'hard': {
                "question": "Solve: 3x + 5 = 20. What is x?",
                "options": ["3", "5", "7", "15"],
                "correct_index": 1,
                "explanation": "3x + 5 = 20 → 3x = 15 → x = 5"
            }
        },
        'Science': {
            'easy': {
                "question": "What gas do plants absorb from the air?",
                "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
                "correct_index": 2,
                "explanation": "Plants absorb carbon dioxide for photosynthesis"
            },
            'medium': {
                "question": "What is the boiling point of water?",
                "options": ["90°C", "100°C", "110°C", "120°C"],
                "correct_index": 1,
                "explanation": "Water boils at 100°C at sea level"
            },
            'hard': {
                "question": "What is the chemical formula for water?",
                "options": ["CO2", "H2O", "NaCl", "O2"],
                "correct_index": 1,
                "explanation": "Water is H2O - two hydrogen atoms and one oxygen"
            }
        }
    }
    
    subject_questions = questions.get(subject, questions['Math'])
    return subject_questions.get(difficulty, subject_questions['medium'])

@app.route('/api/tutor-chat', methods=['POST'])
def tutor_chat():
    data = request.json
    subject = data.get('subject', 'Math')
    grade = data.get('grade', '5')
    message = data.get('message', '')
    chat_history = data.get('chat_history', [])

    history_str = ""
    for msg in chat_history[-5:]:
        role = msg.get('role', 'user')
        history_str += f"{role}: {msg.get('content', '')}\n"

    prompt = f"""You are a warm, encouraging AI tutor for a grade {grade} student learning {subject}.
Keep explanations short, fun, and age-appropriate. Use emojis occasionally.
Be supportive and patient. Previous conversation:
{history_str}
User: {message}
Tutor:"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=300
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        print(f"Error in tutor chat: {e}")
        return jsonify({"reply": "I'm here to help! Ask me anything about " + subject + "!"})

@app.route('/api/analyze-session', methods=['POST'])
def analyze_session():
    data = request.json
    subject = data.get('subject', 'Math')
    grade = data.get('grade', '5')
    wrong_answers = data.get('wrong_answers', [])

    if not wrong_answers:
        return jsonify({"weak_topics": []})

    wrong_str = ", ".join(wrong_answers[:10])

    prompt = f"""A grade {grade} student studying {subject} got these questions wrong: {wrong_str}.
Identify up to 5 weak topic areas. Return ONLY valid JSON: {{ "weak_topics": ["topic1", "topic2", "topic3"] }}"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=300
        )
        content = response.choices[0].message.content
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            result = json.loads(content[json_start:json_end])
        else:
            result = {"weak_topics": []}
        return jsonify(result)
    except Exception as e:
        print(f"Error analyzing session: {e}")
        return jsonify({"weak_topics": []})

@app.route('/api/class-insight', methods=['POST'])
def class_insight():
    data = request.json
    students = data.get('students', [])

    if not students:
        return jsonify({"insight": "No student data available for analysis."})

    student_stats = []
    for s in students[:10]:
        name = s.get('name', 'Student')
        stats = s.get('subject_stats', {})
        weak = s.get('weak_topics', [])
        student_stats.append(f"{name}: {stats}, weak areas: {weak}")

    stats_str = "; ".join(student_stats)

    prompt = f"""Here are stats for a class of students: {stats_str}. 
Write 3-4 sentences of actionable insight for their teacher about common weak areas and suggested next steps.
Return ONLY valid JSON: {{ "insight": "string" }}"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=300
        )
        content = response.choices[0].message.content
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            result = json.loads(content[json_start:json_end])
        else:
            result = {"insight": "Your class is making great progress! Keep up the excellent work."}
        return jsonify(result)
    except Exception as e:
        print(f"Error generating class insight: {e}")
        return jsonify({"insight": "Your class is making great progress! Keep up the excellent work."})

@socketio.on('join_room')
def handle_join_room(data):
    room_code = data.get('room_code')
    username = data.get('username', 'Player')
    user_id = data.get('user_id')
    
    join_room(room_code)
    
    if room_code not in rooms:
        rooms[room_code] = {'players': {}, 'scores': {}}
    
    rooms[room_code]['players'][user_id] = {
        'username': username,
        'score': 0,
        'correct': 0,
        'total': 0
    }
    rooms[room_code]['scores'][user_id] = 0
    
    emit('player_joined', {
        'user_id': user_id,
        'username': username,
        'players': rooms[room_code]['players']
    }, room=room_code)
    
    emit('leaderboard_update', rooms[room_code]['scores'], room=room_code)

@socketio.on('player_answered')
def handle_player_answered(data):
    room_code = data.get('room_code')
    user_id = data.get('user_id')
    correct = data.get('correct', False)
    username = data.get('username', 'Player')
    
    if room_code in rooms and user_id in rooms[room_code]['players']:
        if correct:
            rooms[room_code]['players'][user_id]['score'] += 10
            rooms[room_code]['players'][user_id]['correct'] += 1
        rooms[room_code]['players'][user_id]['total'] += 1
        rooms[room_code]['scores'][user_id] = rooms[room_code]['players'][user_id]['score']
        
        emit('leaderboard_update', rooms[room_code]['scores'], room=room_code, broadcast=True)

@socketio.on('leave_room')
def handle_leave_room(data):
    room_code = data.get('room_code')
    user_id = data.get('user_id')
    
    if room_code in rooms and user_id in rooms[room_code].get('players', {}):
        del rooms[room_code]['players'][user_id]
        if user_id in rooms[room_code].get('scores', {}):
            del rooms[room_code]['scores'][user_id]
    
    leave_room(room_code)
    emit('player_left', {'user_id': user_id}, room=room_code)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
