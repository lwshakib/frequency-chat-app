import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "@/contexts/SocketProvider";
import { useTheme } from "@/hooks/useTheme";
import { useUser } from "@clerk/clerk-react";
import { upload } from "@imagekit/react";
import axios from "axios";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { FileText, Image, Mic, Paperclip, Send, Smile, X } from "lucide-react";
import React, { useRef, useState } from "react";
import { AudioCapture } from "./AudioCapture";
export function MessageInput() {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showAudioCapture, setShowAudioCapture] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage } = useSocket();
  const { theme } = useTheme(); // useTheme now returns ThemeContextType
  const { user } = useUser();
  const {
    typing,
    startTyping,
    endTyping,
    setMessages,
    setTyping,
    selectedConversation,
    setSelectedConversation,
    setConversations,
  } = useSocket();

  const handleSend = async () => {
    if (
      (message.trim() || selectedFiles.length > 0 || audioBlob) &&
      selectedConversation?.id
    ) {
      // Store the original message content before clearing
      const originalMessage = message.trim();
      const originalFiles = [...selectedFiles];

      // Create temporary message ID
      const tempMessageId = Date.now().toString() + Math.random();

      // Create initial message object (will be updated after upload)
      const initialMessageJson = {
        id: tempMessageId,
        sender: {
          clerkId: user?.id || "",
          name: user?.fullName || "",
          email: user?.emailAddresses[0].emailAddress || "",
          imageUrl: user?.imageUrl || "",
        },
        content: originalMessage,
        files: originalFiles.length > 0 ? [] : undefined,
        type:
          originalFiles.length > 0
            ? originalMessage
              ? "mixed"
              : "file"
            : "text",
        isRead: "UNREAD",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLoading: originalFiles.length > 0 ? true : false, // Add loading state
      };

      // Add message to UI immediately
      setMessages((prev: any[]) => [...prev, initialMessageJson]);

      // End typing indicator
      endTyping({
        clerkId: user?.id,
        name: user?.fullName,
        email: user?.emailAddresses[0].emailAddress,
        imageUrl: user?.imageUrl,
        conversation: selectedConversation,
      });

      // Clear input fields immediately so user can send more messages
      setMessage("");
      setSelectedFiles([]);
      setAudioBlob(null);

      // Handle file uploads and API calls
      const handleFileUploadAndSend = async () => {
        let fileUrls: string[] = [];

        // Handle file uploads if there are files
        if (originalFiles.length > 0) {
          console.log("Sending files:", originalFiles);
          try {
            const uploadPromises = originalFiles.map(async (file) => {
              const resp = await axios.get("/api/imagekit-auth");
              const auth = resp.data;
              const response = await upload({
                file,
                fileName: file.name,
                folder: "frequency-chat",
                publicKey: auth.publicKey,
                token: auth.token,
                expire: auth.expire,
                signature: auth.signature,
              });
              return response;
            });

            const uploadResponses = await Promise.all(uploadPromises);
            console.log("Upload responses:", uploadResponses);
            fileUrls = uploadResponses
              .map((response) => response.url)
              .filter((url): url is string => url !== undefined);
          } catch (error) {
            console.error("Error uploading files:", error);
            // Update message to show error state
            setMessages((prev: any[]) =>
              prev.map((msg) =>
                msg.id === tempMessageId
                  ? {
                      ...msg,
                      isLoading: false,
                      error: "Failed to upload files",
                    }
                  : msg
              )
            );
            return; // Don't send message to API if file upload fails
          }
        }

        // Update the message with actual URLs and remove loading state
        setMessages((prev: any[]) =>
          prev.map((msg) =>
            msg.id === tempMessageId
              ? {
                  ...msg,
                  files: fileUrls.length > 0 ? fileUrls : undefined,
                  isLoading: false,
                }
              : msg
          )
        );

        // Create final message object for API
        const finalMessageJson = {
          id: tempMessageId,
          sender: {
            clerkId: user?.id || "",
            name: user?.fullName || "",
            email: user?.emailAddresses[0].emailAddress || "",
            imageUrl: user?.imageUrl || "",
          },
          content: originalMessage,
          files: fileUrls.length > 0 ? fileUrls : undefined,
          type:
            fileUrls.length > 0 ? (originalMessage ? "mixed" : "file") : "text",
          isRead: "UNREAD",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Handle conversation creation or message sending
        if (selectedConversation?.isTemporary) {
          const { data } = await axios.post("/api/conversations", {
            type: "single",
            ids: selectedConversation.users.map((user: any) => user.clerkId),
          });

          sendMessage({
            message: finalMessageJson,
            conversation: data.data,
            senderId: user?.id,
          });
          setConversations((prev: any[]) => [...prev, data.data]);

          // Send message to API
          axios.post("/api/messages/" + data.data.id, {
            content: originalMessage,
            type:
              fileUrls.length > 0
                ? originalMessage
                  ? "mixed"
                  : "file"
                : "text",
            files: fileUrls.length > 0 ? fileUrls : undefined,
          });

          setSelectedConversation({ ...data.data, isTemporary: false });
        } else {
          // Send message to API
          axios.post("/api/messages/" + selectedConversation.id, {
            content: originalMessage,
            type:
              fileUrls.length > 0
                ? originalMessage
                  ? "mixed"
                  : "file"
                : "text",
            files: fileUrls.length > 0 ? fileUrls : undefined,
          });

          sendMessage({
            message: finalMessageJson,
            conversation: selectedConversation,
            senderId: user?.id,
          });
        }
      };

      // Start the upload and send process
      handleFileUploadAndSend();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage((prev) => prev + emoji);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    insertEmoji(emojiData.emoji);
  };

  const handleAudioRecorded = (
    audioBlob: Blob,
    _audioUrl: string,
    initialMessage: any
  ) => {
    setAudioBlob(audioBlob);
    setShowAudioCapture(false);

    // Update the initial message with user info
    const updatedInitialMessage = {
      ...initialMessage,
      sender: {
        clerkId: user?.id || "",
        name: user?.fullName || "",
        email: user?.emailAddresses[0].emailAddress || "",
        imageUrl: user?.imageUrl || "",
      },
    };

    // Add message to UI immediately with loading state
    setMessages((prev: any[]) => [...prev, updatedInitialMessage]);

    // End typing indicator
    endTyping({
      clerkId: user?.id,
      name: user?.fullName,
      email: user?.emailAddresses[0].emailAddress,
      imageUrl: user?.imageUrl,
      conversation: selectedConversation,
    });

    // Handle audio upload and send
    handleAudioUploadAndSend(audioBlob, updatedInitialMessage.id);
  };

  const handleAudioCancel = () => {
    setShowAudioCapture(false);
    setAudioBlob(null);
  };

  const handleAudioUploadAndSend = async (
    audioBlob: Blob,
    tempMessageId: string
  ) => {
    let audioUrl: string | null = null;

    try {
      // Create a file from the blob
      const audioFile = new File([audioBlob], `audio_${Date.now()}.wav`, {
        type: "audio/wav",
      });

      const resp = await axios.get("/api/imagekit-auth");
      const auth = resp.data;
      const response = await upload({
        file: audioFile,
        fileName: audioFile.name,
        folder: "frequency-chat",
        publicKey: auth.publicKey,
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
      });

      audioUrl = response.url || null;

      // Update the message with actual audio URL and remove loading state
      setMessages((prev: any[]) =>
        prev.map((msg) =>
          msg.id === tempMessageId
            ? {
                ...msg,
                files: audioUrl ? [audioUrl] : [],
                isLoading: false,
              }
            : msg
        )
      );

      // Create final message object for API
      const finalMessageJson = {
        id: tempMessageId,
        sender: {
          clerkId: user?.id || "",
          name: user?.fullName || "",
          email: user?.emailAddresses[0].emailAddress || "",
          imageUrl: user?.imageUrl || "",
        },
        content: "",
        files: audioUrl ? [audioUrl] : [],
        type: "audio",
        isRead: "UNREAD",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Handle conversation creation or message sending
      if (selectedConversation?.isTemporary) {
        const { data } = await axios.post("/api/conversations", {
          type: "single",
          ids: selectedConversation.users.map((user: any) => user.clerkId),
        });

        sendMessage({
          message: finalMessageJson,
          conversation: data.data,
          senderId: user?.id,
        });
        setConversations((prev: any[]) => [...prev, data.data]);

        // Send message to API
        axios.post("/api/messages/" + data.data.id, {
          content: "",
          type: "audio",
          files: audioUrl ? [audioUrl] : [],
        });

        setSelectedConversation({ ...data.data, isTemporary: false });
      } else {
        // Send message to API
        axios.post("/api/messages/" + selectedConversation.id, {
          content: "",
          type: "audio",
          files: audioUrl ? [audioUrl] : [],
        });

        sendMessage({
          message: finalMessageJson,
          conversation: selectedConversation,
          senderId: user?.id,
        });
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
      // Update message to show error state
      setMessages((prev: any[]) =>
        prev.map((msg) =>
          msg.id === tempMessageId
            ? {
                ...msg,
                isLoading: false,
                error: "Failed to upload audio",
              }
            : msg
        )
      );
    }
  };
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (!typing) {
      const data = {
        clerkId: user?.id,
        name: user?.fullName,
        email: user?.emailAddresses[0].emailAddress,
        imageUrl: user?.imageUrl,
        conversation: selectedConversation,
      };
      setTyping(data);
      startTyping(data);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        setTyping(null);
        endTyping({
          clerkId: user?.id,
          name: user?.fullName,
          email: user?.emailAddresses[0].emailAddress,
          imageUrl: user?.imageUrl,
          conversation: selectedConversation,
        });
      }
    }, timerLength);
  };

  if (!selectedConversation?.id) {
    return null;
  }

  const hasContent = message.trim() || selectedFiles.length > 0 || audioBlob;

  return (
    <>
      {showAudioCapture && (
        <AudioCapture
          onAudioRecorded={handleAudioRecorded}
          onCancel={handleAudioCancel}
        />
      )}

      <div className="border-t border-border/50 bg-background/95 backdrop-blur-sm">
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="truncate max-w-32">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-destructive/20"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Input Area */}
        <div className="p-4">
          <div className="flex items-end gap-3">
            {/* File Upload Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-muted/30 hover:bg-muted/50 transition-all duration-200 flex-shrink-0"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                    }
                  }}
                  className="cursor-pointer"
                >
                  <Image className="h-4 w-4 mr-2" />
                  Upload Images
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "*";
                      fileInputRef.current.click();
                    }
                  }}
                  className="cursor-pointer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Files
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Message Input Container */}
            <div className="flex-1 relative">
              <div className="relative bg-muted/20 rounded-2xl border border-border/30 focus-within:border-primary/40 focus-within:bg-muted/30 transition-all duration-200">
                <Textarea
                  ref={textareaRef}
                  placeholder="Type a message..."
                  value={message}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  className="min-h-[48px] max-h-32 resize-none border-0 bg-transparent px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin"
                  rows={1}
                />

                {/* Emoji Button */}
                <div className="absolute right-2 bottom-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all duration-200"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" side="top" align="end">
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                        width={240}
                        height={400}
                        searchDisabled={false}
                        skinTonesDisabled={false}
                        previewConfig={{
                          showPreview: false,
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Send/Voice Button */}
            <div className="flex-shrink-0">
              {hasContent ? (
                <Button
                  onClick={handleSend}
                  className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <Send className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowAudioCapture(true)}
                  variant="secondary"
                  className="h-12 w-12 rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-end mt-2 px-1">
            <div className="text-xs text-muted-foreground">
              {message.length > 0 && `${message.length} characters`}
              {selectedFiles.length > 0 &&
                ` • ${selectedFiles.length} file${
                  selectedFiles.length > 1 ? "s" : ""
                }`}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
