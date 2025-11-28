import type { PropsWithChildren } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { StarsBackground } from '../components/ui/stars-background'
import { ShootingStars } from '../components/ui/shooting-stars'

export const ActivityLayout = ({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) => {
  const { profile } = useSession()

  return (
    <div className="min-h-screen relative">
      {/* Stars Background */}
      <StarsBackground 
        starDensity={0.00015}
        allStarsTwinkle={true}
        twinkleProbability={0.7}
        minTwinkleSpeed={0.5}
        maxTwinkleSpeed={1}
      />
      <ShootingStars
        minSpeed={10}
        maxSpeed={30}
        minDelay={1000}
        maxDelay={5000}
        starColor="#11E0FF"
        trailColor="#2EB9DF"
        starWidth={10}
        starHeight={1}
      />
      
      <section className="space-y-6 rounded-3xl border border-[#11E0FF]/30 bg-[#1C2340] p-8 shadow-[0_0_30px_rgba(17,224,255,0.1)] relative z-10">
      <header className="space-y-2 relative">
        <p className="text-sm uppercase tracking-[0.4em] text-[#11E0FF]">{profile.locale.toUpperCase()}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="flex-shrink-0 hover:opacity-80 transition-opacity absolute left-0 hover:brightness-150">
            <img
              src="/pics/arrow-back.png"
              alt="Back to activity list"
              className="h-8 w-8"
            />
          </Link>
          <h2 className="font-display text-3xl text-white" style={{ textShadow: '0 0 10px rgba(17, 224, 255, 0.5)' }}>{title}</h2>
        </div>
        <p className="text-white/70 text-center">{subtitle}</p>
      </header>

      <motion.div layout className="space-y-4">
        {children}
      </motion.div>
    </section>
    </div>
  )
}

