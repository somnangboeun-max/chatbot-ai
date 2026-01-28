"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FacebookPageSelector } from "./FacebookPageSelector";
import { selectFacebookPage } from "@/actions/facebook";
import type { FacebookPage } from "@/types";

interface FacebookPageSelectorWrapperProps {
  pages: FacebookPage[];
}

/**
 * FacebookPageSelectorWrapper Client Component
 *
 * Manages connection state and handles Page selection.
 * Calls selectFacebookPage action and redirects on success/failure.
 */
export function FacebookPageSelectorWrapper({
  pages,
}: FacebookPageSelectorWrapperProps) {
  const router = useRouter();
  const [connectingPageId, setConnectingPageId] = useState<string | null>(null);

  async function handleSelect(pageId: string) {
    setConnectingPageId(pageId);

    const result = await selectFacebookPage(pageId);

    if (result.success) {
      toast.success(`Connected to ${result.data.pageName}`);
      router.push("/settings");
    } else {
      toast.error(result.error.message);
      setConnectingPageId(null);
    }
  }

  return (
    <FacebookPageSelector
      pages={pages}
      connectingPageId={connectingPageId}
      onSelect={handleSelect}
    />
  );
}
