import { useRef, useCallback, useState } from "react";
import { Mic, X, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const startXRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  // Desktop: Simple click toggle
  const handleDesktopClick = useCallback(() => {
    if (disabled || isConnecting) return;
    
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  }, [disabled, isConnecting, isRecording, onStartRecording, onStopRecording]);

  // Mobile: Hold-to-talk gesture handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled || isConnecting || !isMobile) return;
    
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    startXRef.current = e.clientX;
    isActiveRef.current = true;
    setIsInCancelZone(false);
    setSlideOffset(0);
    
    onStartRecording();
  }, [disabled, isConnecting, isMobile, onStartRecording]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isActiveRef.current || !isRecording || !isMobile) return;
    
    const deltaX = e.clientX - startXRef.current;
    const clampedDelta = Math.min(0, Math.max(deltaX, CANCEL_THRESHOLD * 1.5));
    
    setSlideOffset(clampedDelta);
    setIsInCancelZone(deltaX < CANCEL_THRESHOLD);
  }, [isRecording, isMobile]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isActiveRef.current || !isMobile) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);
    isActiveRef.current = false;
    
    if (isInCancelZone) {
      onCancelRecording();
    } else if (isRecording) {
      onStopRecording();
    }
    
    setIsInCancelZone(false);
    setSlideOffset(0);
  }, [isRecording, isInCancelZone, isMobile, onStopRecording, onCancelRecording]);

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    if (!isMobile) return;
    // Only trigger if we're actively recording and pointer leaves
    if (isActiveRef.current && isRecording && !isInCancelZone) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      isActiveRef.current = false;
      onStopRecording();
      setSlideOffset(0);
    }
  }, [isRecording, isInCancelZone, isMobile, onStopRecording]);

  return (
    <div className="relative flex items-center">
      {/* Cancel zone indicator - mobile only */}
      {isMobile && isRecording && (
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
          "h-10 w-10 shrink-0 rounded-full transition-all",
          isMobile && "touch-none select-none",
          isRecording && "animate-pulse",
          !isRecording && !isConnecting && "text-muted-foreground hover:text-foreground"
        )}
        style={{
          transform: isMobile && isRecording ? `translateX(${slideOffset}px)` : undefined,
        }}
        disabled={disabled}
        // Desktop: click handler
        onClick={!isMobile ? handleDesktopClick : undefined}
        // Mobile: pointer handlers for hold-to-talk
        onPointerDown={isMobile ? handlePointerDown : undefined}
        onPointerMove={isMobile ? handlePointerMove : undefined}
        onPointerUp={isMobile ? handlePointerUp : undefined}
        onPointerLeave={isMobile ? handlePointerLeave : undefined}
        onContextMenu={(e) => e.preventDefault()}
      >
        {isConnecting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isInCancelZone ? (
          <X className="h-5 w-5" />
        ) : isRecording && !isMobile ? (
          <Square className="h-4 w-4 fill-current" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};

export default VoiceInputButton;
