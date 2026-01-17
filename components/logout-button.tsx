"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    setError(null);
    startTransition(async () => {
      const result = await signOut();
      // Note: On success, signOut redirects so we won't reach here
      // This only handles error cases
      if (!result.success) {
        setError(result.error.message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button
        onClick={handleLogout}
        disabled={isPending}
        variant="outline"
        className="h-11"
      >
        {isPending ? "Signing out..." : "Sign Out"}
      </Button>
    </div>
  );
}
