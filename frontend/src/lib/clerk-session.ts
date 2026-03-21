type ClerkTokenGetter = (() => Promise<string | null>) | null
type UnauthorizedHandler = (() => Promise<void> | void) | null
type ClerkSignOutHandler = (() => Promise<void> | void) | null

let clerkTokenGetter: ClerkTokenGetter = null
let unauthorizedHandler: UnauthorizedHandler = null
let clerkSignOutHandler: ClerkSignOutHandler = null

export const setClerkTokenGetter = (getter: ClerkTokenGetter) => {
  clerkTokenGetter = getter
}

export const getClerkToken = async () => {
  if (!clerkTokenGetter) {
    return null
  }

  return clerkTokenGetter()
}

export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler
}

export const handleUnauthorized = async () => {
  if (!unauthorizedHandler) {
    return
  }

  await unauthorizedHandler()
}

export const setClerkSignOutHandler = (handler: ClerkSignOutHandler) => {
  clerkSignOutHandler = handler
}

export const signOutWithClerk = async () => {
  if (!clerkSignOutHandler) {
    return
  }

  await clerkSignOutHandler()
}
