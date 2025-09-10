import type { Message } from "@/types";
import {
  Download,
  ExternalLink,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

export default function MessagesList({
  messages,
  isCurrentUser,
  getAvatarColor,
  getInitials,
  formatMessageTime,
}: {
  messages: Message[];
  isCurrentUser: (senderId: string) => boolean;
  getAvatarColor: (id: string) => string;
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
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            isCurrentUser(message.senderId) ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`flex max-w-[70%] ${
              isCurrentUser(message.senderId) ? "flex-row-reverse" : "flex-row"
            } items-end space-x-2`}
          >
            <div
              className={`w-8 h-8 rounded-full ${getAvatarColor(
                message.senderId
              )} flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-xs text-white font-medium">
                {getInitials(message.sender.name || message.sender.email)}
              </span>
            </div>
            <div
              className={`px-4 py-2 rounded-2xl ${
                isCurrentUser(message.senderId)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.files && message.files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.files.map((fileRef, idx) => {
                    const iconColor = "text-black dark:text-white";
                    const url =
                      typeof fileRef === "string" ? fileRef : fileRef.url;
                    const displayName =
                      typeof fileRef === "string"
                        ? getFileName(url)
                        : fileRef.name || getFileName(url);
                    const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(
                      url.split("?")[0]
                    );
                    return (
                      <div key={idx} className="">
                        {isImage ? (
                          <div className="relative inline-block">
                            <img
                              src={url}
                              alt="attachment"
                              className="max-h-48 rounded border object-contain"
                            />
                            <div className="absolute top-1 right-1 flex gap-1">
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center h-7 w-7 rounded bg-background/80 hover:bg-background border"
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
                                className="inline-flex items-center justify-center h-7 w-7 rounded bg-background/80 hover:bg-background border"
                                aria-label="Download image"
                                title="Download"
                              >
                                <Download className={`h-4 w-4 ${iconColor}`} />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded border bg-muted/40 px-2 py-1 w-64 overflow-hidden">
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
              {message.content && <p className="text-sm">{message.content}</p>}
              <p
                className={`text-xs mt-1 ${
                  isCurrentUser(message.senderId)
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {formatMessageTime(message.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
