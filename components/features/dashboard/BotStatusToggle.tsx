"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BotStatusToggleProps {
  botActive: boolean;
  isPending: boolean;
  onToggle: (active: boolean) => void;
}

export function BotStatusToggle({
  botActive,
  isPending,
  onToggle,
}: BotStatusToggleProps) {
  const [showPauseDialog, setShowPauseDialog] = useState(false);

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      setShowPauseDialog(true);
    } else {
      onToggle(true);
    }
  };

  const handleConfirmPause = () => {
    setShowPauseDialog(false);
    onToggle(false);
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-block w-3 h-3 rounded-full",
              botActive ? "bg-success" : "bg-error",
            )}
          />
          <div>
            <p className="font-semibold">
              {botActive ? "Bot Active" : "Bot Paused"}
            </p>
            <p className="text-sm text-muted-foreground">
              {botActive
                ? "Responding to customer messages"
                : "Messages will go unanswered"}
            </p>
          </div>
        </div>
        <Switch
          checked={botActive}
          onCheckedChange={handleToggle}
          disabled={isPending}
          className={cn(
            "h-7 w-12",
            botActive
              ? "data-[state=checked]:bg-success"
              : "data-[state=unchecked]:bg-error",
          )}
          aria-label={botActive ? "Pause bot" : "Resume bot"}
        />
      </div>

      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause bot?</DialogTitle>
            <DialogDescription>
              Messages will go unanswered while the bot is paused. You can resume
              at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPauseDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmPause}>
              Pause Bot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
