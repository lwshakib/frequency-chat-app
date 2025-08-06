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
import { useTheme } from "@/contexts/ThemeContext";
import { useChat } from "@/hooks/useChat";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { FileText, Image, Mic, Paperclip, Send, Smile, X } from "lucide-react";
import React, { useRef, useState } from "react";

export function MessageInput() {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, state } = useChat();
  const { theme } = useTheme();

  const handleSend = () => {
    if (
      (message.trim() || selectedFiles.length > 0) &&
      state.selectedContactId
    ) {
      if (selectedFiles.length > 0) {
        console.log("Sending files:", selectedFiles);
        // Handle file upload logic here
      }
      if (message.trim()) {
        sendMessage(message);
      }
      setMessage("");
      setSelectedFiles([]);
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

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      console.log("Starting voice recording...");
    } else {
      console.log("Stopping voice recording...");
    }
  };

  if (!state.selectedContactId) {
    return null;
  }

  const hasContent = message.trim() || selectedFiles.length > 0;

  return (
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

      {/* Recording Indicator */}
      {isRecording && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
              <span className="text-sm text-destructive font-medium">
                Recording voice message...
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleRecording}
              className="text-destructive hover:text-destructive/80 h-8"
            >
              Cancel
            </Button>
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
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[48px] max-h-32 resize-none border-0 bg-transparent px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin"
                rows={1}
                disabled={isRecording}
              />

              {/* Emoji Button */}
              <div className="absolute right-2 bottom-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all duration-200"
                      disabled={isRecording}
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
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "secondary"}
                className="h-12 w-12 rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Mic
                  className={`h-5 w-5 ${isRecording ? "animate-pulse" : ""}`}
                />
              </Button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Online</span>
          </div>
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
  );
}
