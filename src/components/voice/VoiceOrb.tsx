import { cn } from "@/lib/utils";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceOrbProps {
  state: VoiceState;
  inputVolume?: number;
  outputVolume?: number;
  className?: string;
}

const VoiceOrb = ({ state, inputVolume = 0, outputVolume = 0, className }: VoiceOrbProps) => {
  // Calculate dynamic scale based on audio levels
  const activeVolume = state === "speaking" ? outputVolume : inputVolume;
  const volumeScale = 1 + activeVolume * 0.3;
  
  // Calculate glow intensity based on volume
  const glowIntensity = Math.min(activeVolume * 2, 1);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer glow rings */}
      <div
        className={cn(
          "absolute h-48 w-48 rounded-full transition-all duration-300",
          state === "idle" && "animate-pulse bg-primary/10",
          state === "listening" && "bg-primary/20",
          state === "processing" && "animate-spin bg-primary/15",
          state === "speaking" && "bg-primary/25"
        )}
        style={{
          transform: `scale(${1 + activeVolume * 0.2})`,
          opacity: 0.5 + glowIntensity * 0.5,
        }}
      />
      <div
        className={cn(
          "absolute h-40 w-40 rounded-full transition-all duration-200",
          state === "idle" && "bg-primary/15",
          state === "listening" && "bg-primary/30",
          state === "processing" && "animate-pulse bg-primary/25",
          state === "speaking" && "bg-primary/40"
        )}
        style={{
          transform: `scale(${1 + activeVolume * 0.15})`,
        }}
      />
      
      {/* Main orb */}
      <div
        className={cn(
          "relative h-32 w-32 rounded-full shadow-lg transition-all duration-200",
          "bg-gradient-to-br from-primary to-primary/80",
          state === "idle" && "scale-100",
          state === "processing" && "scale-95"
        )}
        style={{
          transform: `scale(${volumeScale})`,
          boxShadow: state !== "idle" 
            ? `0 0 ${30 + glowIntensity * 40}px ${10 + glowIntensity * 20}px hsl(var(--primary) / ${0.3 + glowIntensity * 0.3})`
            : undefined,
        }}
      >
        {/* Inner highlight */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary-foreground/20 to-transparent" />
        
        {/* Processing spinner */}
        {state === "processing" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary-foreground/30 border-t-primary-foreground" />
          </div>
        )}
        
        {/* Wave bars for speaking */}
        {state === "speaking" && (
          <div className="absolute inset-0 flex items-center justify-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-primary-foreground/80 transition-all duration-75"
                style={{
                  height: `${16 + outputVolume * 32 * (0.5 + Math.sin(Date.now() / 100 + i) * 0.5)}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Listening indicator */}
        {state === "listening" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="h-4 w-4 rounded-full bg-primary-foreground/80 transition-all duration-75"
              style={{
                transform: `scale(${1 + inputVolume * 2})`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceOrb;
