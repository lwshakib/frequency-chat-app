import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/clerk-react";
import { shadcn } from "@clerk/themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { PeerProvider } from "./contexts/PeerProvider";
import { SocketProvider } from "./contexts/SocketProvider";
import "./index.css";
// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={shadcn}>
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
  </StrictMode>
);
