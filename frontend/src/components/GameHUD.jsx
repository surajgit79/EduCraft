import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

const ENTITY_POSITIONS = {
  'enemy-0': { x: -5, z: -8, label: 'Enemy 1', color: '#FF6B6B' },
  'enemy-1': { x: 8, z: -5, label: 'Enemy 2', color: '#FF6B6B' },
  'enemy-2': { x: -10, z: 5, label: 'Enemy 3', color: '#FF6B6B' },
  'resource-0': { x: 5, z: 5, label: 'Resource 1', color: '#FFD700' },
  'resource-1': { x: -8, z: -3, label: 'Resource 2', color: '#FFD700' },
  'resource-2': { x: 12, z: -10, label: 'Resource 3', color: '#FFD700' },
  'npc-teacher': { x: 0, z: -15, label: 'Quest Giver', color: '#ffffff' }
}

export default function GameHUD({ stats, subject, grade, roomCode, onExit, onChat, isMultiplayer, multiplayerPlayers, mode, chapter }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const { attemptedEntities } = useGameStore()
  
  const xpForNextLevel = (stats.level) * 100
  const xpProgress = (stats.xp % 100)

  const getActiveEntities = () => {
    const chapterPrefix = chapter || 'default'
    return Object.entries(ENTITY_POSITIONS)
      .filter(([id]) => !attemptedEntities.includes(`${chapterPrefix}-${id}`))
      .map(([id, data]) => ({ id: `${chapterPrefix}-${id}`, baseId: id, ...data }))
  }

  const activeEntities = getActiveEntities()
  const attemptedCount = Object.keys(ENTITY_POSITIONS).length - activeEntities.length
  const totalCount = Object.keys(ENTITY_POSITIONS).length

  const getLeaderboardData = () => {
    if (!multiplayerPlayers || Object.keys(multiplayerPlayers).length === 0) {
      return []
    }
    return Object.values(multiplayerPlayers)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
  }

  const leaderboard = getLeaderboardData()

  return (
    <>
      <div className="fixed top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <div className="bg-[#2a2a4e]/90 pixel-border p-3 min-w-[200px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">HP</span>
              <span className="text-xs text-white">{stats.hp}/100</span>
            </div>
            <div className="w-full h-3 bg-[#1a1a2e] border border-black">
              <div 
                className={`h-full transition-all ${stats.hp > 50 ? 'bg-green-500' : stats.hp > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${stats.hp}%` }}
              />
            </div>
          </div>

          <div className="bg-[#2a2a4e]/90 pixel-border p-3 mt-2 min-w-[200px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">XP</span>
              <span className="text-xs text-white">{stats.xp}</span>
            </div>
            <div className="w-full h-3 bg-[#1a1a2e] border border-black">
              <div 
                className="h-full bg-[#FFD700] transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Level {stats.level}</div>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="bg-[#2a2a4e]/90 pixel-border p-2 flex items-center gap-2">
            <span className="text-xs bg-[#4CAF50] px-2 py-1">{subject}</span>
            <span className="text-xs text-gray-400">Grade {grade}</span>
          </div>
          
          {mode && (
            <div className="bg-[#2a2a4e]/90 pixel-border p-2">
              <span className="text-xs text-gray-400">Mode: </span>
              <span className="text-xs text-[#2196F3]">{mode === 'syllabus' ? '📚 Syllabus' : '🎮 Default'}</span>
              {mode === 'syllabus' && chapter && (
                <span className="text-xs text-gray-400 ml-1">| Ch.{chapter}</span>
              )}
            </div>
          )}
          
          {roomCode && (
            <div className="bg-[#2a2a4e]/90 pixel-border p-2">
              <span className="text-xs text-gray-400">Room: </span>
              <span className="text-xs text-[#FFD700]">{roomCode}</span>
            </div>
          )}

          {isMultiplayer && leaderboard.length > 0 && (
            <button
              onClick={() => setShowLeaderboard(true)}
              className="bg-[#9C27B0] pixel-border px-3 py-2 text-xs"
            >
              🏆 Leaderboard
            </button>
          )}

          <button
            onClick={() => setShowInstructions(true)}
            className="bg-[#2196F3] pixel-border px-3 py-2 text-xs"
          >
            ? Help
          </button>

          <button
            onClick={onChat}
            className="bg-[#4CAF50] pixel-border px-3 py-2 text-xs"
          >
            AI Tutor
          </button>

          <button
            onClick={() => setShowMenu(true)}
            className="bg-[#2a2a4e]/90 pixel-border px-3 py-2 text-xs"
          >
            ☰ Menu
          </button>
        </div>
      </div>

      {activeEntities.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-[#2a2a4e]/90 pixel-border px-4 py-2">
            <div className="text-center mb-2">
              <span className="text-xs text-gray-400">Quests: </span>
              <span className="text-xs text-[#4CAF50]">{attemptedCount}/{totalCount}</span>
            </div>
            <div className="flex gap-3">
              {activeEntities.map((entity) => (
                <div
                  key={entity.id}
                  className="flex items-center gap-1"
                  style={{ color: entity.color }}
                >
                  <span className="text-xs">○</span>
                  <span className="text-[10px]">{entity.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#2a2a4e] p-6 pixel-border text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg text-white mb-4 text-shadow">Game Menu</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between gap-8 text-xs">
                  <span className="text-gray-400">Questions:</span>
                  <span className="text-white">{stats.totalQuestions}</span>
                </div>
                <div className="flex justify-between gap-8 text-xs">
                  <span className="text-gray-400">Correct:</span>
                  <span className="text-green-500">{stats.correctAnswers}</span>
                </div>
                <div className="flex justify-between gap-8 text-xs">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="text-white">
                    {stats.totalQuestions > 0 
                      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between gap-8 text-xs">
                  <span className="text-gray-400">XP Earned:</span>
                  <span className="text-[#FFD700]">{stats.xp}</span>
                </div>
              </div>

              <button
                onClick={onExit}
                className="pixel-button w-full"
              >
                Exit to Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#2a2a4e] p-6 pixel-border max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg text-white mb-4 text-shadow text-center">How to Play</h2>
              
              <div className="space-y-4 text-xs text-gray-300">
                <div className="bg-[#1a1a2e] p-3 rounded">
                  <h3 className="text-[#4CAF50] font-bold mb-2">Movement</h3>
                  <p>Use <span className="text-[#FFD700]">W A S D</span> keys to move around the world.</p>
                  <p className="mt-1">Click on the game to lock your cursor and start playing.</p>
                </div>

                <div className="bg-[#1a1a2e] p-3 rounded">
                  <h3 className="text-[#FF6B6B] font-bold mb-2">Enemies</h3>
                  <p>Click on floating <span className="text-[#FF6B6B]">red enemies</span> to fight them by answering questions.</p>
                  <p className="mt-1">Correct answers damage the enemy. Wrong answers cost you HP!</p>
                </div>

                <div className="bg-[#1a1a2e] p-3 rounded">
                  <h3 className="text-[#FFD700] font-bold mb-2">Resources</h3>
                  <p>Collect <span className="text-[#FFD700]">gold blocks</span> for bonus XP by clicking on them.</p>
                  <p className="mt-1">No questions required - just walk up and collect!</p>
                </div>

                <div className="bg-[#1a1a2e] p-3 rounded">
                  <h3 className="text-[#2196F3] font-bold mb-2">Quest Giver</h3>
                  <p>Find the <span className="text-white">white NPC</span> with "!" to get new quests and questions.</p>
                </div>

                <div className="bg-[#1a1a2e] p-3 rounded">
                  <h3 className="text-[#a855f7] font-bold mb-2">Goal</h3>
                  <p>Answer questions correctly to earn XP and level up!</p>
                  <p className="mt-1">Don't let your HP reach 0 or it's Game Over.</p>
                </div>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="pixel-button w-full mt-4"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setShowLeaderboard(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#2a2a4e] p-6 pixel-border max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg text-white mb-4 text-shadow text-center">🏆 Leaderboard</h2>
              
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div 
                    key={player.id} 
                    className={`flex justify-between items-center p-2 rounded ${
                      index === 0 ? 'bg-yellow-600/30' : 
                      index === 1 ? 'bg-gray-400/30' : 
                      index === 2 ? 'bg-orange-600/30' : 'bg-[#1a1a2e]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </span>
                      <span className="text-xs text-white">{player.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#FFD700]">{player.score || 0} pts</span>
                      <div className="text-[10px] text-gray-400">
                        HP: {player.hp || 0} | Lv.{player.level || 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowLeaderboard(false)}
                className="pixel-button w-full mt-4"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
