import { cn } from "@/lib/utils";

interface StatDisplayProps {
  value: number;
  label: string;
  variant?: "large" | "medium" | "small";
  className?: string;
}

export function StatDisplay({
  value,
  label,
  variant = "medium",
  className,
}: StatDisplayProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span
        className={cn(
          "font-bold",
          variant === "large" && "text-4xl",
          variant === "medium" && "text-2xl",
          variant === "small" && "text-lg",
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          "text-muted-foreground",
          variant === "large" && "text-sm mt-1",
          variant === "medium" && "text-xs mt-0.5",
          variant === "small" && "text-xs",
        )}
      >
        {label}
      </span>
    </div>
  );
}
