import { cn } from "@/lib/utils";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceOrbProps {
  state: VoiceState;
  className?: string;
}

const VoiceOrb = ({ state, className }: VoiceOrbProps) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer glow rings */}
      <div
        className={cn(
          "absolute h-48 w-48 rounded-full transition-all duration-500",
          state === "idle" && "animate-pulse bg-primary/10",
          state === "listening" && "animate-pulse bg-primary/20",
          state === "processing" && "animate-spin bg-primary/15",
          state === "speaking" && "animate-ping bg-primary/25"
        )}
      />
      <div
        className={cn(
          "absolute h-40 w-40 rounded-full transition-all duration-300",
          state === "idle" && "bg-primary/15",
          state === "listening" && "animate-pulse bg-primary/30",
          state === "processing" && "animate-pulse bg-primary/25",
          state === "speaking" && "animate-pulse bg-primary/40"
        )}
      />
      
      {/* Main orb */}
      <div
        className={cn(
          "relative h-32 w-32 rounded-full shadow-lg transition-all duration-300",
          "bg-gradient-to-br from-primary to-primary/80",
          state === "idle" && "scale-100",
          state === "listening" && "scale-105",
          state === "processing" && "scale-95",
          state === "speaking" && "scale-110"
        )}
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
                className="h-8 w-1.5 animate-pulse rounded-full bg-primary-foreground/80"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.4 + i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceOrb;
