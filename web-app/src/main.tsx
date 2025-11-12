import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClerkProvider } from "@clerk/clerk-react";
import { shadcn } from "@clerk/themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { PeerProvider } from "./contexts/PeerProvider";
import { SocketProvider } from "./contexts/SocketProvider";
import { validateEnv, getClerkPublishableKey } from "./lib/env";
import "./index.css";

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  console.error("Environment validation failed:", error);
  // In production, you might want to show a user-friendly error page
  throw error;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ClerkProvider
          publishableKey={getClerkPublishableKey()}
          appearance={shadcn}
        >
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <PeerProvider>
              <SocketProvider>
                <App />
              </SocketProvider>
            </PeerProvider>
          </ThemeProvider>
          <Toaster />
        </ClerkProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
