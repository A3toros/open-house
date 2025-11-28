import { useEffect, useRef, useState } from 'react'

interface ShootingStarsProps {
  minSpeed?: number
  maxSpeed?: number
  minDelay?: number
  maxDelay?: number
  starColor?: string
  trailColor?: string
  starWidth?: number
  starHeight?: number
  className?: string
}

export const ShootingStars = ({
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1000,
  maxDelay = 5000,
  starColor = '#9E00FF',
  trailColor = '#2EB9DF',
  starWidth = 10,
  starHeight = 1,
  className = '',
}: ShootingStarsProps) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [shootingStar, setShootingStar] = useState<{
    x: number
    y: number
    angle: number
    length: number
    speed: number
  } | null>(null)
  const starRef = useRef<typeof shootingStar>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const createShootingStar = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      // Random starting position on edges
      const side = Math.floor(Math.random() * 4)
      let x: number, y: number, angle: number

      switch (side) {
        case 0: // Top
          x = Math.random() * width
          y = 0
          angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3
          break
        case 1: // Right
          x = width
          y = Math.random() * height
          angle = Math.PI + (Math.random() - 0.5) * Math.PI / 3
          break
        case 2: // Bottom
          x = Math.random() * width
          y = height
          angle = (3 * Math.PI) / 2 + (Math.random() - 0.5) * Math.PI / 3
          break
        default: // Left
          x = 0
          y = Math.random() * height
          angle = (Math.random() - 0.5) * Math.PI / 3
          break
      }

      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed)
      const length = 50 + Math.random() * 100

      const newStar = { x, y, angle, length, speed }
      starRef.current = newStar
      setShootingStar(newStar)
    }

    let timeoutId: NodeJS.Timeout
    let animationFrameId: number

    const scheduleNext = () => {
      const delay = minDelay + Math.random() * (maxDelay - minDelay)
      timeoutId = setTimeout(() => {
        createShootingStar()
        scheduleNext()
      }, delay)
    }

    const animate = () => {
      if (starRef.current) {
        const width = window.innerWidth
        const height = window.innerHeight

        starRef.current.x += Math.cos(starRef.current.angle) * starRef.current.speed
        starRef.current.y += Math.sin(starRef.current.angle) * starRef.current.speed

        // Remove if out of bounds
        if (
          starRef.current.x < -200 ||
          starRef.current.x > width + 200 ||
          starRef.current.y < -200 ||
          starRef.current.y > height + 200
        ) {
          starRef.current = null
          setShootingStar(null)
        } else {
          setShootingStar({ ...starRef.current })
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    scheduleNext()

    return () => {
      clearTimeout(timeoutId)
      cancelAnimationFrame(animationFrameId)
    }
  }, [minSpeed, maxSpeed, minDelay, maxDelay])

  return (
    <svg
      ref={svgRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
      width="100%"
      height="100%"
    >
      {shootingStar && (
        <defs>
          <linearGradient id="shootingStarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={trailColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={starColor} stopOpacity="1" />
          </linearGradient>
        </defs>
      )}
      {shootingStar && (
        <line
          x1={shootingStar.x}
          y1={shootingStar.y}
          x2={shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length}
          y2={shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length}
          stroke="url(#shootingStarGradient)"
          strokeWidth={starHeight}
          strokeLinecap="round"
          opacity={0.9}
        />
      )}
    </svg>
  )
}

