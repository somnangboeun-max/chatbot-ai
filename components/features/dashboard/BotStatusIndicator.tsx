import { cn } from "@/lib/utils";

interface BotStatusIndicatorProps {
  isActive: boolean;
  variant?: "compact" | "full";
  className?: string;
}

export function BotStatusIndicator({
  isActive,
  variant = "full",
  className,
}: BotStatusIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-block w-2 h-2 rounded-full",
          isActive ? "bg-success" : "bg-error"
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          "text-sm font-medium",
          isActive ? "text-success" : "text-error",
          variant === "compact" && "sr-only sm:not-sr-only"
        )}
      >
        {isActive ? "Active" : "Paused"}
      </span>
    </div>
  );
}
