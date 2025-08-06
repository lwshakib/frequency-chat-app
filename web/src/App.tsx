import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessages } from "@/components/ChatMessages";
import { MessageInput } from "@/components/MessageInput";
import { MobileSidebar } from "@/components/MobileSidebar";
import { Sidebar } from "@/components/Sidebar";
import { ChatProvider } from "@/contexts/ChatContextProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./App.css";

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
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader />
        <ChatMessages />
        <MessageInput />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <ChatApp />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
