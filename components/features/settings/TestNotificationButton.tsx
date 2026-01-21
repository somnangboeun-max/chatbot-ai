"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { sendTestNotification } from "@/actions/notifications";
import type { NotificationMethod } from "@/lib/validations/notification";

interface TestNotificationButtonProps {
  disabled: boolean;
  method: NotificationMethod;
}

export function TestNotificationButton({
  disabled,
  method,
}: TestNotificationButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleTest = () => {
    startTransition(async () => {
      const result = await sendTestNotification();

      if (result.success) {
        toast.success(
          `Test ${method === "telegram" ? "message" : "SMS"} sent!`
        );
      } else {
        toast.error(result.error.message);
      }
    });
  };

  return (
    <Button
      onClick={handleTest}
      disabled={disabled || isPending}
      variant="outline"
      className="min-h-[44px] w-full sm:w-auto"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Send Test {method === "telegram" ? "Message" : "SMS"}
        </>
      )}
    </Button>
  );
}
