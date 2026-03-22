import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/media'

// Legacy DiceBear avatars (kept for backward compatibility)
export const AVATARS = [
  { id: 'avatar-1', url: 'https://api.dicebear.com/7.x/lorelei/svg' },
  { id: 'avatar-2', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Aneka' },
  { id: 'avatar-3', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Anything' },
  { id: 'avatar-4', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Calista' },
  { id: 'avatar-5', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Dante' },
  { id: 'avatar-6', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Elias' },
]

export const BACKGROUND_COLORS = [
  { id: 'bg-slate-100', class: 'bg-slate-100' },
  { id: 'bg-red-100', class: 'bg-red-100' },
  { id: 'bg-orange-100', class: 'bg-orange-100' },
  { id: 'bg-amber-100', class: 'bg-amber-100' },
  { id: 'bg-green-100', class: 'bg-green-100' },
  { id: 'bg-emerald-100', class: 'bg-emerald-100' },
  { id: 'bg-teal-100', class: 'bg-teal-100' },
  { id: 'bg-cyan-100', class: 'bg-cyan-100' },
  { id: 'bg-sky-100', class: 'bg-sky-100' },
  { id: 'bg-blue-100', class: 'bg-blue-100' },
  { id: 'bg-indigo-100', class: 'bg-indigo-100' },
  { id: 'bg-violet-100', class: 'bg-violet-100' },
  { id: 'bg-purple-100', class: 'bg-purple-100' },
  { id: 'bg-fuchsia-100', class: 'bg-fuchsia-100' },
  { id: 'bg-pink-100', class: 'bg-pink-100' },
  { id: 'bg-rose-100', class: 'bg-rose-100' },
]

interface AvatarProps {
  avatarType?: 'emoji' | 'upload'
  avatarValue?: string
  backgroundColor?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
}

const Avatar = ({
  avatarType = 'emoji',
  avatarValue: rawAvatarValue,
  backgroundColor: rawBackgroundColor,
  size = 'md',
  className,
  onClick,
}: AvatarProps) => {
  const avatarValue = rawAvatarValue || '👤'
  const backgroundColor = rawBackgroundColor || 'bg-slate-100'

  const isUrlPath = typeof avatarValue === 'string' && (avatarValue.includes('/') || avatarValue.startsWith('http'))
  const isLegacyId = typeof avatarValue === 'string' && avatarValue.startsWith('avatar-')

  let content: React.ReactNode

  if (avatarType === 'upload' && isUrlPath) {
    const imageSrc = resolveMediaUrl(avatarValue)
    content = (
      <img
        src={imageSrc}
        alt="User avatar"
        className="w-full h-full object-cover"
      />
    )
  } else if (avatarType === 'upload' && !isUrlPath) {
    // Professional silhouette placeholder
    content = (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <User 
          className={cn(
            'text-slate-300 dark:text-slate-700',
            {
              'h-5 w-5': size === 'sm',
              'h-6 w-6': size === 'md',
              'h-14 w-14': size === 'lg',
              'h-16 w-16': size === 'xl',
            }
          )}
          strokeWidth={1.5}
        />
      </div>
    )
  } else if (isLegacyId) {
    const avatarUrl = AVATARS.find(a => a.id === avatarValue)?.url || AVATARS[0].url
    content = (
      <img
        src={avatarUrl}
        alt="User avatar"
        className="w-full h-full object-contain"
      />
    )
  } else {
    // Emoji avatar or placeholder
    content = (
      <span
        className={cn(
          'flex items-center justify-center leading-none select-none',
          {
            'text-lg': size === 'sm',
            'text-2xl': size === 'md',
            'text-5xl': size === 'lg',
            'text-6xl': size === 'xl',
          }
        )}
      >
        {avatarValue.length > 2 ? '👤' : avatarValue}
      </span>
    )
  }

  // Background only for emojis
  const showBackground = avatarType !== 'upload' || !isUrlPath
  const finalBg = showBackground ? backgroundColor : 'bg-transparent'

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-full overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm transition-all',
        sizeClasses[size],
        finalBg,
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
    >
      {content}
    </motion.div>
  )
}

export default Avatar

