import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RecordingOverlayProps {
  isVisible: boolean;
  partialTranscript: string;
  committedTranscript: string;
  isInCancelZone?: boolean;
}

const RecordingOverlay = ({
  isVisible,
  partialTranscript,
  committedTranscript,
  isInCancelZone = false,
}: RecordingOverlayProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for recording duration
  useEffect(() => {
    if (!isVisible) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const displayTranscript = committedTranscript + (partialTranscript ? ` ${partialTranscript}` : "");

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "mb-2 rounded-xl border p-3 transition-colors duration-200",
        isInCancelZone 
          ? "border-destructive/50 bg-destructive/10" 
          : "border-border bg-muted/50"
      )}
    >
      {/* Transcript display */}
      <div className="min-h-[2rem] mb-2">
        {displayTranscript ? (
          <p className="text-sm text-foreground leading-relaxed">
            {displayTranscript.trim()}
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary animate-pulse align-middle" />
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Listening...
          </p>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/70">◀ Slide to cancel</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Recording indicator */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default RecordingOverlay;
