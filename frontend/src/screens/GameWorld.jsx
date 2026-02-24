import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, Sky, Text, Float } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import QuestionModal from '../components/QuestionModal'
import AITutorChat from '../components/AITutorChat'
import GameHUD from '../components/GameHUD'
import ChapterResult from '../components/ChapterResult'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { GAME_CONFIG } from '../constants/gameConstants'

const subjectColors = {
  Math: { primary: '#06b6d4', secondary: '#0ea5e9' },
  Science: { primary: '#10b981', secondary: '#059669' },
  History: { primary: '#f59e0b', secondary: '#d97706' },
  Geography: { primary: '#0891b2', secondary: '#0e7490' },
  English: { primary: '#a855f7', secondary: '#9333ea' }
}

function Player({ position }) {
  const { camera } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const moveForward = useRef(false)
  const moveBackward = useRef(false)
  const moveLeft = useRef(false)
  const moveRight = useRef(false)

  useEffect(() => {
    const onKeyDown = (event) => {
      switch (event.code) {
        case 'KeyW': moveForward.current = true; break
        case 'KeyA': moveLeft.current = true; break
        case 'KeyS': moveBackward.current = true; break
        case 'KeyD': moveRight.current = true; break
      }
    }
    const onKeyUp = (event) => {
      switch (event.code) {
        case 'KeyW': moveForward.current = false; break
        case 'KeyA': moveLeft.current = false; break
        case 'KeyS': moveBackward.current = false; break
        case 'KeyD': moveRight.current = false; break
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    const speed = 10
    const friction = 0.9
    direction.current.z = Number(moveForward.current) - Number(moveBackward.current)
    direction.current.x = Number(moveRight.current) - Number(moveLeft.current)
    direction.current.normalize()

    if (moveForward.current || moveBackward.current) {
      velocity.current.z = direction.current.z * speed * delta
    }
    if (moveLeft.current || moveRight.current) {
      velocity.current.x = direction.current.x * speed * delta
    }

    if (!moveForward.current && !moveBackward.current) {
      velocity.current.z *= friction
    }
    if (!moveLeft.current && !moveRight.current) {
      velocity.current.x *= friction
    }

    camera.translateX(velocity.current.x)
    camera.translateZ(-velocity.current.z)
    
    camera.position.y = 2
  })

  return null
}

function Voxel({ position, color, scale = [1, 1, 1] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={scale} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}

function Terrain({ subject }) {
  const colors = subjectColors[subject] || subjectColors.Math
  const blocks = []
  
  for (let x = -20; x < 20; x += 2) {
    for (let z = -20; z < 20; z += 2) {
      const height = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 2
      blocks.push(
        <Voxel 
          key={`${x}-${z}`} 
          position={[x, height, z]} 
          color={colors.primary}
          scale={[1.9, 1 + height, 1.9]}
        />
      )
      if (height < 0) {
        blocks.push(
          <Voxel 
            key={`under-${x}-${z}`} 
            position={[x, height - 1, z]} 
            color="#1a1a2e"
            scale={[1.9, 1, 1.9]}
          />
        )
      }
    }
  }

  return <group>{blocks}</group>
}

function Enemy({ position, name, onInteract, colors, isCompleted, entityId }) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current && !isCompleted) {
      meshRef.current.rotation.y += 0.02
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2
    }
  })

  if (isCompleted) {
    return (
      <group position={position}>
        <mesh>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color="#1a1a1a" transparent opacity={0.9} />
        </mesh>
        <Text
          position={[0, 1.8, 0]}
          fontSize={0.3}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          DONE
        </Text>
      </group>
    )
  }

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh
          ref={meshRef}
          onClick={onInteract}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color={hovered ? '#ff6b6b' : colors.primary} 
            emissive={hovered ? '#ff0000' : '#000000'}
            emissiveIntensity={0.5}
          />
        </mesh>
      </Float>
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
      {hovered && (
        <Text
          position={[0, 2, 0]}
          fontSize={0.2}
          color="#ffff00"
          anchorX="center"
          anchorY="middle"
        >
          Click to fight!
        </Text>
      )}
    </group>
  )
}

