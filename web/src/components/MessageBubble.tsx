import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface MessageBubbleProps {
  message: any;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex mb-2",
        message.isOwn ? "justify-end" : "justify-start"
      )}
    >
      <Card
        className={cn(
          "px-4 py-2 rounded-2xl max-w-[70%] flex flex-col gap-1 shadow-sm border-none",
          message.isOwn
            ? "bg-muted text-muted-foreground rounded-br-md"
            : "bg-muted text-muted-foreground rounded-bl-md"
        )}
      >
        {/* Sender details inside the bubble, only for non-own messages */}
        {!message.isOwn && message.sender && (
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="size-6">
              {message.sender.imageUrl ? (
                <AvatarImage
                  src={message.sender.imageUrl}
                  alt={message.sender.name || "Sender"}
                />
              ) : (
                <AvatarFallback>
                  {message.sender.name ? message.sender.name[0] : "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <Badge variant="secondary" className="text-xs font-semibold">
              {message.sender.name || "Unknown"}
            </Badge>
          </div>
        )}

        {/* Loading state for file uploads */}
        {message.isLoading && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Uploading files...</p>
                <p className="text-xs text-muted-foreground">
                  {message.files && message.files.length > 0
                    ? `${message.files.length} file${
                        message.files.length > 1 ? "s" : ""
                      } being uploaded`
                    : "Please wait"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error state for failed uploads */}
        {message.error && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex-shrink-0 w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">
                  Upload failed
                </p>
                <p className="text-xs text-destructive/70">{message.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* File attachments */}
        {message.files && message.files.length > 0 && (
          <div className="mt-3 space-y-2">
            {/* File count indicator */}
            {message.files.length > 1 && (
              <div className="text-xs text-muted-foreground/70 mb-2">
                {message.files.length} file{message.files.length > 1 ? "s" : ""}{" "}
                attached
              </div>
            )}

            <div className="grid gap-2 max-w-sm">
              {message.files.map((fileUrl: string, index: number) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl);
                const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(fileUrl);
                const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(fileUrl);
                const fileName = fileUrl.split("/").pop() || "file";
                const fileExtension =
                  fileName.split(".").pop()?.toUpperCase() || "FILE";

                return (
                  <div key={index} className="group">
                    {isImage ? (
                      <div className="relative overflow-hidden rounded-lg border border-border/50">
                        <img
                          src={fileUrl}
                          alt={fileName}
                          className="w-full h-auto max-h-64 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                          onClick={() => window.open(fileUrl, "_blank")}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="bg-black/60 text-white text-xs px-2 py-1 rounded truncate">
                            {fileName}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement("a");
                              link.href = fileUrl;
                              link.download = fileName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                            title="Download image"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : isVideo ? (
                      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/20 group">
                        <video
                          src={fileUrl}
                          controls
                          className="w-full h-auto max-h-48 object-cover"
                          preload="metadata"
                        />
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="bg-black/60 text-white text-xs px-2 py-1 rounded truncate">
                            {fileName}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement("a");
                              link.href = fileUrl;
                              link.download = fileName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                            title="Download video"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : isAudio ? (
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Audio file
                          </p>
                        </div>
                        <button
                          onClick={() => window.open(fileUrl, "_blank")}
                          className="flex-shrink-0 p-2 hover:bg-primary/20 text-primary rounded-full transition-colors"
                          title="Open audio"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
                          <div className="text-xs font-semibold text-muted-foreground">
                            {fileExtension}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Document
                          </p>
                        </div>
                        <button
                          onClick={() => window.open(fileUrl, "_blank")}
                          className="flex-shrink-0 p-2 hover:bg-muted/50 rounded-full transition-colors"
                          title="Open file"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Text content - shown after files if both exist */}
        {message.content && (
          <div className="text-sm leading-relaxed break-words whitespace-pre-wrap mt-2">
            {message.content}
          </div>
        )}

        <div
          className={cn(
            "text-xs mt-1 opacity-70",
            message.isOwn ? "text-right" : "text-left"
          )}
        >
          {formatDistanceToNow(message.updatedAt)} ago
        </div>
        {/* Message status ticks for own messages, but not for group messages */}
        {message.isOwn && !message.isGroup && (
          <div className="flex justify-end mt-1">
            {message.isRead === "UNREAD" && (
              <div className="flex items-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            {message.isRead === "SENT" && (
              <div className="flex items-center gap-0.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            {message.isRead === "READ" && (
              <div className="flex items-center gap-0.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
