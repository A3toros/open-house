import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { ActivityConfig } from '../../routes/activities/activityList'

type ActivityModalProps = {
  activity: ActivityConfig | null
  onClose: () => void
}

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modal = {
  hidden: { opacity: 0, scale: 0.9, y: 40 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: -20 },
}

export const ActivityModal = ({ activity, onClose }: ActivityModalProps) => (
  <AnimatePresence>
    {activity && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
        variants={backdrop}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      >
        <motion.div
          variants={modal}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl rounded-3xl border border-white/10 bg-midnight/90 p-6 text-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky">Activity preview</p>
              <h3 className="mt-2 font-display text-3xl">{activity.title}</h3>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              ✕
            </button>
          </div>
          <p className="mt-4 text-white/80">{activity.description}</p>
          <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <p>
              Each run logs to Neon via `/functions/{activity.slug}.js`, powered by OpenRouter models for responses and
              AssemblyAI when audio transcription is involved.
            </p>
            <p>
              This screen uses Framer Motion transitions and can be re-launched instantly on the kiosk. Tap “Launch
              activity” to jump into the experience.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/activity/${activity.slug}`}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white"
              onClick={onClose}
            >
              Launch activity
            </Link>
            <button
              onClick={onClose}
              className="rounded-full border border-white/30 px-4 py-2 text-sm text-white/70 hover:border-white"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

export default ActivityModal

