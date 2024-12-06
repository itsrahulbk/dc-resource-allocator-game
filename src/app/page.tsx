"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Plus, Minus, X, Volume2, VolumeX, Zap, Trophy, Play } from 'lucide-react'

const heroes = [
  { 
    name: 'Batman', 
    weapon: 'Power Gun', 
    characterImage: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Batman-LCb0LFwMXTlsrrPq7Iuq1wHGXbGGyL.webp',
    powerUpImage: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gun%20for%20cyborg-rNf8B2doqchcBkTjfuk9za6Q9G5Uss.png'
  },
  { 
    name: 'Wonder Woman', 
    weapon: 'Power Gun', 
    characterImage: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Wonder_Woman-ldFisGWacVN2HWyVniM2I80IBl8MvE.webp',
    powerUpImage: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gun%20for%20cyborg-rNf8B2doqchcBkTjfuk9za6Q9G5Uss.png'
  },
  { 
    name: 'Superman', 
    weapon: 'Power Gun', 
    characterImage: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SupermanJLU-2.jpg-TY2SVe8Vcf1dfeRPZk1XBy06YnwhjM.png',
    powerUpImage: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gun%20for%20cyborg-rNf8B2doqchcBkTjfuk9za6Q9G5Uss.png'
  }
]

export default function Component() {
  const [gameState, setGameState] = useState('start') // 'start', 'intro', 'playing', 'win-video', 'won', 'lost'
  const [availableResources, setAvailableResources] = useState(0)
  const [allocations, setAllocations] = useState([0, 0, 0])
  const [message, setMessage] = useState('')
  const [showLosePopup, setShowLosePopup] = useState(false)
  const [timer, setTimer] = useState(60)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showInstructions, setShowInstructions] = useState(false)
  const [highScores, setHighScores] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const introVideoRef = useRef(null)
  const winVideoRef = useRef(null)
  const loseVideoRef = useRef(null)
  const loseAudioRef = useRef(null)

  const playSound = useCallback((sound: string) => {
    if (soundEnabled) {
      const audio = new Audio(`/sounds/${sound}.mp3`)
      audio.play().catch(error => console.error('Error playing sound:', error))
    }
  }, [soundEnabled])

  useEffect(() => {
    const storedHighScores = localStorage.getItem('highScores')
    if (storedHighScores) {
      setHighScores(JSON.parse(storedHighScores))
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameState === 'playing' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1)
      }, 1000)
    } else if (timer === 0 && gameState === 'playing') {
      handleGameOver()
    }
    return () => clearInterval(interval)
  }, [gameState, timer, handleGameOver])

  useEffect(() => {
    if (gameState === 'intro' && introVideoRef.current) {
      introVideoRef.current.play().catch(error => console.error('Error playing intro video:', error))
    }
  }, [gameState])

  useEffect(() => {
    if (gameState === 'win-video' && winVideoRef.current) {
      winVideoRef.current.play().catch(error => console.error('Error playing win video:', error))
    }
  }, [gameState])

  useEffect(() => {
    if (showLosePopup) {
      if (loseVideoRef.current) {
        loseVideoRef.current.play().catch(error => console.error('Error playing lose video:', error))
      }
      if (loseAudioRef.current) {
        loseAudioRef.current.play().catch(error => console.error('Error playing lose audio:', error))
      }
    }
  }, [showLosePopup])

  useEffect(() => {
    if (gameState === 'playing') {
      resetGame() // This ensures the game starts with proper values after the intro video
    }
  }, [gameState])


  const handleStartGame = () => {
    setGameState('intro')
  }

  const handleStartMission = () => {
    setGameState('playing')
    resetGame()
  }

  const resetGame = () => {
    setAvailableResources(Math.max(1, Math.floor(Math.random() * 16) + 3)) // Ensures minimum of 1 powerup
    setAllocations([0, 0, 0])
    setMessage('')
    setShowLosePopup(false)
    setTimer(60)
  }

  const handleAllocation = (index: number, change: number) => {
    playSound('click')
    const newAllocations = [...allocations]
    const newValue = Math.max(0, newAllocations[index] + change)
    newAllocations[index] = newValue
    setAllocations(newAllocations)
  }

  const checkAllocation = () => {
    const totalAllocation = allocations.reduce((sum, current) => sum + current, 0)
    if (totalAllocation > availableResources || allocations.some(allocation => allocation === 0)) {
      handleGameOver()
    } else {
      handleLevelComplete(totalAllocation)
    }
  }

  const handleGameOver = () => {
    setGameState('lost')
    setMessage(allocations.some(allocation => allocation === 0)
    ? 'Mission failed! All heroes must have at least one power-up!'
    : `Deadlock formed! You allocated ${allocations.reduce((a, b) => a + b, 0)} power-ups, but only ${availableResources} were available.`)
    updateHighScores(score)
    setShowLosePopup(true)
    setLevel(1)
    if (loseVideoRef.current) {
      loseVideoRef.current.play().catch(error => console.error('Error playing lose video:', error))
    }
    if (loseAudioRef.current) {
      loseAudioRef.current.play().catch(error => console.error('Error playing lose audio:', error))
    }
  }

  const handleLevelComplete = (totalAllocation: number) => {
    setGameState('win-video')
    const levelScore = calculateScore(totalAllocation)
    setScore((prevScore) => prevScore + levelScore)
    setMessage(`Level ${level} complete! You allocated ${totalAllocation} out of ${availableResources} power-ups. Score: ${levelScore}`)
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  const handleNextLevel = () => {
    setLevel((prevLevel) => prevLevel + 1)
    setGameState('playing')
    resetGame()
  }

  const calculateScore = (totalAllocation: number) => {
    const efficiency = totalAllocation / availableResources
    const timeBonus = Math.max(0, timer)
    return Math.round((efficiency * 1000) + timeBonus)
  }

  const updateHighScores = (newScore: number) => {
    const updatedHighScores = [...highScores, { score: newScore, level: level }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
    setHighScores(updatedHighScores)
    localStorage.setItem('highScores', JSON.stringify(updatedHighScores))
  }

  const startNewMission = () => {
    setScore(0)
    setLevel(1)
    resetGame()
    setGameState('playing')
  }

  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-white mb-8">DC Super Squad Resource Allocator</h1>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            onClick={handleStartGame}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xl px-8 py-6"
          >
            <Play className="mr-2 h-6 w-6" />
            Start Game
          </Button>
        </motion.div>
      </div>
    )
  }

  if (gameState === 'intro') {
    return (
      <div className="fixed inset-0 bg-black">
        <video
          ref={introVideoRef}
          className="w-full h-full object-cover"
          onEnded={() => setGameState('playing')}
        >
          <source src="/intro.mp4" type="video/mp4" />
        </video>
        <Button
          onClick={handleStartMission}
          size="lg"
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Start Mission
        </Button>
      </div>
    )
  }

  if (gameState === 'win-video') {
    return (
      <div className="fixed inset-0 bg-black">
        <video
          ref={winVideoRef}
          className="w-full h-full object-cover"
          onEnded={() => setGameState('won')}
        >
          <source src="/win.mp4" type="video/mp4" />
        </video>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          <Button
            onClick={startNewMission}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Restart
          </Button>
          <Button
            onClick={handleNextLevel}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Next Level
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      <div className="container mx-auto flex-grow">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-center">DC Super Squad Resource Allocator</h1>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowInstructions(true)}
              variant="outline"
              size="sm"
              className="text-blue-400 hover:text-blue-300 border-blue-400"
            >
              How to Play
            </Button>
            <Button
              onClick={() => setShowLeaderboard(true)}
              variant="outline"
              size="sm"
              className="text-yellow-400 hover:text-yellow-300 border-yellow-400"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </Button>
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="ghost"
              size="icon"
              className="text-blue-400 hover:text-blue-300"
            >
              {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        <Card className="max-w-4xl mx-auto bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-blue-400">Justice League HQ - Level {level}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-semibold text-gray-300"
              >
                Available Power-Ups: 
                <motion.span 
                  key={availableResources}
                  initial={{ scale: 1.5, color: "#ff00ff" }}
                  animate={{ scale: 1, color: "#4299e1" }}
                  className="ml-2 text-blue-400"
                >
                  {availableResources}
                </motion.span>
              </motion.div>
              <motion.div 
                className="text-2xl font-semibold text-gray-300"
                animate={{ scale: timer <= 10 ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: timer <= 10 ? Infinity : 0, duration: 0.5 }}
              >
                Time: <span className={`text-blue-400 ${timer <= 10 ? 'text-red-500' : ''}`}>{timer}s</span>
              </motion.div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {heroes.map((hero, index) => (
                <motion.div 
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative w-32 h-32 mb-2">
                    <motion.img 
                      src={hero.characterImage} 
                      alt={hero.name} 
                      className="w-full h-full rounded-full border-4 border-blue-500 object-cover"
                      animate={{ rotate: allocations[index] > 0 ? [0, 5, -5, 0] : 0 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <motion.img 
                      src={hero.powerUpImage} 
                      alt={`${hero.name}'s ${hero.weapon}`} 
                      className="absolute bottom-0 right-0 w-16 h-16 rounded-full border-2 border-yellow-400 object-cover bg-gray-700"
                      animate={{ scale: allocations[index] > 0 ? [1, 1.1, 1] : 1 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-1 text-blue-300">{hero.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{hero.weapon}</p>
                  <div className="flex items-center space-x-2">
                    <Button 
                      onClick={() => handleAllocation(index, -1)} 
                      variant="outline" 
                      size="icon"
                      className="bg-gray-700 text-blue-400 border-blue-500 hover:bg-gray-600"
                      disabled={allocations[index] === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <motion.span 
                      key={allocations[index]}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-blue-400 w-12 text-center"
                    >
                      {allocations[index]}
                    </motion.span>
                    <Button 
                      onClick={() => handleAllocation(index, 1)} 
                      variant="outline" 
                      size="icon"
                      className="bg-gray-700 text-blue-400 border-blue-500 hover:bg-gray-600"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 flex justify-center space-x-4">
              <Button 
                onClick={checkAllocation} 
                disabled={gameState !== 'playing'} 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Zap className="mr-2 h-4 w-4" />
                Power Up Squad!
              </Button>
              <Button onClick={resetGame} variant="outline" size="lg" className="border-blue-500 text-blue-400 hover:bg-gray-700">
                Reset Level
              </Button>
            </div>
            <AnimatePresence>
              {message && gameState === 'won' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mt-6 p-4 rounded-md flex items-center justify-center text-lg bg-green-800 text-green-200"
                >
                  <CheckCircle2 className="mr-2" size={24} />
                  {message}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        <Card className="max-w-4xl mx-auto mt-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-400">Game Stats</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="flex justify-between items-center">
              <p>Current Level: {level}</p>
              <p>Total Score: {score}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Lose Popup */}
        <AnimatePresence>
          {showLosePopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black flex items-center justify-center z-50"
            >
              <video
                ref={loseVideoRef}
                className="absolute inset-0 w-full h-full object-cover"
                loop
              >
                <source src="/explosion.mp4" type="video/mp4" />
              </video>
              <audio ref={loseAudioRef} src="/sounds/lose.mp3" />
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="bg-gray-800 bg-opacity-90 p-8 rounded-lg max-w-2xl w-full m-4 relative z-10"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-red-500">Mission Failed</h2>
                  <Button
                    onClick={() => setShowLosePopup(false)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <p className="text-gray-300 mb-6">
                  {allocations.some(allocation => allocation === 0)
                    ? 'Mission failed! All heroes must have at least one power-up!'
                    : `Deadlock formed! You allocated ${allocations.reduce((a, b) => a + b, 0)} power-ups, but only ${availableResources} were available.`}
                </p>
                <p className="text-gray-300 mb-6">Final Score: {score}</p>
                <div className="flex justify-center">
                  <Button onClick={startNewMission} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    New Mission
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How to Play Instructions */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="bg-gray-800 p-8 rounded-lg max-w-2xl w-full m-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-blue-400">How to Play</h2>
                  <Button
                    onClick={() => setShowInstructions(false)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                  <li>The Justice League needs your help to allocate power-ups!</li>
                  <li>You have 60 seconds to complete each level.</li>
                  <li>Use the + and - buttons to give each hero their share of power-ups.</li>
                  <li>Be careful! You'll lose if you allocate more than the available power-ups or if any hero gets zero power-ups.</li>
                  <li>Hit the "Power Up Squad!" button when you're ready to check your allocation.</li>
                  <li>Avoid deadlocks to lead the Justice League to victory!</li>
                  <li>Complete levels to increase your score and face tougher challenges.</li>
                  <li>If you lose, the game resets to level 1. Try to beat your high score!</li>
                </ol>
                <p className="mt-4 text-sm text-gray-400">
                  Be a strategic coordinator! Distribute the power-ups wisely to make your Super Squad unstoppable!
                </p>
                <div className="mt-6 flex justify-center">
                  <Button onClick={() => setShowInstructions(false)} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Got it!
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaderboard */}
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="bg-gray-800 p-8 rounded-lg max-w-md w-full m-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-yellow-400">Leaderboard</h2>
                  <Button
                    onClick={() => setShowLeaderboard(false)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <ul className="space-y-2">
                  {highScores.map((entry, index) => (
                    <li key={index} className="flex justify-between items-center text-gray-300">
                      <span>#{index + 1}</span>
                      <span>Score: {entry.score}</span>
                      <span>Level: {entry.level}</span>
                    </li>
                  ))}
                </ul>
                {highScores.length === 0 && (
                  <p className="text-gray-400 text-center mt-4">No high scores yet. Be the first!</p>
                )}
                <div className="mt-6 flex justify-center">
                  <Button onClick={() => setShowLeaderboard(false)} size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>Made by Krishnaa Nair, Aditi Vinodkumar Nair & Rahul Babu for OS Project</p>
        <p>Faculty Name: Dr Afruza Begum</p>
      </footer>
    </div>
  )
}