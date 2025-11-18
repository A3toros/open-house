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
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const getPersonalityDescription = () => {
    return personalityOptions[personality]
  }

  // Get a female voice from available voices
  const getFemaleVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null
    
    const voices = window.speechSynthesis.getVoices()
    // Try to find a female voice (common patterns: 'female', 'woman', or specific voice names)
    const femaleVoice = voices.find(
      (voice) =>
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('zira') || // Windows female voice
        voice.name.toLowerCase().includes('samantha') || // macOS female voice
        voice.name.toLowerCase().includes('karen') || // macOS female voice
        voice.name.toLowerCase().includes('susan') || // macOS female voice
        (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('female')) ||
        (voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female'))
    )
    
    // If no specific female voice found, try to find any English female voice by checking gender property (if available)
    if (!femaleVoice) {
      const englishVoices = voices.filter((v) => v.lang.startsWith('en'))
      // Some browsers expose gender, but it's not standard - try common female voice indices
      return englishVoices.length > 1 ? englishVoices[1] : englishVoices[0] || voices[0]
    }
    
    return femaleVoice || voices.find((v) => v.lang.startsWith('en')) || voices[0]
  }, [])

  // Stop speech
  const stopSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    speechUtteranceRef.current = null
  }, [])

  // Speak AI responses with female voice
  const speakText = useCallback(
    (text: string) => {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
      
      // Cancel any ongoing speech
      stopSpeech()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      
      // Set female voice
      const femaleVoice = getFemaleVoice()
      if (femaleVoice) {
        utterance.voice = femaleVoice
      }
      
      // Set speech properties for natural female voice
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onend = () => {
        speechUtteranceRef.current = null
      }
      
      utterance.onerror = () => {
        speechUtteranceRef.current = null
      }
      
      speechUtteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [getFemaleVoice, stopSpeech],
  )

  // Load voices when component mounts (voices may not be available immediately)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    
    const loadVoices = () => {
      // Voices are loaded asynchronously, so we need to wait
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true })
      }
    }
    
    loadVoices()
  }, [])

  // Automatically speak AI responses when they're added to chat
  useEffect(() => {
    if (chatLog.length === 0) return
    
    const lastMessage = chatLog[chatLog.length - 1]
    if (lastMessage.from === 'ai' && lastMessage.text) {
      // Small delay to ensure the message is rendered
      const timeoutId = setTimeout(() => {
        speakText(lastMessage.text)
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
        className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
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
              className="text-sm uppercase tracking-[0.4em] text-sky mb-4 text-center"
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
                    className="text-lg font-bold text-primary capitalize px-3 py-1 rounded-lg bg-primary/10 border border-primary/30"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {personalityOptions[personality]}
                  </motion.span>
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-primary/20 blur-xl -z-10"
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
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((personality + 1) / 4) * 100}%, rgba(255,255,255,0.1) ${((personality + 1) / 4) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />
                <motion.div
                  className="absolute h-4 bg-primary/30 rounded-full blur-sm"
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
                      color: personality === index ? '#3b82f6' : 'rgba(255,255,255,0.5)',
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
              className="text-sm uppercase tracking-[0.4em] text-sky mb-4 text-center"
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
                    className="text-lg font-bold text-primary capitalize px-3 py-1 rounded-lg bg-primary/10 border border-primary/30"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {purposeOptions[purpose]}
                  </motion.span>
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-primary/20 blur-xl -z-10"
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
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((purpose + 1) / 4) * 100}%, rgba(255,255,255,0.1) ${((purpose + 1) / 4) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />
                <motion.div
                  className="absolute h-4 bg-primary/30 rounded-full blur-sm"
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
                      color: purpose === index ? '#3b82f6' : 'rgba(255,255,255,0.5)',
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
          className="rounded-xl bg-accent px-6 py-3 font-semibold text-white disabled:opacity-50"
          disabled={isGenerating}
        >
          {isGenerating ? 'Designing persona…' : 'Generate Persona'}
        </button>
        {generatedPersona && (
          <div className="rounded-2xl border border-white/10 bg-midnight/40 p-4 text-sm text-white/80">
            <p className="text-xs uppercase tracking-[0.4em] text-sky">Persona blueprint</p>
            <p className="text-lg text-white">{generatedPersona.name}</p>
            <p>{generatedPersona.description}</p>
            <p className="mt-2 text-xs text-white/60">{generatedPersona.conversationStyle}</p>
          </div>
        )}
        <motion.div className="rounded-2xl border border-white/10 bg-midnight/50 p-4" layout>
          <p className="text-sm uppercase tracking-[0.4em] text-sky">Chat window</p>
          <div className="mt-3 space-y-3">
            {chatLog.map((entry, index) => (
              <div
                key={`${entry.text}-${index}`}
                className={`flex items-start gap-2 ${entry.from === 'ai' ? 'justify-start' : 'justify-end'}`}
              >
                {entry.from === 'ai' && (
                  <button
                    onClick={stopSpeech}
                    className="flex-shrink-0 rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition"
                    title="Stop speech"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                      />
                    </svg>
                  </button>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    entry.from === 'ai'
                      ? 'bg-white/10 text-white'
                      : 'bg-primary/80 text-white shadow-lg shadow-primary/30'
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
                className="flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
                placeholder="Type a message or use Speak button…"
                disabled={!personaId || isRecording}
              />
              <button
                onClick={handleSpeak}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                  isRecording
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-primary hover:bg-primary/90'
                } disabled:opacity-50`}
                disabled={!personaId || isTranscribing}
              >
                {isRecording ? 'Stop' : isTranscribing ? 'Processing…' : 'Speak'}
              </button>
              <button
                onClick={handleSendMessage}
                className="rounded-xl border border-white/30 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                disabled={!personaId || isSending || !message.trim()}
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </div>
            <button
              onClick={handleContinue}
              className="rounded-xl border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
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
