import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollProgressBar from '@/components/ui/ScrollProgressBar'
import SupportChatLauncher from '@/features/support/components/SupportChatLauncher'

const Layout = () => {
  const location = useLocation()
  // The writing studio gets a lighter shell so the editor keeps more visual focus.
  const isWriterRoute = location.pathname.startsWith('/blogs/write')

  return (
    <div className="luxe-shell min-h-screen flex flex-col">
      <Navbar />
      {/* Keep route-level reading progress visible without each page wiring it up. */}
      <ScrollProgressBar topClassName="top-0" widthClassName="w-full" />
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Global support entry point for the storefront experience. */}
      <SupportChatLauncher />
      {!isWriterRoute && (
        <div
          aria-hidden
          className="pointer-events-none h-4 bg-gradient-to-b from-transparent to-[#0f1726]/30 dark:to-[#0f1726]/42"
        />
      )}
      <Footer variant={isWriterRoute ? 'minimal' : 'default'} />
    </div>
  )
}

export default Layout
