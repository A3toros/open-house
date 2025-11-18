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
      <div className="relative rounded-3xl border border-white/10 bg-midnight/60 p-6">
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
            <div className="space-y-4 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-sky">Featured activity</p>
              <h3 className="font-display text-3xl text-white">{active.title}</h3>
              <p className="text-base text-white/70">{active.description}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/activity/${active.slug}`}
                  className="rounded-full bg-primary px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white"
                >
                  Launch now
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          aria-label="Previous activity"
          onClick={() => paginate(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/40 p-2 text-white/80 hover:border-white"
        >
          ‹
        </button>
        <button
          aria-label="Next activity"
          onClick={() => paginate(1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/40 p-2 text-white/80 hover:border-white"
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
            className={`rounded-2xl border px-4 py-2 transition ${
              item.slug === active.slug
                ? 'border-primary bg-primary/20 text-white'
                : 'border-white/20 bg-white/5 hover:border-white/60'
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

