import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, Square, X } from "lucide-react";
import { useRef, useState } from "react";

interface AudioCaptureProps {
  onAudioRecorded: (
    audioBlob: Blob,
    audioUrl: string,
    initialMessage: any
  ) => void;
  onCancel: () => void;
}

export function AudioCapture({ onAudioRecorded, onCancel }: AudioCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setIsRecording(false);
        setRecordingTime(0);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setIsRecording(false);
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioUrl(null);

      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }
    onCancel();
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSend = async () => {
    if (audioBlob && audioUrl) {
      // Create a temporary message ID for loading state
      const tempMessageId = Date.now().toString() + Math.random();

      // Create initial message object with loading state
      const initialMessageJson = {
        id: tempMessageId,
        sender: {
          clerkId: "", // Will be filled by parent component
          name: "",
          email: "",
          imageUrl: "",
        },
        content: "",
        files: [], // Will be updated after upload
        type: "audio",
        isRead: "UNREAD",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLoading: true,
      };

      // Call the parent callback with the audio blob and initial message
      onAudioRecorded(audioBlob, audioUrl, initialMessageJson);
    }
  };

  const handleRetry = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  return (
    <div className="border-t border-border/50 bg-background/95 backdrop-blur-sm">
      {/* Recording State */}
      {isRecording && (
        <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-destructive">
                  Recording voice message...
                </p>
                <p className="text-xs text-destructive/70">
                  {formatTime(recordingTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={stopRecording}
                className="h-8 px-3 bg-destructive/20 hover:bg-destructive/30"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelRecording}
                className="text-destructive hover:text-destructive/80 h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Preview State */}
      {audioUrl && !isRecording && (
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
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
              <div>
                <p className="text-sm font-medium">Voice message recorded</p>
                <p className="text-xs text-muted-foreground">Tap to preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={playAudio}
                className="h-8 px-3 bg-primary/20 hover:bg-primary/30"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="h-8 px-3"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelRecording}
                className="text-destructive hover:text-destructive/80 h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Hidden audio element for playback */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="hidden"
          />
        </div>
      )}

      {/* Main Input Area */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Recording Button */}
          {!isRecording && !audioUrl && (
            <Button
              onClick={startRecording}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 transition-all duration-200"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </Button>
          )}

          {/* Send Button */}
          {audioUrl && !isRecording && (
            <Button
              onClick={handleSend}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 transition-all duration-200"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Send Voice Message
            </Button>
          )}

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={cancelRecording}
            className="h-12 px-4"
          >
            Cancel
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            {!isRecording &&
              !audioUrl &&
              "Tap to start recording your voice message"}
            {isRecording && "Recording in progress... Tap the square to stop"}
            {audioUrl &&
              !isRecording &&
              "Preview your recording before sending"}
          </p>
        </div>
      </div>
    </div>
  );
}
