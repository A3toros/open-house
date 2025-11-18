import { useEffect, useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { motion } from 'framer-motion'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

type ParentTip = {
  title: string
  description: string
}

const ParentCorner = () => {
  useClearLocalStorage(['parent-corner-storage'])
  const [tips, setTips] = useState<ParentTip[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string>()

  useEffect(() => {
    const loadTips = async () => {
      setLoading(true)
      setErrorMessage(undefined)
      try {
        const response = await apiClient.get<{ tips: ParentTip[] }>('/parent-corner')
        setTips(response.tips || [])
      } catch (error) {
        setErrorMessage((error as Error).message)
      } finally {
        setLoading(false)
      }
    }
    loadTips()
  }, [])

  return (
    <ActivityLayout title="Parent Corner" subtitle="Looping mini-talks about AI safety and English practice.">
      {loading ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">Loading tips…</p>
      ) : errorMessage ? (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-sm text-rose-100">{errorMessage}</p>
      ) : (
        <motion.div
          className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 md:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {tips.map((tip, index) => (
            <motion.article
              key={tip.title}
              className="space-y-2 rounded-2xl bg-midnight/40 p-4 text-sm text-white/80"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <h3 className="font-semibold text-white">{tip.title}</h3>
              <p>{tip.description}</p>
            </motion.article>
          ))}
        </motion.div>
      )}
    </ActivityLayout>
  )
}

export default ParentCorner
