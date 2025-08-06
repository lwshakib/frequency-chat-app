import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessages } from "@/components/ChatMessages";
import { MessageInput } from "@/components/MessageInput";
import { MobileSidebar } from "@/components/MobileSidebar";
import { Sidebar } from "@/components/Sidebar";
import { ChatProvider } from "@/contexts/ChatContextProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import { Route, Routes } from "react-router";
import "./App.css";
import { Toaster } from "./components/ui/sonner";
import { SocketProvider } from "./contexts/SocketProvider";

function ChatApp() {
  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-shrink-0">
        <Sidebar toggleButton={<></>} />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <ChatHeader />
        <div className="flex-1 min-h-0">
          <ChatMessages />
        </div>
        <MessageInput />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SignedIn>
        <ChatProvider>
          <SocketProvider>
            <Routes>
              <Route path="/" element={<ChatApp />} />
            </Routes>
          </SocketProvider>
        </ChatProvider>
      </SignedIn>
      <SignedOut>
        <div className="flex h-screen w-screen bg-background overflow-hidden justify-center items-center">
          <SignIn
            afterSignOutUrl={"/"}
            afterSignUpUrl={"/"}
            afterSignInUrl={"/"}
          />
        </div>
      </SignedOut>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
