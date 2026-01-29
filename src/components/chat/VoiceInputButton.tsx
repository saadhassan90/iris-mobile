import { useRef, useCallback, useState } from "react";
import { Mic, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  isRecording: boolean;
  isConnecting: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  disabled?: boolean;
}

const CANCEL_THRESHOLD = -80; // pixels to swipe left to cancel

const VoiceInputButton = ({
  isRecording,
  isConnecting,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  disabled = false,
}: VoiceInputButtonProps) => {
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const startXRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled || isConnecting) return;
    
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    startXRef.current = e.clientX;
    isActiveRef.current = true;
    setIsInCancelZone(false);
    setSlideOffset(0);
    
    onStartRecording();
  }, [disabled, isConnecting, onStartRecording]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isActiveRef.current || !isRecording) return;
    
    const deltaX = e.clientX - startXRef.current;
    const clampedDelta = Math.min(0, Math.max(deltaX, CANCEL_THRESHOLD * 1.5));
    
    setSlideOffset(clampedDelta);
    setIsInCancelZone(deltaX < CANCEL_THRESHOLD);
  }, [isRecording]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isActiveRef.current) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);
    isActiveRef.current = false;
    
    if (isInCancelZone) {
      onCancelRecording();
    } else if (isRecording) {
      onStopRecording();
    }
    
    setIsInCancelZone(false);
    setSlideOffset(0);
  }, [isRecording, isInCancelZone, onStopRecording, onCancelRecording]);

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    // Only trigger if we're actively recording and pointer leaves
    if (isActiveRef.current && isRecording && !isInCancelZone) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      isActiveRef.current = false;
      onStopRecording();
      setSlideOffset(0);
    }
  }, [isRecording, isInCancelZone, onStopRecording]);

  return (
    <div className="relative flex items-center">
      {/* Cancel zone indicator */}
      {isRecording && (
        <div 
          className={cn(
            "absolute right-full mr-2 flex items-center gap-1 text-xs whitespace-nowrap transition-opacity duration-200",
            isInCancelZone ? "text-destructive opacity-100" : "text-muted-foreground opacity-70"
          )}
        >
          {isInCancelZone ? (
            <>
              <X className="h-3 w-3" />
              <span>Release to cancel</span>
            </>
          ) : (
            <>
              <span>◀ Slide to cancel</span>
            </>
          )}
        </div>
      )}

      {/* Mic button */}
      <Button
        variant={isRecording ? "destructive" : "ghost"}
        size="icon"
        className={cn(
          "h-10 w-10 shrink-0 rounded-full transition-all touch-none select-none",
          isRecording && "animate-pulse",
          !isRecording && !isConnecting && "text-muted-foreground hover:text-foreground"
        )}
        style={{
          transform: isRecording ? `translateX(${slideOffset}px)` : undefined,
        }}
        disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
      >
        {isConnecting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isInCancelZone ? (
          <X className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};

export default VoiceInputButton;
