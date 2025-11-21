import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { activities } from './activities/activityList'
import ActivityCarousel from '../components/home/ActivityCarousel'

const Home = () => {
  const bannerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [textTop, setTextTop] = useState(48) // Start at topPadding

  useEffect(() => {
    let rafId: number | null = null
    
    const handleScroll = () => {
      const banner = bannerRef.current
      const text = textRef.current
      if (!banner || !text) return

      const scrollY = window.scrollY || window.pageYOffset
      const bannerOffsetTop = banner.offsetTop
      const bannerHeight = banner.offsetHeight
      const viewportHeight = window.innerHeight
      
      // Get actual text dimensions - use offsetHeight for consistent measurement
      const textHeight = Math.max(
        text.offsetHeight || 0,
        text.getBoundingClientRect().height || 0,
        60 // fallback minimum
      )
      
      // Fixed padding values - these should NEVER change
      const topPadding = 48 // Constant top padding - NEVER reduce this
      const bottomPadding = 120 // Constant bottom padding
      const startPosition = topPadding // Always start here - this is the minimum
      
      // Calculate maximum safe position where text bottom stays visible
      // Container is sticky at top:0, so textTop is relative to viewport top
      // Text bottom = textTop + textHeight
      // We need: textTop + textHeight <= viewportHeight - bottomPadding
      // So: textTop <= viewportHeight - textHeight - bottomPadding
      const maxSafePosition = viewportHeight - textHeight - bottomPadding
      
      // CRITICAL: Max position must ALWAYS be >= startPosition (topPadding)
      // If maxSafePosition is less than startPosition, we can't scroll the text down
      // In that case, keep it at startPosition (topPadding)
      const maxPosition = Math.max(startPosition, maxSafePosition)
      
      // Safety check: if maxPosition would be less than startPosition, something is wrong
      if (maxPosition < startPosition) {
        console.error('Invalid maxPosition calculation', { 
          maxPosition, 
          startPosition, 
          maxSafePosition,
          viewportHeight, 
          textHeight, 
          bottomPadding 
        })
      }
      
      // Calculate how far we've scrolled relative to the banner
      const scrollRelativeToBanner = scrollY - bannerOffsetTop
      
      if (scrollRelativeToBanner < 0) {
        // Haven't reached banner yet - always at top with constant padding
        setTextTop(startPosition)
      } else if (scrollRelativeToBanner > bannerHeight) {
        // Scrolled past banner - keep at max safe position
        setTextTop(maxPosition)
      } else {
        // Scrolling through banner - interpolate position smoothly
        // scrollProgress goes from 0 (at banner start) to 1 (at banner end)
        const scrollProgress = Math.min(1, Math.max(0, scrollRelativeToBanner / bannerHeight))
        
        // Interpolate from startPosition (topPadding) to maxPosition
        // This ensures topPadding stays constant at the start
        let calculatedPosition = startPosition + (maxPosition - startPosition) * scrollProgress
        
        // Verify text bottom won't exceed viewport
        const textBottomAtPosition = calculatedPosition + textHeight
        const maxAllowedBottom = viewportHeight - bottomPadding
        
        // If text would go out of view, clamp it
        if (textBottomAtPosition > maxAllowedBottom) {
          calculatedPosition = Math.max(startPosition, maxAllowedBottom - textHeight)
        }
        
        // CRITICAL: Final clamp - ensure we NEVER go below startPosition (topPadding)
        // This prevents padding from reducing as we scroll
        const finalPosition = Math.max(startPosition, Math.min(calculatedPosition, maxPosition))
        
        // Double-check: finalPosition should NEVER be less than startPosition (48px)
        if (finalPosition < startPosition) {
          console.error('Final position is less than start position!', { 
            finalPosition, 
            startPosition, 
            calculatedPosition,
            maxPosition 
          })
        }
        
        // Set position - guaranteed to be >= startPosition (48px)
        setTextTop(Math.max(startPosition, finalPosition))
      }
    }

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          handleScroll()
          rafId = null
        })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    handleScroll() // Initial call

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return (
    <main className="min-h-screen text-white">
      {/* Banner Section */}
      <div ref={bannerRef} className="relative w-full h-[60vh] min-h-[400px] max-h-[600px]">
        <img
          src="/pics/Banner.webp"
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="sticky top-0 h-[60vh] min-h-[400px] max-h-[600px] flex items-start justify-center overflow-hidden">
          <motion.p
            ref={textRef}
            className="text-3xl md:text-5xl font-bold uppercase tracking-[0.1em] px-4 whitespace-nowrap relative"
            style={{
              marginTop: `${Math.max(48, textTop)}px`, // Never go below 48px (topPadding)
              willChange: 'margin-top',
            }}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0,
            }}
            transition={{ 
              duration: 1,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            <motion.span
              className="relative inline-block z-10"
              animate={{
                color: [
                  '#00CED1', // Dark cyan / space cyan at less glow
                  '#FFFFFF', // White at max glow
                  '#FFFFFF', // White at max glow
                  '#00CED1', // Back to dark cyan / space cyan at less glow
                ],
                textShadow: [
                  '0 0 10px rgba(17, 224, 255, 1), 0 0 20px rgba(17, 224, 255, 0.8), 0 0 30px rgba(17, 224, 255, 0.6), 0 0 40px rgba(17, 224, 255, 0.4), 0 0 60px rgba(17, 224, 255, 0.3)',
                  '0 0 15px rgba(17, 224, 255, 1), 0 0 30px rgba(17, 224, 255, 0.9), 0 0 45px rgba(17, 224, 255, 0.7), 0 0 60px rgba(17, 224, 255, 0.5), 0 0 80px rgba(17, 224, 255, 0.4)',
                  '0 0 15px rgba(17, 224, 255, 1), 0 0 30px rgba(17, 224, 255, 0.9), 0 0 45px rgba(17, 224, 255, 0.7), 0 0 60px rgba(17, 224, 255, 0.5), 0 0 80px rgba(17, 224, 255, 0.4)',
                  '0 0 10px rgba(17, 224, 255, 1), 0 0 20px rgba(17, 224, 255, 0.8), 0 0 30px rgba(17, 224, 255, 0.6), 0 0 40px rgba(17, 224, 255, 0.4), 0 0 60px rgba(17, 224, 255, 0.3)',
                ],
                filter: [
                  'drop-shadow(0 0 8px rgba(17, 224, 255, 0.8)) drop-shadow(0 0 16px rgba(17, 224, 255, 0.4))',
                  'drop-shadow(0 0 12px rgba(17, 224, 255, 1)) drop-shadow(0 0 24px rgba(17, 224, 255, 0.6)) drop-shadow(0 0 36px rgba(17, 224, 255, 0.3))',
                  'drop-shadow(0 0 12px rgba(17, 224, 255, 1)) drop-shadow(0 0 24px rgba(17, 224, 255, 0.6)) drop-shadow(0 0 36px rgba(17, 224, 255, 0.3))',
                  'drop-shadow(0 0 8px rgba(17, 224, 255, 0.8)) drop-shadow(0 0 16px rgba(17, 224, 255, 0.4))',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              EP & AI – Empowering Future Minds
            </motion.span>
            {/* Cyber glow sweep effect */}
            <motion.span
              className="absolute inset-0 blur-2xl opacity-30 pointer-events-none z-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(17, 224, 255, 0.6) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                mixBlendMode: 'screen',
              }}
              animate={{
                backgroundPosition: ['-100% 0%', '200% 0%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.p>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl space-y-12 rounded-3xl bg-[#1C2340] p-8 shadow-[0_0_40px_rgba(17,224,255,0.15)] border border-[#11E0FF]/20">

        <section className="space-y-8">
          <ActivityCarousel items={activities} />
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-2xl text-white">All activities</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {activities.map((activity, index) => (
              <Link
                key={activity.slug}
                to={`/activity/${activity.slug}`}
                className="block"
              >
                <motion.article
                  className="rounded-2xl border border-[#11E0FF]/30 bg-[#1E2A49] p-6 transition hover:-translate-y-1 hover:border-[#11E0FF]/60 hover:bg-[#1E2A49]/80 hover:shadow-[0_0_20px_rgba(17,224,255,0.3)] cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                >
                  <h3 className="font-display text-xl text-white">{activity.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{activity.description}</p>
                  <div className="mt-4 text-xs text-white/70">
                    <span>React screen ready</span>
                  </div>
                </motion.article>
              </Link>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-2 text-center text-sm text-white/70">
          <span>Mathayomwatsing EP Open House · 2025</span>
        </footer>
        </div>
      </div>
    </main>
  )
}

export default Home

