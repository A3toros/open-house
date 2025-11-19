import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { ActivityConfig } from '../../routes/activities/activityList'
import { wrapIndex, getCarouselSlice } from '../../utils/carousel'

type ActivityCarouselProps = {
  items: readonly ActivityConfig[]
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.9,
  }),
}

export const ActivityCarousel = ({ items }: ActivityCarouselProps) => {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setIndex((prev) => wrapIndex(prev + newDirection, items.length))
  }

  const active = items[index]
  const surrounding = getCarouselSlice(items, index, 3)

  return (
    <div className="space-y-6">
      <div className="relative rounded-3xl border border-[#11E0FF]/30 bg-[#1E2A49] p-6 shadow-[0_0_30px_rgba(17,224,255,0.15)] transition hover:border-[#11E0FF]/50 hover:shadow-[0_0_40px_rgba(17,224,255,0.25)]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={active.slug}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <Link
              to={`/activity/${active.slug}`}
              className="block w-full flex flex-col items-center"
            >
              <div className="space-y-4 max-w-2xl cursor-pointer">
                <p className="text-xs uppercase tracking-[0.4em] text-[#11E0FF]">Featured activity</p>
                <h3 className="font-display text-3xl text-white" style={{ textShadow: '0 0 10px rgba(17, 224, 255, 0.4)' }}>{active.title}</h3>
                <p className="text-base text-white/70">{active.description}</p>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        <button
          aria-label="Previous activity"
          onClick={() => paginate(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-[#11E0FF]/40 bg-[#1C2340]/80 p-2 text-[#11E0FF] hover:border-[#11E0FF] hover:bg-[#11E0FF]/10 transition"
        >
          ‹
        </button>
        <button
          aria-label="Next activity"
          onClick={() => paginate(1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-[#11E0FF]/40 bg-[#1C2340]/80 p-2 text-[#11E0FF] hover:border-[#11E0FF] hover:bg-[#11E0FF]/10 transition"
        >
          ›
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-sm text-white/60">
        {surrounding.map((item) => (
          <button
            key={item.slug}
            onClick={() => {
              setDirection(items.indexOf(item) > index ? 1 : -1)
              setIndex(items.indexOf(item))
            }}
            className={`rounded-2xl border-2 px-4 py-2 transition ${
              item.slug === active.slug
                ? 'border-[#11E0FF] bg-[#11E0FF]/20 text-[#11E0FF] shadow-[0_0_15px_rgba(17,224,255,0.4)]'
                : 'border-[#11E0FF]/30 bg-[#1E2A49]/50 text-white/70 hover:border-[#11E0FF]/60 hover:bg-[#1E2A49]'
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ActivityCarousel