function ResourceBlock({ position, name, onInteract, colors, isCompleted }) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current && !isCompleted) {
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.01
    }
  })

  if (isCompleted) {
    return (
      <group position={position}>
        <mesh>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color="#1a1a1a" transparent opacity={0.9} />
        </mesh>
        <Text
          position={[0, 1, 0]}
          fontSize={0.2}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          DONE
        </Text>
      </group>
    )
  }

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onInteract}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color={hovered ? '#ffd700' : colors.secondary}
          emissive={hovered ? '#ffd700' : '#000000'}
          emissiveIntensity={0.3}
        />
      </mesh>
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  )
}

function TeacherNPC({ position, onInteract, colors, isCompleted }) {
  const [hovered, setHovered] = useState(false)
  
  if (isCompleted) {
    return (
      <group position={position}>
        <mesh>
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.4, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.4}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          Done
        </Text>
      </group>
    )
  }

  return (
    <group position={position}>
      <mesh
        onClick={onInteract}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.15, 1.4, 0.35]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[0.15, 1.4, 0.35]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.4}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        !
      </Text>
      <Text
        position={[0, 2.8, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Quest Giver
      </Text>
    </group>
  )
}

function GameScene({ subject, worldData, onEntityInteract, completedEntities, chapterPrefix = 'default' }) {
  const colors = subjectColors[subject] || subjectColors.Math
  
  const enemies = worldData?.enemies || ['Math Monster', 'Number Ninja', 'Equation Dragon']
  const resources = worldData?.resources || ['Gold Block', 'XP Crystal', 'Star Gem']

  const isCompleted = (id) => completedEntities.includes(`${chapterPrefix}-${id}`)

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-5, 10, -5]} intensity={0.5} />
      
      <Terrain subject={subject} />
      
      <Enemy 
        position={[-5, 2, -8]} 
        name={enemies[0]} 
        onInteract={() => onEntityInteract('enemy', enemies[0])}
        colors={colors}
        isCompleted={isCompleted('enemy-0')}
        entityId="enemy-0"
      />
      <Enemy 
        position={[8, 2, -5]} 
        name={enemies[1]} 
        onInteract={() => onEntityInteract('enemy', enemies[1])}
        colors={colors}
        isCompleted={isCompleted('enemy-1')}
        entityId="enemy-1"
      />
      <Enemy 
        position={[-10, 2, 5]} 
        name={enemies[2]} 
        onInteract={() => onEntityInteract('enemy', enemies[2])}
        colors={colors}
        isCompleted={isCompleted('enemy-2')}
        entityId="enemy-2"
      />

      <ResourceBlock 
        position={[5, 1.5, 5]} 
        name={resources[0]} 
        onInteract={() => onEntityInteract('resource', resources[0])}
        colors={colors}
        isCompleted={isCompleted('resource-0')}
      />
      <ResourceBlock 
        position={[-8, 1.5, -3]} 
        name={resources[1]} 
        onInteract={() => onEntityInteract('resource', resources[1])}
        colors={colors}
        isCompleted={isCompleted('resource-1')}
      />
      <ResourceBlock 
        position={[12, 1.5, -10]} 
        name={resources[2]} 
        onInteract={() => onEntityInteract('resource', resources[2])}
        colors={colors}
        isCompleted={isCompleted('resource-2')}
      />

      <TeacherNPC 
        position={[0, 0, -15]} 
        onInteract={() => onEntityInteract('npc', 'Teacher')}
        colors={colors}
        isCompleted={isCompleted('npc-teacher')}
      />

      <Player />
      <PointerLockControls />
    </>
  )
}

