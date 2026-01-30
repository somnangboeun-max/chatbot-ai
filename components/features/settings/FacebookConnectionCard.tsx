"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Facebook, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { disconnectFacebookPage } from "@/actions/facebook";
import type { FacebookConnectionStatus } from "@/types";

interface FacebookConnectionCardProps {
  status: FacebookConnectionStatus;
}

/**
 * FacebookConnectionCard Component
 *
 * Shows Facebook connection status and provides connect/disconnect actions.
 * Uses Facebook brand blue (#1877F2) for connect button.
 */
export function FacebookConnectionCard({ status }: FacebookConnectionCardProps) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  async function handleDisconnect() {
    setIsDisconnecting(true);

    try {
      const result = await disconnectFacebookPage();

      if (result.success) {
        toast.success("Facebook Page disconnected");
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("Failed to disconnect. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  }

  if (!status.isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            Facebook Page
          </CardTitle>
          <CardDescription>
            Connect your Facebook Business Page to receive customer messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            asChild
            className="w-full"
            style={{ backgroundColor: "#1877F2" }}
          >
            <Link href="/api/auth/facebook">
              <Facebook className="mr-2 h-4 w-4" />
              Connect Facebook Page
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-5 w-5" />
          Facebook Page
        </CardTitle>
        <CardDescription>
          Your Facebook Page is connected and receiving messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={status.pageAvatarUrl || undefined}
              alt={status.pageName || "Page"}
            />
            <AvatarFallback>
              {status.pageName?.charAt(0).toUpperCase() || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{status.pageName}</p>
            <p className="text-sm text-muted-foreground">
              Connected{" "}
              {status.connectedAt &&
                format(new Date(status.connectedAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Facebook Page?</AlertDialogTitle>
              <AlertDialogDescription>
                This will stop the chatbot from receiving messages from{" "}
                {status.pageName}. You can reconnect at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisconnect}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
