"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  label: string;
  placeholder?: string;
  className?: string;
}

/**
 * InlineEditField Component
 *
 * A reusable inline edit field component.
 * - Click/tap to enter edit mode
 * - Blur or Enter to save
 * - Escape to cancel
 * - Shows loading state during save
 * - Displays inline error messages on validation failure
 */
export function InlineEditField({
  value,
  onSave,
  label,
  placeholder,
  className,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep editValue in sync with value prop when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus and select input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    // Skip save if value unchanged
    if (editValue === value) {
      setIsEditing(false);
      setError(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(editValue);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      // Display inline error message
      const errorMessage = err instanceof Error ? err.message : "Save failed";
      setError(errorMessage);
      // Keep in edit mode so user can correct the value
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            className={cn("flex-1 min-h-[44px]", error && "border-destructive")}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={error ? `${label}-error` : undefined}
          />
          {isSaving && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {error && (
          <p
            id={`${label}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        "flex items-center justify-between w-full p-3 min-h-[44px] text-left",
        "hover:bg-muted/50 rounded-md transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        className
      )}
      aria-label={`Edit ${label}`}
    >
      <span className={value ? "" : "text-muted-foreground"}>
        {value || placeholder}
      </span>
      <Pencil className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
