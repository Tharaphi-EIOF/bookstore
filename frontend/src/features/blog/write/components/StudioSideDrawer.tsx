import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type StudioSideDrawerProps = {
  children: ReactNode
  isOpen: boolean
  widthClassName: string
  wrapperClassName?: string
}

const StudioSideDrawer = ({
  children,
  isOpen,
  widthClassName,
  wrapperClassName = '',
}: StudioSideDrawerProps) => {
  return (
    <motion.aside
      initial={false}
      animate={{ x: isOpen ? 0 : 420, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      className={`fixed right-4 top-24 z-40 hidden xl:block ${widthClassName}`}
    >
      <div className={wrapperClassName}>
        {children}
      </div>
    </motion.aside>
  )
}

export default StudioSideDrawer
