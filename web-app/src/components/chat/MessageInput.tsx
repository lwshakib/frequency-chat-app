import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Camera, File, Image, Mic, Paperclip, Send, Smile } from "lucide-react";
import * as React from "react";

export default function MessageInput({
  messageInput,
  onChangeMessage,
  onKeyPress,
  onSend,
  onEmojiAppend,
}: {
  messageInput: string;
  onChangeMessage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onEmojiAppend: (emoji: string) => void;
}) {
  // Emoji append is delegated to parent via onEmojiAppend

  return (
    <div className="border-t p-4 shrink-0">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Paperclip className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>
              <Image className="h-4 w-4 mr-2" />
              Photo
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </DropdownMenuItem>
            <DropdownMenuItem>
              <File className="h-4 w-4 mr-2" />
              Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 relative">
          <Input
            placeholder="Type a message..."
            className="pr-20"
            value={messageInput}
            onChange={onChangeMessage}
            onKeyPress={onKeyPress}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Emojis</h4>
                <div className="grid grid-cols-8 gap-1">
                  {[
                    "😀",
                    "😂",
                    "😍",
                    "🥰",
                    "😎",
                    "🤔",
                    "😢",
                    "😡",
                    "👍",
                    "👎",
                    "❤️",
                    "🔥",
                    "💯",
                    "🎉",
                    "👏",
                    "🙌",
                    "😊",
                    "😘",
                    "🤗",
                    "😴",
                    "🤤",
                    "😋",
                    "🥳",
                    "😇",
                  ].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg hover:bg-muted"
                      onClick={() => onEmojiAppend(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="h-8 w-8"
          onClick={onSend}
          disabled={!messageInput.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
