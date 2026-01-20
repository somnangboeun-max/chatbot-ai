"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  TIME_OPTIONS,
  DAYS_OF_WEEK,
  formatTime12Hour,
  type DayOfWeek,
} from "@/lib/validations/onboarding";
import type { BusinessHoursInput } from "@/lib/validations/business";

const DEBOUNCE_DELAY = 500; // ms

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

interface BusinessHoursEditorProps {
  hours: Record<string, DayHours> | null;
  onSave: (hours: BusinessHoursInput) => Promise<void>;
}

/**
 * BusinessHoursEditor Component
 *
 * Allows editing business hours for all 7 days.
 * - Each day shows open/close time or "Closed"
 * - Auto-saves on any change
 * - Uses existing time picker pattern from onboarding
 */
export function BusinessHoursEditor({
  hours,
  onSave,
}: BusinessHoursEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [localHours, setLocalHours] = useState<Record<string, DayHours>>(
    () =>
      hours ?? {
        monday: { open: "09:00", close: "18:00" },
        tuesday: { open: "09:00", close: "18:00" },
        wednesday: { open: "09:00", close: "18:00" },
        thursday: { open: "09:00", close: "18:00" },
        friday: { open: "09:00", close: "18:00" },
        saturday: { open: "09:00", close: "18:00" },
        sunday: { closed: true },
      }
  );
  const [savingDay, setSavingDay] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingHoursRef = useRef<Record<string, DayHours> | null>(null);

  // Debounced save to prevent rapid API calls
  const debouncedSave = useCallback(
    (newHours: Record<string, DayHours>, day: string) => {
      // Store pending hours for the eventual save
      pendingHoursRef.current = newHours;

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setSavingDay(day);

      debounceTimerRef.current = setTimeout(() => {
        const hoursToSave = pendingHoursRef.current;
        if (hoursToSave) {
          startTransition(async () => {
            try {
              await onSave(hoursToSave as BusinessHoursInput);
            } finally {
              setSavingDay(null);
              pendingHoursRef.current = null;
            }
          });
        }
      }, DEBOUNCE_DELAY);
    },
    [onSave, startTransition]
  );

  const handleChange = (
    day: DayOfWeek,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    const newHours = { ...localHours };

    if (field === "closed") {
      newHours[day] = {
        ...newHours[day],
        closed: value as boolean,
      };
    } else {
      newHours[day] = {
        ...newHours[day],
        [field]: value as string,
      };
    }

    setLocalHours(newHours);
    debouncedSave(newHours, day);
  };

  return (
    <div className="space-y-1">
      {DAYS_OF_WEEK.map((day) => {
        const dayHours = localHours[day] ?? { open: "09:00", close: "18:00" };
        const isClosed = dayHours.closed ?? false;
        const isSaving = savingDay === day && isPending;

        return (
          <div
            key={day}
            className="flex items-center gap-2 py-2 border-b last:border-b-0"
          >
            {/* Day Label */}
            <div className="w-24 flex-shrink-0">
              <span className="text-sm font-medium">{DAY_LABELS[day]}</span>
            </div>

            {/* Closed Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Closed</span>
              <Switch
                checked={isClosed}
                onCheckedChange={(checked) =>
                  handleChange(day, "closed", checked)
                }
                disabled={isPending}
              />
            </div>

            {/* Time Selectors (hidden when closed) */}
            {!isClosed && (
              <div className="flex items-center gap-2 flex-1">
                {/* Open Time */}
                <Select
                  value={dayHours.open ?? "09:00"}
                  onValueChange={(value) => handleChange(day, "open", value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="min-h-[44px] flex-1">
                    <SelectValue placeholder="Open" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-muted-foreground text-sm">to</span>

                {/* Close Time */}
                <Select
                  value={dayHours.close ?? "18:00"}
                  onValueChange={(value) => handleChange(day, "close", value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="min-h-[44px] flex-1">
                    <SelectValue placeholder="Close" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Closed Label */}
            {isClosed && (
              <div className="flex-1 text-center">
                <span className="text-sm text-muted-foreground">Closed</span>
              </div>
            )}

            {/* Saving indicator */}
            {isSaving && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Format hours for display (used in review/summary views)
 */
export function formatBusinessHours(
  hours: Record<string, DayHours> | null
): string {
  if (!hours) return "Not set";

  const formatted = DAYS_OF_WEEK.map((day) => {
    const dayHours = hours[day];
    if (!dayHours || dayHours.closed) {
      return `${DAY_LABELS[day]}: Closed`;
    }
    return `${DAY_LABELS[day]}: ${formatTime12Hour(dayHours.open ?? "09:00")} - ${formatTime12Hour(dayHours.close ?? "18:00")}`;
  });

  return formatted.join("\n");
}
