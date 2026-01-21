"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateNotificationSettings } from "@/actions/notifications";
import { TestNotificationButton } from "./TestNotificationButton";
import type { NotificationMethod } from "@/lib/validations/notification";

interface NotificationSettingsProps {
  currentMethod: NotificationMethod;
  currentTarget: string | null;
}

export function NotificationSettings({
  currentMethod,
  currentTarget,
}: NotificationSettingsProps) {
  const [method, setMethod] = useState<NotificationMethod>(currentMethod);
  const [target, setTarget] = useState(currentTarget || "");
  const [isPending, startTransition] = useTransition();

  const handleMethodChange = (newMethod: NotificationMethod) => {
    const isSwitchingMethods = newMethod !== method;
    setMethod(newMethod);

    // Clear target when switching methods
    if (isSwitchingMethods) {
      setTarget("");
    }

    // Only auto-save when:
    // 1. Switching TO "none" (no target required)
    // 2. NOT switching methods and keeping existing target
    // Don't save when switching TO telegram/sms with empty target (causes validation error)
    if (newMethod === "none" || (!isSwitchingMethods && target.trim() !== "")) {
      saveSettings(newMethod, isSwitchingMethods ? "" : target);
    }
  };

  const handleTargetBlur = () => {
    saveSettings(method, target);
  };

  const saveSettings = (
    notificationMethod: NotificationMethod,
    notificationTarget: string
  ) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("notification_method", notificationMethod);
      formData.append("notification_target", notificationTarget);

      const result = await updateNotificationSettings(formData);

      if (result.success) {
        toast.success("Notification settings saved");
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const isConfigured = method !== "none" && target.trim() !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Notifications</CardTitle>
        <CardDescription>
          Choose how you want to be notified when the bot needs help with a
          customer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={method}
          onValueChange={(value) =>
            handleMethodChange(value as NotificationMethod)
          }
          className="space-y-1"
        >
          <Label
            htmlFor="telegram"
            className="flex items-center space-x-3 min-h-[44px] px-2 -mx-2 rounded-md cursor-pointer hover:bg-muted/50"
          >
            <RadioGroupItem
              value="telegram"
              id="telegram"
              className="h-5 w-5"
            />
            <span className="text-base">Telegram</span>
          </Label>
          <Label
            htmlFor="sms"
            className="flex items-center space-x-3 min-h-[44px] px-2 -mx-2 rounded-md cursor-pointer hover:bg-muted/50"
          >
            <RadioGroupItem value="sms" id="sms" className="h-5 w-5" />
            <span className="text-base">SMS (costs may apply)</span>
          </Label>
          <Label
            htmlFor="none"
            className="flex items-center space-x-3 min-h-[44px] px-2 -mx-2 rounded-md cursor-pointer hover:bg-muted/50"
          >
            <RadioGroupItem value="none" id="none" className="h-5 w-5" />
            <span className="text-base">No notifications</span>
          </Label>
        </RadioGroup>

        {method === "telegram" && (
          <div className="space-y-2">
            <Label htmlFor="telegram-target">Telegram Chat ID or Username</Label>
            <Input
              id="telegram-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onBlur={handleTargetBlur}
              placeholder="@username or chat ID (e.g., 123456789)"
              className="min-h-[44px]"
              disabled={isPending}
            />
            <p className="text-sm text-muted-foreground">
              To get your chat ID, message{" "}
              <span className="font-mono">@userinfobot</span> on Telegram.
            </p>
          </div>
        )}

        {method === "sms" && (
          <div className="space-y-2">
            <Label htmlFor="sms-target">Phone Number</Label>
            <Input
              id="sms-target"
              type="tel"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onBlur={handleTargetBlur}
              placeholder="+855 12 345 678 or 012 345 678"
              className="min-h-[44px]"
              disabled={isPending}
            />
            <p className="text-sm text-muted-foreground">
              Enter your Cambodian phone number. SMS charges may apply.
            </p>
          </div>
        )}

        {method !== "none" && (
          <TestNotificationButton disabled={!isConfigured || isPending} method={method} />
        )}
      </CardContent>
    </Card>
  );
}
