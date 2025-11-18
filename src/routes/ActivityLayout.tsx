import type { PropsWithChildren } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'

export const ActivityLayout = ({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) => {
  const { profile } = useSession()

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
      <header className="space-y-2 relative">
        <p className="text-sm uppercase tracking-[0.4em] text-sky">{profile.locale.toUpperCase()}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="flex-shrink-0 hover:opacity-80 transition-opacity absolute left-0">
            <img
              src="/pics/arrow-back.png"
              alt="Back to activity list"
              className="h-8 w-8"
            />
          </Link>
          <h2 className="font-display text-3xl text-white">{title}</h2>
        </div>
        <p className="text-white/70 text-center">{subtitle}</p>
      </header>

      <motion.div layout className="space-y-4">
        {children}
      </motion.div>
    </section>
  )
}

