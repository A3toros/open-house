import { motion } from 'framer-motion'

const LoadingSpinner = ({ 
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    small: 'w-4 h-4',
    md: 'w-6 h-6',
    medium: 'w-6 h-6',
    lg: 'w-8 h-8',
    large: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  
  const colors = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    gray: 'border-gray-600'
  }
  
  return (
    <motion.div
      className={`
        inline-block border-2 border-gray-300 border-t-current rounded-full animate-spin
        ${sizes[size]} ${colors[color]} ${className}
      `}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  )
}

export default LoadingSpinner