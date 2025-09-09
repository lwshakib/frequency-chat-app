import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { getCloudinaryAuth } from "@/lib/api";
import axios from "axios";
import { File as FileIcon, Mic, Paperclip, Send, Smile, X } from "lucide-react";
import * as React from "react";

export default function MessageInput({
  messageInput,
  onChangeMessage,
  onKeyPress,
  onSendMessage,
  onEmojiAppend,
}: {
  messageInput: string;
  onChangeMessage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: (payload: {
    content: string;
    files: { url: string; name: string; bytes: number }[];
  }) => void;
  onEmojiAppend: (emoji: string) => void;
}) {
  // Emoji append is delegated to parent via onEmojiAppend
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [filePreviews, setFilePreviews] = React.useState<
    { file: File; url?: string }[]
  >([]);
  const [uploadProgress, setUploadProgress] = React.useState<number[]>([]);

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      console.log("Selected files:", files);
      const newPreviews = files.map((f) => ({
        file: f,
        url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      }));
      setFilePreviews((prev) => [...prev, ...newPreviews]);
      setUploadProgress((prev) => [
        ...prev,
        ...new Array(newPreviews.length).fill(0),
      ]);
    }
    e.target.value = "";
  };

  const removePreviewAt = (index: number) => {
    setFilePreviews((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return copy;
    });
    setUploadProgress((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  const clearAllPreviews = () => {
    setFilePreviews((prev) => {
      prev.forEach((p) => p.url && URL.revokeObjectURL(p.url));
      return [];
    });
    setUploadProgress([]);
  };

  const handleSendClick = async () => {
    const hasText = !!messageInput.trim();
    const hasFiles = filePreviews.length > 0;
    if (hasFiles && !hasText) {
      try {
        // Upload each file to Cloudinary using axios with progress
        for (let i = 0; i < filePreviews.length; i++) {
          const item = filePreviews[i];
          const auth = await getCloudinaryAuth();
          const form = new FormData();
          form.append("file", item.file);
          form.append("api_key", auth.apiKey);
          form.append("timestamp", String(auth.timestamp));
          form.append("folder", auth.folder);
          form.append("signature", auth.signature);

          const uploadUrl = `https://api.cloudinary.com/v1_1/${auth.cloudName}/auto/upload`;
          const { data: json } = await axios.post(uploadUrl, form, {
            onUploadProgress: (evt) => {
              if (!evt.total) return;
              const percent = Math.round((evt.loaded * 100) / evt.total);
              setUploadProgress((prev) => {
                const copy = [...prev];
                copy[i] = percent;
                return copy;
              });
            },
          });
          console.log("Cloudinary upload success:", {
            name: item.file.name,
            secure_url: json.secure_url,
            public_id: json.public_id,
            resource_type: json.resource_type,
          });
          // Send message with only one file object per upload
          onSendMessage({
            content: "",
            files: [
              {
                url: json.secure_url,
                name: item.file.name,
                bytes: item.file.size,
              },
            ],
          });
        }
      } catch (e) {
        console.error("Failed to get Cloudinary signature(s)", e);
      } finally {
        clearAllPreviews();
      }
      return;
    }

    if (!hasText && !hasFiles) return;

    if (hasFiles && hasText) {
      try {
        const fileObjs: { url: string; name: string; bytes: number }[] = [];
        for (let i = 0; i < filePreviews.length; i++) {
          const item = filePreviews[i];
          const auth = await getCloudinaryAuth();
          const form = new FormData();
          form.append("file", item.file);
          form.append("api_key", auth.apiKey);
          form.append("timestamp", String(auth.timestamp));
          form.append("folder", auth.folder);
          form.append("signature", auth.signature);
          const uploadUrl = `https://api.cloudinary.com/v1_1/${auth.cloudName}/auto/upload`;
          const { data: json } = await axios.post(uploadUrl, form, {
            onUploadProgress: (evt) => {
              if (!evt.total) return;
              const percent = Math.round((evt.loaded * 100) / evt.total);
              setUploadProgress((prev) => {
                const copy = [...prev];
                copy[i] = percent;
                return copy;
              });
            },
          });
          fileObjs.push({
            url: json.secure_url,
            name: item.file.name,
            bytes: item.file.size,
          });
        }
        onSendMessage({ content: messageInput.trim(), files: fileObjs });
      } catch (e) {
        console.error("Failed to upload files for mixed message", e);
      } finally {
        clearAllPreviews();
      }
      return;
    }

    // text only
    onSendMessage({ content: messageInput.trim(), files: [] });
  };

  return (
    <div className="border-t p-4 shrink-0">
      {filePreviews.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {filePreviews.length} file{filePreviews.length > 1 ? "s" : ""}{" "}
              selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={clearAllPreviews}
            >
              Clear
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filePreviews.map((item, idx) => (
              <div key={idx} className="relative">
                {item.url ? (
                  <img
                    src={item.url}
                    alt={item.file.name}
                    className="h-16 w-16 rounded object-cover border"
                  />
                ) : (
                  <div className="h-16 w-40 overflow-hidden rounded border px-2 py-1 flex items-center gap-2 bg-muted/40">
                    <FileIcon className="h-4 w-4" />
                    <span className="text-xs truncate" title={item.file.name}>
                      {item.file.name}
                    </span>
                  </div>
                )}
                <div className="mt-1">
                  <Progress
                    value={uploadProgress[idx] ?? 0}
                    className="h-1 w-40"
                  />
                  <span className="sr-only">{uploadProgress[idx] ?? 0}%</span>
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => removePreviewAt(idx)}
                  aria-label="Remove file"
                  title="Remove file"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Hidden file input for direct selection (images + docs) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePaperclipClick}
          aria-label="Upload files"
          title="Upload files"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

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
          onClick={handleSendClick}
          disabled={!messageInput.trim() && filePreviews.length === 0}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
