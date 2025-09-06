import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import { Route, Routes } from "react-router";
import { Toaster } from "sonner";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <>
      <SignedIn>
        <Routes>
          <Route path="/" element={<ChatPage />} />
        </Routes>
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
    </>
  );
}

export default App;
