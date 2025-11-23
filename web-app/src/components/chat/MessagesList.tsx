import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message } from "@/types";
import {
  Copy as CopyIcon,
  CornerUpLeft,
  Download,
  ExternalLink,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as React from "react";

type VideoPlayerProps = {
  src: string;
  poster?: string;
};

const VIDEO_MIME_MAP: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
};

function getVideoMimeType(url: string) {
  const clean = url.split("?")[0];
  const ext = (clean.split(".").pop() || "").toLowerCase();
  return VIDEO_MIME_MAP[ext] ?? "video/mp4";
}

function VideoMessagePlayer({ src, poster }: VideoPlayerProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border bg-black/90">
      <video
        controls
        poster={poster}
        className="max-h-64 w-full bg-black object-contain"
      >
        <source src={src} type={getVideoMimeType(src)} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

type AudioPlayerProps = {
  src: string;
};

function formatAudioTime(seconds: number) {
  if (!isFinite(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
}

function InlineAudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleScrub = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const value = Number(event.target.value);
    audio.currentTime = (value / 100) * audio.duration;
    setProgress(value);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  return (
    <div className="w-full max-w-[320px] rounded-md border bg-muted/40 px-3 py-2">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={handleScrub}
            className="w-full accent-primary"
            aria-label="Audio progress"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function MessagesList({
  messages,
  isCurrentUser,
  getInitials,
  formatMessageTime,
}: {
  messages: Message[];
  isCurrentUser: (senderId: string) => boolean;
  getInitials: (name: string) => string;
  formatMessageTime: (date: Date) => string;
}) {
  const getExt = (url: string) => {
    const clean = url.split("?")[0];
    const parts = clean.split(".");
    return (parts.pop() || "").toLowerCase();
  };

  const pickIcon = (ext: string) => {
    if (
      ext === "pdf" ||
      ext === "doc" ||
      ext === "docx" ||
      ext === "ppt" ||
      ext === "pptx"
    )
      return <FileText className="h-4 w-4" />;
    if (ext === "xls" || ext === "xlsx" || ext === "csv")
      return <FileSpreadsheet className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const getFileName = (url: string) => {
    try {
      const clean = url.split("?")[0];
      const segments = clean.split("/");
      return decodeURIComponent(segments[segments.length - 1]);
    } catch {
      return url;
    }
  };

  const toDate = (value: Date | string | number) => {
    return value instanceof Date ? value : new Date(value);
  };

  const isSameDay = (a: Date | string | number, b: Date | string | number) => {
    const da = toDate(a);
    const db = toDate(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  };

  const shouldGroupWithPrev = (curr: Message, prev?: Message) => {
    if (!prev) return false;
    if (prev.senderId !== curr.senderId) return false;
    if (!isSameDay(prev.createdAt, curr.createdAt)) return false;
    const deltaMs = Math.abs(
      new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime()
    );
    // group if within 5 minutes
    return deltaMs < 5 * 60 * 1000;
  };

  const dateFormatter = React.useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  type RenderItem =
    | { kind: "date"; key: string; label: string }
    | {
        kind: "message";
        key: string;
        message: Message;
        own: boolean;
        showAvatar: boolean;
        isFirstInGroup: boolean;
        isLastInGroup: boolean;
      };

  const items: RenderItem[] = [];
  let prev: Message | undefined = undefined;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const own = isCurrentUser(m.senderId);

    // Insert date separator when day changes from previous
    if (!prev || !isSameDay(prev.createdAt, m.createdAt)) {
      const label = dateFormatter.format(new Date(m.createdAt));
      items.push({ kind: "date", key: `date-${label}-${i}`, label });
    }

    const groupedWithPrev = shouldGroupWithPrev(m, prev);
    const next = messages[i + 1];
    const groupedWithNext = next ? shouldGroupWithPrev(next, m) : false;

    items.push({
      kind: "message",
      key: m.id,
      message: m,
      own,
      showAvatar: !own && !groupedWithNext, // show avatar at group end for others
      isFirstInGroup: !groupedWithPrev,
      isLastInGroup: !groupedWithNext,
    });

    prev = m;
  }

  const Bubble: React.FC<{
    children: React.ReactNode;
    own: boolean;
    rounded: string;
  }> = ({ children, own, rounded }) => {
    const base = "px-3 py-2 text-sm shadow-sm border transition-colors";
    const ownClasses = "bg-primary text-primary-foreground border-primary/60";
    const otherClasses = "bg-muted text-foreground border-muted-foreground/10";
    return (
      <div className={`${base} ${own ? ownClasses : otherClasses} ${rounded}`}>
        {children}
      </div>
    );
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // noop
    }
  };

  return (
    <div className="space-y-3">
      {items.map((it, idx) => {
        if (it.kind === "date") {
          return (
            <div key={it.key} className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{it.label}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          );
        }

        const { message, own, showAvatar, isFirstInGroup, isLastInGroup } = it;

        const rowJustify = own ? "justify-end" : "justify-start";
        const rowDir = own
          ? "flex-row-reverse space-x-2 space-x-reverse"
          : "flex-row space-x-2";

        // bubble corner rounding depending on grouping
        const rounded = own
          ? `${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-md"} ${
              isLastInGroup ? "rounded-b-2xl" : "rounded-b-md"
            } rounded-l-2xl`
          : `${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-md"} ${
              isLastInGroup ? "rounded-b-2xl" : "rounded-b-md"
            } rounded-r-2xl`;

        const iconColor = "text-black dark:text-white";

        return (
          <div key={it.key} className={`flex ${rowJustify}`}>
            <div className={`flex max-w-[72%] items-end ${rowDir}`}>
              {!own ? (
                showAvatar ? (
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage
                      src={message.sender?.imageUrl || undefined}
                      alt={
                        message.sender?.name || message.sender?.email || "User"
                      }
                    />
                    <AvatarFallback className="text-[10px] font-medium">
                      {getInitials(message.sender.name || message.sender.email)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-7 w-7" />
                )
              ) : (
                <div className="h-7 w-7" />
              )}

              <div
                className={`flex flex-col gap-1 ${
                  own ? "items-end text-right" : ""
                }`}
              >
                {!own && isFirstInGroup && (
                  <span className="text-[11px] text-muted-foreground">
                    {message.sender?.name || message.sender?.email || "User"}
                  </span>
                )}
                {/* Files */}
                {message.files && message.files.length > 0 && (
                  <div className="space-y-2">
                    {message.files.map((fileRef, fidx) => {
                      const url =
                        typeof fileRef === "string" ? fileRef : fileRef.url;
                      const displayName =
                        typeof fileRef === "string"
                          ? getFileName(url)
                          : fileRef.name || getFileName(url);
                      const baseUrl = url.split("?")[0];
                      const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(
                        baseUrl
                      );
                      const isVideo = /\.(mp4|webm|ogv|mov|mkv)$/i.test(
                        baseUrl
                      );
                      const isAudio =
                        !isVideo && /\.(mp3|wav|m4a|oga|ogg)$/i.test(baseUrl);

                      return (
                        <div key={fidx}>
                          {isImage ? (
                            <div className="inline-flex flex-col gap-2">
                              <img
                                src={url}
                                alt="attachment"
                                className="max-h-56 rounded-xl border object-contain"
                              />
                              <div className="flex gap-1 justify-end">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-background/60 border"
                                  aria-label="Open image in new tab"
                                  title="Open"
                                >
                                  <ExternalLink
                                    className={`h-4 w-4 ${iconColor}`}
                                  />
                                </a>
                                <a
                                  href={url}
                                  download
                                  className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-background/60 border"
                                  aria-label="Download image"
                                  title="Download"
                                >
                                  <Download
                                    className={`h-4 w-4 ${iconColor}`}
                                  />
                                </a>
                              </div>
                            </div>
                          ) : isVideo ? (
                            <div className="relative inline-block w-full max-w-sm">
                              <VideoMessagePlayer src={url} />
                              <div className="absolute top-1 right-1 flex gap-1">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center h-7 w-7 rounded bg-background/80 hover:bg-background border"
                                  aria-label="Open video in new tab"
                                  title="Open"
                                >
                                  <ExternalLink
                                    className={`h-4 w-4 ${iconColor}`}
                                  />
                                </a>
                                <a
                                  href={url}
                                  download
                                  className="inline-flex items-center justify-center h-7 w-7 rounded bg-background/80 hover:bg-background border"
                                  aria-label="Download video"
                                  title="Download"
                                >
                                  <Download
                                    className={`h-4 w-4 ${iconColor}`}
                                  />
                                </a>
                              </div>
                            </div>
                          ) : isAudio ? (
                            <div className="inline-flex flex-col gap-2">
                              <InlineAudioPlayer src={url} />
                              <div className="flex gap-1 justify-end">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-background/60 border"
                                  aria-label="Open audio in new tab"
                                  title="Open"
                                >
                                  <ExternalLink
                                    className={`h-4 w-4 ${iconColor}`}
                                  />
                                </a>
                                <a
                                  href={url}
                                  download
                                  className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-background/60 border"
                                  aria-label="Download audio"
                                  title="Download"
                                >
                                  <Download
                                    className={`h-4 w-4 ${iconColor}`}
                                  />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2 py-1 w-64 overflow-hidden">
                              {pickIcon(getExt(url))}
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs truncate underline"
                                title={displayName}
                              >
                                {displayName}
                              </a>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted"
                                aria-label="Open file in new tab"
                                title="Open"
                              >
                                <ExternalLink
                                  className={`h-4 w-4 ${iconColor}`}
                                />
                              </a>
                              <a
                                href={url}
                                download
                                className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted"
                                aria-label="Download file"
                                title="Download"
                              >
                                <Download className={`h-4 w-4 ${iconColor}`} />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text bubble */}
                {message.content && (
                  <div className="relative group">
                    <Bubble own={own} rounded={rounded}>
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </Bubble>
                    <div
                      className={`absolute -top-3 ${
                        own ? "right-2" : "left-2"
                      } opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                      <div className="flex items-center gap-1 rounded-full bg-background/90 border px-1 py-0.5 shadow-sm">
                        <button
                          type="button"
                          className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-muted"
                          aria-label="Copy message"
                          onClick={() => handleCopy(message.content!)}
                          title="Copy"
                        >
                          <CopyIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-muted"
                          aria-label="Reply"
                          title="Reply"
                          // Placeholder; implement callback in parent when available
                          onClick={() => {}}
                        >
                          <CornerUpLeft className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[10px] mt-0.5 text-muted-foreground">
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
