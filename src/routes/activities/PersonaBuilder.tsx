import { useState, useEffect, useCallback, useRef } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { motion } from 'framer-motion'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'
import { useRecorder } from '../../hooks/useRecorder'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'

const PersonaBuilder = () => {
  useClearLocalStorage(['persona-builder-storage'])
  const { isRecording, startRecording, stopRecording } = useRecorder()
  const personalityOptions = ['kind', 'sarcastic', 'genius', 'funny'] as const
  const [personality, setPersonality] = useState<0 | 1 | 2 | 3>(0)
  const purposeOptions = ['study buddy', 'coach', 'comedian', 'storyteller'] as const
  const [purpose, setPurpose] = useState<0 | 1 | 2 | 3>(0)
  const [generatedPersona, setGeneratedPersona] = useState<{
    name: string
    description: string
    greeting: string
    conversationStyle: string
  } | null>(null)
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [chatLog, setChatLog] = useState<Array<{ from: 'ai' | 'student'; text: string }>>([])
  const [message, setMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const getPersonalityDescription = () => {
    return personalityOptions[personality]
  }

  // Stop speech
  const stopSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsLoadingAudio(false)
    setPlayingMessageIndex(null)
  }, [])

  // Speak AI responses using GPT-4o mini TTS API
  const speakText = useCallback(
    async (text: string, messageIndex: number) => {
      if (!text) return
      
      // Stop any ongoing speech
      stopSpeech()
      
      setIsLoadingAudio(true)
      setPlayingMessageIndex(messageIndex)
      try {
        // Use English TTS API for high-quality speech
        const response = await apiClient.post<{ audioUrl: string; success: boolean }>('/english-tts', {
          text: text,
          voice: 'nova', // Natural female voice
        })

        if (response.success && response.audioUrl) {
          const audio = new Audio(response.audioUrl)
          audioRef.current = audio
          
          audio.onended = () => {
            audioRef.current = null
            setIsLoadingAudio(false)
            setPlayingMessageIndex(null)
          }
          
          audio.onerror = () => {
            audioRef.current = null
            setIsLoadingAudio(false)
            setPlayingMessageIndex(null)
          }
          
          setIsLoadingAudio(false)
          await audio.play()
        } else {
          setIsLoadingAudio(false)
          setPlayingMessageIndex(null)
          console.error('TTS API returned unsuccessful response')
        }
      } catch (error) {
        console.error('TTS API error:', error)
        setIsLoadingAudio(false)
        setPlayingMessageIndex(null)
      }
    },
    [stopSpeech],
  )

  // Automatically speak AI responses when they're added to chat
  useEffect(() => {
    if (chatLog.length === 0) return
    
    const lastMessage = chatLog[chatLog.length - 1]
    if (lastMessage.from === 'ai' && lastMessage.text) {
      // Small delay to ensure the message is rendered
      const timeoutId = setTimeout(() => {
        const messageIndex = chatLog.length - 1
        speakText(lastMessage.text, messageIndex)
      }, 300)
      
      return () => clearTimeout(timeoutId)
    }
  }, [chatLog, speakText])

  const handleCreate = async () => {
    setIsGenerating(true)
    setErrorMessage(undefined)
    try {
      const personalityDesc = getPersonalityDescription()
      const response = await apiClient.post<{ personaId: string; persona: typeof generatedPersona }>(
        '/persona-builder',
        {
          personality: personalityDesc,
          purpose: purposeOptions[purpose],
          tone: 'friendly',
        },
      )
      setPersonaId(response.personaId)
      setGeneratedPersona(response.persona)
      setChatLog([
        {
          from: 'ai',
          text: response.persona?.greeting || 'Hi! I am ready to chat about your goals.',
        },
      ])
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSpeak = async () => {
    if (!personaId) return
    setErrorMessage(undefined)
    
    // Stop any ongoing speech
    stopSpeech()
    
    if (isRecording) {
      try {
        setIsTranscribing(true)
        const blob = ensureAudioAvailable(await stopRecording())
        const base64 = await toBase64(blob)
        
        // Transcribe and send
        const transcriptResponse = await apiClient.post<{ transcript: string }>('/culture-translator', {
          audioBlob: base64,
        })
        
        const userMessage = transcriptResponse.transcript || 'Hello'
        setChatLog((prev) => [...prev, { from: 'student', text: userMessage }])
        setIsSending(true)
        
        const response = await apiClient.post<{ reply: string }>('/persona-chat', {
          personaId,
          message: userMessage,
        })
        setChatLog((prev) => [...prev, { from: 'ai', text: response.reply }])
      } catch (error) {
        setErrorMessage((error as Error).message)
      } finally {
        setIsTranscribing(false)
        setIsSending(false)
      }
    } else {
      try {
        await startRecording()
      } catch (error) {
        setErrorMessage((error as Error).message)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !personaId) return
    
    // Stop any ongoing speech
    stopSpeech()
    
    const userMessage = message.trim()
    setChatLog((prev) => [...prev, { from: 'student', text: userMessage }])
    setMessage('')
    setIsSending(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ reply: string }>('/persona-chat', {
        personaId,
        message: userMessage,
      })
      setChatLog((prev) => [...prev, { from: 'ai', text: response.reply }])
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsSending(false)
    }
  }

  const handleContinue = async () => {
    if (!personaId) return
    setIsSending(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ reply: string }>('/persona-chat', {
        personaId,
        message: 'Continue',
      })
      setChatLog((prev) => [...prev, { from: 'ai', text: response.reply }])
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <ActivityLayout title="Build Your AI Persona" subtitle="Design an AI friend and chat">
      <motion.div
        className="space-y-4 rounded-2xl border border-[#11E0FF]/30 bg-[#1E2A49] p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="max-w-md mx-auto"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm uppercase tracking-[0.4em] text-[#11E0FF] mb-4 text-center"
            >
              Personality
            </motion.p>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-white/70">Personality</label>
                <motion.div
                  key={personality}
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 15,
                    duration: 0.5
                  }}
                  className="relative"
                >
                  <motion.span
                    className="text-lg font-bold text-[#11E0FF] capitalize px-3 py-1 rounded-lg bg-[#11E0FF]/10 border border-[#11E0FF]/30"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {personalityOptions[personality]}
                  </motion.span>
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-[#11E0FF]/20 blur-xl -z-10"
                    animate={{ 
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </motion.div>
              </div>
              <div className="relative px-2">
                <motion.div
                  className="absolute inset-x-2 h-4 bg-white/10 rounded-full"
                  initial={false}
                  animate={{
                    background: `linear-gradient(to right, #11E0FF 0%, #11E0FF ${((personality + 1) / 4) * 100}%, rgba(255,255,255,0.1) ${((personality + 1) / 4) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />
                <motion.div
                  className="absolute h-4 bg-[#11E0FF]/30 rounded-full blur-sm"
                  style={{
                    width: `${((personality + 1) / 4) * 100}%`,
                    left: '8px',
                  }}
                  animate={{
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={personality}
                  onChange={(e) => setPersonality(Number(e.target.value) as 0 | 1 | 2 | 3)}
                  className="relative w-full h-4 bg-transparent rounded-full appearance-none cursor-pointer range-slider z-10"
                />
              </div>
              <div className="flex justify-between text-xs px-2">
                {personalityOptions.map((option, index) => (
                  <motion.button
                    key={option}
                    onClick={() => setPersonality(index as 0 | 1 | 2 | 3)}
                    initial={false}
                    animate={{
                      color: personality === index ? '#11E0FF' : 'rgba(255,255,255,0.5)',
                      scale: personality === index ? 1.15 : 1,
                      y: personality === index ? -2 : 0,
                    }}
                    whileHover={{ scale: 1.1, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className={`capitalize font-medium ${personality === index ? 'font-bold' : ''}`}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}
            className="max-w-md mx-auto"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-sm uppercase tracking-[0.4em] text-[#11E0FF] mb-4 text-center"
            >
              Purpose
            </motion.p>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-white/70">Purpose</label>
                <motion.div
                  key={purpose}
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 15,
                    duration: 0.5
                  }}
                  className="relative"
                >
                  <motion.span
                    className="text-lg font-bold text-[#11E0FF] capitalize px-3 py-1 rounded-lg bg-[#11E0FF]/10 border border-[#11E0FF]/30"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {purposeOptions[purpose]}
                  </motion.span>
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-[#11E0FF]/20 blur-xl -z-10"
                    animate={{ 
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </motion.div>
              </div>
              <div className="relative px-2">
                <motion.div
                  className="absolute inset-x-2 h-4 bg-white/10 rounded-full"
                  initial={false}
                  animate={{
                    background: `linear-gradient(to right, #11E0FF 0%, #11E0FF ${((purpose + 1) / 4) * 100}%, rgba(255,255,255,0.1) ${((purpose + 1) / 4) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />
                <motion.div
                  className="absolute h-4 bg-[#11E0FF]/30 rounded-full blur-sm"
                  style={{
                    width: `${((purpose + 1) / 4) * 100}%`,
                    left: '8px',
                  }}
                  animate={{
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={purpose}
                  onChange={(e) => setPurpose(Number(e.target.value) as 0 | 1 | 2 | 3)}
                  className="relative w-full h-4 bg-transparent rounded-full appearance-none cursor-pointer range-slider z-10"
                />
              </div>
              <div className="flex justify-between text-xs px-2">
                {purposeOptions.map((option, index) => (
                  <motion.button
                    key={option}
                    onClick={() => setPurpose(index as 0 | 1 | 2 | 3)}
                    initial={false}
                    animate={{
                      color: purpose === index ? '#11E0FF' : 'rgba(255,255,255,0.5)',
                      scale: purpose === index ? 1.15 : 1,
                      y: purpose === index ? -2 : 0,
                    }}
                    whileHover={{ scale: 1.1, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className={`capitalize font-medium ${purpose === index ? 'font-bold' : ''}`}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-xl bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 px-6 py-3 font-semibold text-[#11E0FF] disabled:opacity-50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] transition"
          style={{ textShadow: '0 0 8px rgba(17, 224, 255, 0.6)' }}
          disabled={isGenerating}
        >
          {isGenerating ? 'Designing persona…' : 'Generate Persona'}
        </button>
        {generatedPersona && (
          <div className="rounded-2xl border border-[#11E0FF]/20 bg-[#1C2340] p-4 text-sm text-white/80">
            <p className="text-xs uppercase tracking-[0.4em] text-[#11E0FF]">Persona blueprint</p>
            <p className="text-lg text-white">{generatedPersona.name}</p>
            <p>{generatedPersona.description}</p>
            <p className="mt-2 text-xs text-white/60">{generatedPersona.conversationStyle}</p>
          </div>
        )}
        <motion.div className="rounded-2xl border border-[#11E0FF]/20 bg-[#1E2A49] p-4" layout>
          <p className="text-sm uppercase tracking-[0.4em] text-[#11E0FF]">Chat window</p>
          <div className="mt-3 space-y-3">
            {chatLog.map((entry, index) => (
              <div
                key={`${entry.text}-${index}`}
                className={`flex items-center gap-2 ${entry.from === 'ai' ? 'justify-start' : 'justify-end'}`}
              >
                {entry.from === 'ai' && playingMessageIndex === index && (
                  <button
                    onClick={stopSpeech}
                    disabled={isLoadingAudio}
                    className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/50 text-xs hover:bg-rose-500/30 hover:border-rose-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isLoadingAudio ? 'Loading audio...' : 'Stop audio'}
                  >
                    {isLoadingAudio ? '⏳' : '🔇'}
                  </button>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    entry.from === 'ai'
                      ? 'bg-[#1C2340] text-white border border-[#11E0FF]/30'
                      : 'bg-[#1E2A49] text-white border border-[#FFB743]/30 shadow-lg shadow-[#FFB743]/20'
                  }`}
                >
                  {entry.text}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                className="flex-1 rounded-xl border border-[#11E0FF]/30 bg-[#1C2340] px-3 py-2 text-white focus:border-[#11E0FF] focus:outline-none focus:ring-2 focus:ring-[#11E0FF]/20"
                placeholder="Type a message or use Speak button…"
                disabled={!personaId || isRecording}
              />
              <button
                onClick={handleSpeak}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                  isRecording
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] text-[#11E0FF]'
                } disabled:opacity-50`}
                disabled={!personaId || isTranscribing}
              >
                {isRecording ? 'Stop' : isTranscribing ? 'Processing…' : 'Speak'}
              </button>
              <button
                onClick={handleSendMessage}
                className="rounded-xl border-2 border-[#11E0FF]/50 bg-[#11E0FF]/10 px-4 py-2 text-sm font-semibold text-[#11E0FF] hover:bg-[#11E0FF]/20 hover:shadow-[0_0_15px_rgba(17,224,255,0.4)] disabled:opacity-50 transition"
          style={{ textShadow: '0 0 6px rgba(17, 224, 255, 0.5)' }}
                disabled={!personaId || isSending || !message.trim()}
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </div>
            <button
              onClick={handleContinue}
              className="rounded-xl border border-primary/50 bg-[#11E0FF]/10 px-4 py-2 text-sm font-semibold text-[#11E0FF] hover:bg-[#11E0FF]/20 disabled:opacity-50"
              disabled={!personaId || isSending}
            >
              {isSending ? 'AI thinking…' : 'Continue'}
            </button>
          </div>
          {errorMessage && <p className="mt-2 text-sm text-rose-300">{errorMessage}</p>}
        </motion.div>
      </motion.div>
    </ActivityLayout>
  )
}

export default PersonaBuilder
