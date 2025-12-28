import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Smile, X, FileIcon, Loader2 } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { uploadToCloudinary } from "@/lib/api";

type Props = {
  messageInput: string;
  onChangeMessage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: (
    content: string,
    files?: { url: string; name: string; bytes: number }[]
  ) => void;
  onEmojiSelect: (emoji: string) => void;
};

export default function MessageInput({
  messageInput,
  onChangeMessage,
  onKeyPress,
  onSendMessage,
  onEmojiSelect,
}: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!messageInput.trim() && selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedFiles = [];
      for (const file of selectedFiles) {
        const url = await uploadToCloudinary(file);
        uploadedFiles.push({
          url,
          name: file.name,
          bytes: file.size,
        });
      }

      onSendMessage(
        messageInput,
        uploadedFiles.length > 0 ? uploadedFiles : undefined
      );
      setSelectedFiles([]);
    } catch (error) {
      console.error("Upload failed:", error);
      // Maybe show a toast here
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-t p-4 bg-background/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto space-y-4">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-3 pb-2">
            {selectedFiles.map((file, index) => {
              const isImage = file.type.startsWith("image/");
              return (
                <div key={index} className="relative group">
                  {isImage ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-14 h-14 object-cover rounded-lg border shadow-sm transition-transform group-hover:scale-105"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-background border rounded-full p-1 shadow-md hover:text-destructive transition-all scale-0 group-hover:scale-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-muted rounded-lg p-2 pr-10 flex items-center gap-2 max-w-50 relative border shadow-xs">
                      <FileIcon className="w-6 h-6 text-muted-foreground shrink-0" />
                      <span className="text-xs truncate font-medium">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>

          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={onChangeMessage}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="rounded-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-11 px-4 pr-12"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-transparent"
                  >
                    <Smile className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 border-none">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => onEmojiSelect(emojiData.emoji)}
                    theme={Theme.AUTO}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            size="icon"
            className="rounded-full shrink-0 h-11 w-11 shadow-lg transition-all hover:scale-105"
            disabled={
              (!messageInput.trim() && selectedFiles.length === 0) ||
              isUploading
            }
            onClick={handleSend}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
