"use client";

import { resendVerificationEmail } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleResend = () => {
    if (!email) {
      setMessage({ type: "error", text: "No email address found" });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await resendVerificationEmail(email);

      if (result.success) {
        setMessage({ type: "success", text: result.data.message });
      } else {
        setMessage({ type: "error", text: result.error.message });
      }
    });
  };

  return (
    <div className="space-y-4">
      {email && (
        <p className="text-sm text-muted-foreground">
          We sent a verification email to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Click the link in your email to verify your account. If you don&apos;t
        see it, check your spam folder.
      </p>

      {message && (
        <div
          className={`p-3 text-sm rounded-md ${
            message.type === "success"
              ? "text-primary bg-primary/10"
              : "text-destructive bg-destructive/10"
          }`}
        >
          {message.text}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={handleResend}
        disabled={isPending || !email}
      >
        {isPending ? "Sending..." : "Resend verification email"}
      </Button>
    </div>
  );
}
