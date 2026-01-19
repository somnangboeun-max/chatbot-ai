"use client";

import { useFormContext } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { TIME_OPTIONS, type DayOfWeek } from "@/lib/validations/onboarding";

interface DayHoursRowProps {
  day: DayOfWeek;
  onCopyFromPrevious?: () => void;
  showCopyButton?: boolean;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/**
 * DayHoursRow Component
 *
 * A single row for setting business hours for one day of the week.
 * Includes open/close time selectors and a closed toggle.
 */
export function DayHoursRow({ day }: DayHoursRowProps) {
  const form = useFormContext();

  const isClosed = form.watch(`opening_hours.${day}.closed`);

  return (
    <div className="flex items-center gap-2 py-2 border-b last:border-b-0">
      {/* Day Label */}
      <div className="w-24 flex-shrink-0">
        <span className="text-sm font-medium">{DAY_LABELS[day]}</span>
      </div>

      {/* Closed Toggle */}
      <FormField
        control={form.control}
        name={`opening_hours.${day}.closed`}
        render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormLabel className="text-xs text-muted-foreground">
              Closed
            </FormLabel>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Time Selectors (hidden when closed) */}
      {!isClosed && (
        <div className="flex items-center gap-2 flex-1">
          {/* Open Time */}
          <FormField
            control={form.control}
            name={`opening_hours.${day}.open`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <Select
                  value={field.value ?? "09:00"}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Open" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <span className="text-muted-foreground">to</span>

          {/* Close Time */}
          <FormField
            control={form.control}
            name={`opening_hours.${day}.close`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <Select
                  value={field.value ?? "18:00"}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Close" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Closed Label */}
      {isClosed && (
        <div className="flex-1 text-center">
          <span className="text-sm text-muted-foreground">Closed</span>
        </div>
      )}
    </div>
  );
}
