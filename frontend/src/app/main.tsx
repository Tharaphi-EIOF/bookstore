import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/react";
import ClerkSessionBootstrap from "@/features/auth/components/ClerkSessionBootstrap";
import App from "./App";
import "../index.css";

// One shared query client keeps request policy consistent across pages.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// The app can run with legacy auth only, or with Clerk layered on when configured.
const appTree = (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  clerkPublishableKey ? (
    // ClerkSessionBootstrap syncs Clerk auth state into the app's Zustand store.
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/login">
      <ClerkSessionBootstrap />
      {appTree}
    </ClerkProvider>
  ) : (
    appTree
  )
);
