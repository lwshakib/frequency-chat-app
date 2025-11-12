import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { getCloudinaryAuth } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/lib/logger";
import axios from "axios";
import {
  File as FileIcon,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Smile,
  X,
} from "lucide-react";
import * as React from "react";
import AudioRecorder from "./AudioRecorder";

// Minimal Web Speech API typings to avoid `any`
type WebSpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};

type WebSpeechRecognitionEvent = {
  resultIndex: number;
  results: WebSpeechRecognitionResult[];
};

type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: WebSpeechRecognitionEvent) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => WebSpeechRecognition;

type WithSpeechWindow = Window & {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
};

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
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const isMobile = useIsMobile();

  // Scroll input into view when focused on mobile
  const handleInputFocus = React.useCallback(() => {
    if (isMobile && inputRef.current) {
      // Small delay to ensure keyboard is opening
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  }, [isMobile]);

  // Handle viewport resize on mobile (keyboard open/close)
  React.useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      // Ensure input stays visible when keyboard appears
      if (inputRef.current && document.activeElement === inputRef.current) {
        setTimeout(() => {
          inputRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
    };

    // Use visualViewport API if available (better for mobile keyboards)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      return () => {
        window.visualViewport?.removeEventListener("resize", handleResize);
      };
    } else {
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isMobile]);
  const [filePreviews, setFilePreviews] = React.useState<
    { file: File; url?: string }[]
  >([]);
  const [uploadProgress, setUploadProgress] = React.useState<number[]>([]);
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<WebSpeechRecognition | null>(null);
  const handleRecordedFile = (file: File) => {
    setFilePreviews((prev) => [...prev, { file }]);
    setUploadProgress((prev) => [...prev, 0]);
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      logger.debug("Selected files:", files);
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
    if (!hasText && !hasFiles) return;

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

      onSendMessage({
        content: hasText ? messageInput.trim() : "",
        files: fileObjs,
      });
    } catch (e) {
      logger.error("Failed to upload files", e);
    } finally {
      clearAllPreviews();
    }
  };

  // Speech-to-text (Web Speech API)
  const toggleListening = async () => {
    try {
      const speechWindow = window as WithSpeechWindow;
      const SpeechRecognitionCtor =
        speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        logger.warn("Speech recognition not supported in this browser.");
        return;
      }

      if (!isListening) {
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: WebSpeechRecognitionEvent) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            }
          }
          if (finalTranscript) {
            onEmojiAppend(finalTranscript + " ");
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
          recognition.stop();
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } else {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
    } catch (err) {
      logger.error("Speech recognition error", err);
      setIsListening(false);
    }
  };

  // Audio recording moved into AudioRecorder component

  return (
    <div className="border-t p-4 shrink-0 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-inset-bottom">
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
                    className="h-16 w-16 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="h-16 w-40 overflow-hidden rounded-lg border px-2 py-1 flex items-center gap-2 bg-muted/40">
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
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-sm"
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
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        <div className="flex-1">
          <div className="relative flex items-center gap-2 rounded-full border bg-muted/40 px-2 py-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handlePaperclipClick}
              aria-label="Upload files"
              title="Upload files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Input
              ref={inputRef}
              placeholder="Type a message..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              value={messageInput}
              onChange={onChangeMessage}
              onKeyPress={onKeyPress}
              onFocus={handleInputFocus}
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Insert emoji"
                  title="Insert emoji"
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
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleListening}
            aria-label={
              isListening ? "Stop speech to text" : "Start speech to text"
            }
            title={isListening ? "Stop speech to text" : "Start speech to text"}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <AudioRecorder onRecorded={handleRecordedFile} />
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
    </div>
  );
}