export default function GameWorld() {
  const navigate = useNavigate()
  const { user, userData } = useAuthStore()
  const { 
    worldData, 
    sessionData, 
    playerStats, 
    showQuestion, 
    setShowQuestion,
    saveSession,
    resetGame,
    resetPlayerStats,
    loadWeakTopics,
    completedEntities,
    attemptedEntities,
    markEntityCompleted,
    addXp,
    addScore,
    setMultiplayerPlayers,
    gameStarted,
    setGameStarted,
    isMultiplayer,
    setCurrentChapter,
    syllabusData,
    setSession
  } = useGameStore()

  const [showChat, setShowChat] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [showChapterResult, setShowChapterResult] = useState(false)
  const [chapterStartTime, setChapterStartTime] = useState(Date.now())

  const isCompetitive = sessionData?.mode === 'competitive' || sessionData?.mode === 'co-op'
  const roomCode = sessionData?.roomCode
  
  const hasSyllabus = sessionData?.syllabusId && sessionData?.chapterId

  const {
    players,
    connectionStatus,
    updatePlayerStats,
    startGame,
    leaveRoom,
    getLeaderboard
  } = useMultiplayer(
    isCompetitive && roomCode ? roomCode : null,
    user?.uid,
    userData?.name || user?.displayName || 'Player'
  )

  useEffect(() => {
    if (players && Object.keys(players).length > 0) {
      setMultiplayerPlayers(players)
    }
  }, [players, setMultiplayerPlayers])

  useEffect(() => {
    if (isCompetitive && roomCode && connectionStatus === 'connected' && !gameStarted) {
      setGameStarted(true)
    }
  }, [connectionStatus, gameStarted, isCompetitive, roomCode, setGameStarted])

  useEffect(() => {
    if (isCompetitive && connectionStatus !== 'demo') {
      const syncStats = async () => {
        await updatePlayerStats({
          hp: playerStats.hp,
          xp: playerStats.xp,
          level: playerStats.level,
          score: playerStats.score,
          correctAnswers: playerStats.correctAnswers,
          totalQuestions: playerStats.totalQuestions
        })
      }
      syncStats()
    }
  }, [playerStats, isCompetitive, connectionStatus, updatePlayerStats])

  useEffect(() => {
    return () => {
      if (isCompetitive && leaveRoom) {
        leaveRoom()
      }
    }
  }, [])

  useEffect(() => {
    if (user?.uid && sessionData?.subject) {
      loadWeakTopics(user.uid, sessionData.subject)
    }
  }, [user, sessionData])

  const getChapterPrefix = () => sessionData?.chapterId || 'default'
  
  const ALL_ENTITIES = ['enemy-0', 'enemy-1', 'enemy-2', 'resource-0', 'resource-1', 'resource-2', 'npc-teacher']
  const ALL_ENEMIES = ['enemy-0', 'enemy-1', 'enemy-2']
  const REQUIRED_ENEMIES = 3

  const checkAllQuestsCompleted = () => {
    const chapterPrefix = getChapterPrefix()
    const chapterEntities = ALL_ENTITIES.map(e => `${chapterPrefix}-${e}`)
    const completed = chapterEntities.filter(e => completedEntities.includes(e))
    return completed.length === chapterEntities.length
  }
  
  const getCompletedCount = () => {
    const chapterPrefix = getChapterPrefix()
    const chapterEntities = ALL_ENTITIES.map(e => `${chapterPrefix}-${e}`)
    return chapterEntities.filter(e => completedEntities.includes(e)).length
  }
  
  const handleEntityInteract = (type, name) => {
    const enemies = worldData?.enemies || ['Math Monster', 'Number Ninja', 'Equation Dragon']
    const resources = worldData?.resources || ['Gold Block', 'XP Crystal', 'Star Gem']
    const chapterPrefix = getChapterPrefix()
    
    let entityId
    if (type === 'enemy') {
      const idx = enemies.indexOf(name)
      entityId = `${chapterPrefix}-enemy-${idx >= 0 ? idx : 0}`
    } else if (type === 'resource') {
      const idx = resources.indexOf(name)
      entityId = `${chapterPrefix}-resource-${idx >= 0 ? idx : 0}`
    } else {
      entityId = `${chapterPrefix}-npc-teacher`
    }
    
    if (attemptedEntities.includes(entityId)) {
      return
    }
    
    setShowQuestion(true, { type, name, entityId })
  }

  useEffect(() => {
    if (!showQuestion && attemptedEntities.length > 0) {
      const chapterPrefix = getChapterPrefix()
      const chapterEntities = ALL_ENTITIES.map(e => `${chapterPrefix}-${e}`)
      const allAttempted = chapterEntities.every(e => attemptedEntities.includes(e))
      
      if (allAttempted) {
        checkChapterCompletion()
      }
    }
  }, [attemptedEntities, showQuestion])

  const checkChapterCompletion = useCallback(async () => {
    const chapterPrefix = getChapterPrefix()
    const chapterEntities = ALL_ENTITIES.map(e => `${chapterPrefix}-${e}`)
    const allAttempted = chapterEntities.every(e => attemptedEntities.includes(e))
    
    if (allAttempted) {
      const timeTaken = Math.round((Date.now() - chapterStartTime) / 1000)
      const accuracy = playerStats.totalQuestions > 0 
        ? Math.round((playerStats.correctAnswers / playerStats.totalQuestions) * 100)
        : 0
      
      try {
        const response = await fetch('/api/complete-chapter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.uid || 'anonymous',
            syllabus_id: sessionData?.syllabusId,
            chapter_id: sessionData?.chapterId,
            chapter_title: sessionData?.chapterTitle || `Chapter ${sessionData?.chapterId}`,
            score: playerStats.score || playerStats.xp,
            total_questions: playerStats.totalQuestions,
            correct_answers: playerStats.correctAnswers,
            accuracy: accuracy,
            time_taken: timeTaken,
            mode: sessionData?.mode || 'default',
            subject: sessionData?.subject,
            grade: sessionData?.grade
          })
        })
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      } catch (error) {
        console.error('Error saving chapter completion:', error)
      }
      
      setShowChapterResult(true)
    }
  }, [attemptedEntities, chapterStartTime, playerStats, sessionData, user])

  const handleContinueToNextChapter = () => {
    const nextChapter = (sessionData?.chapterId || 0) + 1
    
    setShowChapterResult(false)
    
    // Update session with next chapter
    const chapter = syllabusData?.chapters?.find(c => c.id === nextChapter)
    setSession({
      ...sessionData,
      chapterId: nextChapter,
      chapterTitle: chapter?.title || `Chapter ${nextChapter}`,
      chapterContent: chapter?.content || ''
    })
    
    // Reset chapter start time for new chapter
    setChapterStartTime(Date.now())
    
    // Reset only player stats, keep syllabus data
    resetPlayerStats()
    
    navigate('/game')
  }

  const handleExitToHome = () => {
    setShowChapterResult(false)
    resetGame()
    navigate('/home')
  }

  const handleExit = async () => {
    setExiting(true)
    if (user?.uid && sessionData) {
      await saveSession(user.uid, sessionData.subject, sessionData.grade, sessionData.mode)
    }
    resetGame()
    navigate('/home')
  }

  if (playerStats.hp <= 0) {
    return (
      <div className="h-screen bg-[#1a1a2e] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <h1 className="text-4xl text-red-500 mb-4 text-shadow">Game Over!</h1>
          <p className="text-gray-400 mb-4">You ran out of health</p>
          <button onClick={handleExit} className="pixel-button">
            Return Home
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen relative">
      <Canvas camera={{ position: [0, 2, 5], fov: 75 }}>
        <Suspense fallback={null}>
          <GameScene 
            subject={sessionData?.subject || 'Math'}
            worldData={worldData}
            onEntityInteract={handleEntityInteract}
            completedEntities={completedEntities}
            chapterPrefix={sessionData?.chapterId || 'default'}
          />
        </Suspense>
      </Canvas>

      <GameHUD 
        stats={playerStats}
        subject={sessionData?.subject}
        grade={sessionData?.grade}
        roomCode={sessionData?.roomCode}
        onExit={handleExit}
        onChat={() => setShowChat(!showChat)}
        isMultiplayer={isCompetitive}
        multiplayerPlayers={players}
        mode={sessionData?.mode}
        chapter={sessionData?.chapterId}
      />

      <AnimatePresence>
        {showQuestion && (
          <QuestionModal />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChat && (
          <AITutorChat onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>

      {exiting && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white">Saving progress...</div>
        </div>
      )}

      <AnimatePresence>
        {showChapterResult && (
          <ChapterResult
            results={{
              chapterTitle: sessionData?.chapterTitle || `Chapter ${sessionData?.chapterId}`,
              score: playerStats.score || playerStats.xp,
              totalQuestions: playerStats.totalQuestions,
              correctAnswers: playerStats.correctAnswers,
              accuracy: playerStats.totalQuestions > 0 
                ? Math.round((playerStats.correctAnswers / playerStats.totalQuestions) * 100)
                : 0,
              nextChapter: (sessionData?.chapterId || 0) + 1,
              hasMoreChapters: sessionData?.mode === 'syllabus' && syllabusData && (sessionData?.chapterId || 0) < syllabusData.totalChapters,
              mode: sessionData?.mode || 'default',
              subject: sessionData?.subject
            }}
            onContinue={handleContinueToNextChapter}
            onExit={handleExitToHome}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
