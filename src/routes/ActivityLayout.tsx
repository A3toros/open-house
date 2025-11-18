import type { PropsWithChildren } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'

export const ActivityLayout = ({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) => {
  const { profile } = useSession()

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-sky">{profile.locale.toUpperCase()}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl text-white">{title}</h2>
          <Link to="/" className="text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">
            ← Back to activity list
          </Link>
        </div>
        <p className="text-white/70">{subtitle}</p>
      </header>

      <motion.div layout className="space-y-4">
        {children}
      </motion.div>
    </section>
  )
}

