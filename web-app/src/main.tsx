import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/clerk-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import {shadcn} from "@clerk/themes"
import { SocketProvider } from "./contexts/SocketProvider";
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
        <SocketProvider>
          <App />
        </SocketProvider>
      </ThemeProvider>
      <Toaster />
    </ClerkProvider>
    </BrowserRouter>
  </StrictMode>
);
