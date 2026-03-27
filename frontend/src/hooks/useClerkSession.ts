import { useEffect, useState } from 'react'
import { useAuth, useClerk, useUser } from '@clerk/react'
import { api } from '@/lib/api'
import { canAccessAdmin, canAccessCS } from '@/lib/permissions'
import {
  setClerkSignOutHandler,
  setClerkTokenGetter,
  setUnauthorizedHandler,
} from '@/lib/clerk-session'
import { useAuthStore, type User } from '@/store/auth.store'

type SessionResponse = {
  user: User
}

const resolvePortalMode = (
  user: User,
  currentPortalMode: 'buyer' | 'staff' | null,
) => {
  const hasAdminAccess = canAccessAdmin(user.role, user.permissions)
  const hasCSAccess = canAccessCS(user.role, user.permissions)

  if (user.isStaff || user.role !== 'USER') {
    return 'staff' as const
  }

  if (hasAdminAccess && !hasCSAccess) {
    return currentPortalMode
  }

  if (hasAdminAccess || hasCSAccess) {
    return 'staff' as const
  }

  return 'buyer' as const
}

export const useClerkSession = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { signOut } = useClerk()
  const { user: clerkUser } = useUser()
  const { login, logout, portalMode, setPortalMode, token, isAuthenticated } = useAuthStore()
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setClerkTokenGetter(null)
      return
    }

    setClerkTokenGetter(() => getToken())

    return () => {
      setClerkTokenGetter(null)
    }
  }, [getToken, isLoaded, isSignedIn])

  useEffect(() => {
    setClerkSignOutHandler(() => signOut({ redirectUrl: '/login' }))
    setUnauthorizedHandler(async () => {
      logout()
      await signOut({ redirectUrl: '/login' })
    })

    return () => {
      setClerkSignOutHandler(null)
      setUnauthorizedHandler(null)
    }
  }, [logout, signOut])

  useEffect(() => {
    let active = true

    const syncSession = async () => {
      if (!isLoaded) {
        if (active) setSessionReady(false)
        return
      }

      if (!isSignedIn) {
        // Preserve legacy JWT sessions when Clerk is enabled but unused.
        if (isAuthenticated && !token) {
          logout()
        }
        if (active) setSessionReady(true)
        return
      }

      if (active) setSessionReady(false)

      try {
        const response = await api.get<SessionResponse>('/auth/me')
        if (!active) return

        const nextUser = response.data.user
        login(nextUser, null)
        setPortalMode(resolvePortalMode(nextUser, portalMode))
      } catch {
        if (!active) return
        logout()
        await signOut({ redirectUrl: '/login' })
      } finally {
        if (active) setSessionReady(true)
      }
    }

    void syncSession()

    return () => {
      active = false
    }
  }, [
    clerkUser?.id,
    isLoaded,
    isSignedIn,
    login,
    logout,
    isAuthenticated,
    portalMode,
    setPortalMode,
    signOut,
    token,
  ])

  return { sessionReady }
}
