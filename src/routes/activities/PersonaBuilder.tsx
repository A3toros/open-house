import { useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { motion } from 'framer-motion'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

const PersonaBuilder = () => {
  useClearLocalStorage(['persona-builder-storage'])
  const [persona, setPersona] = useState({
    personality: 'Kind + Genius',
    purpose: 'Study buddy',
    tone: 'Supportive',
  })
  const [generatedPersona, setGeneratedPersona] = useState<{
    name: string
    description: string
    greeting: string
    conversationStyle: string
  } | null>(null)
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [chatLog, setChatLog] = useState<Array<{ from: 'ai' | 'student'; text: string }>>([
    { from: 'ai', text: '🙏 Describe your perfect AI friend. Personality + Purpose + Tone = Instant buddy.' },
  ])
  const [message, setMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleCreate = async () => {
    setIsGenerating(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ personaId: string; persona: typeof generatedPersona }>(
        '/persona-builder',
        persona,
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

  const handleSendMessage = async () => {
    if (!message.trim() || !personaId) return
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

  return (
    <ActivityLayout title="Build Your AI Persona" subtitle="Kids design an AI friend and chat for a minute.">
      <motion.div
        className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(persona).map(([key, value]) => (
            <label key={key} className="text-sm text-white/70 capitalize">
              {key}
              <input
                className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
                value={value}
                onChange={(e) => setPersona((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </label>
          ))}
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
                className={`flex ${entry.from === 'ai' ? 'justify-start' : 'justify-end'}`}
              >
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
          <div className="mt-4 flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
              placeholder="Say something to your AI friend…"
              disabled={!personaId}
            />
            <button
              onClick={handleSendMessage}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!personaId || isSending}
            >
              {isSending ? 'AI typing…' : 'Send'}
            </button>
          </div>
          {errorMessage && <p className="mt-2 text-sm text-rose-300">{errorMessage}</p>}
        </motion.div>
      </motion.div>
    </ActivityLayout>
  )
}

export default PersonaBuilder
