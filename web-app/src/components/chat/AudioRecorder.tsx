import { Button } from "@/components/ui/button";
import { Circle, Square } from "lucide-react";
import * as React from "react";

type AudioRecorderProps = {
  onRecorded: (file: File) => void;
};

export default function AudioRecorder({ onRecorded }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<BlobPart[]>([]);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const intervalRef = React.useRef<number | null>(null);

  const startTimer = () => {
    const start = Date.now();
    setElapsedMs(0);
    intervalRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 200);
  };

  const stopTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => {
      // cleanup on unmount
      stopTimer();
    };
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const toggleRecording = async () => {
    try {
      if (!isRecording) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, {
            type: "audio/webm",
          });
          const file = new File([blob], `recording-${Date.now()}.webm`, {
            type: "audio/webm",
          });
          onRecorded(file);
          // stop all tracks
          stream.getTracks().forEach((t) => t.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        startTimer();
        setIsRecording(true);
      } else {
        mediaRecorderRef.current?.stop();
        stopTimer();
        setIsRecording(false);
      }
    } catch (err) {
      console.error("Audio recording error", err);
      stopTimer();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isRecording ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={toggleRecording}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <Square className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </Button>
      {isRecording && (
        <span
          className="text-xs tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          {formatTime(elapsedMs)}
        </span>
      )}
    </div>
  );
}
