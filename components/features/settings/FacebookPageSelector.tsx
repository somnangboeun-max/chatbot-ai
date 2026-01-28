import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import type { FacebookPage } from "@/types";

interface FacebookPageSelectorProps {
  pages: FacebookPage[];
  connectingPageId: string | null;
  onSelect: (pageId: string) => void;
}

/**
 * FacebookPageSelector Component
 *
 * Displays a list of Facebook Pages for the user to select.
 * Shows loading spinner on the selected Page during connection.
 */
export function FacebookPageSelector({
  pages,
  connectingPageId,
  onSelect,
}: FacebookPageSelectorProps) {
  const isConnecting = connectingPageId !== null;

  return (
    <div className="space-y-3">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">Select a Page to Connect</h2>
        <p className="text-sm text-muted-foreground">
          Choose which Facebook Page will receive customer messages.
        </p>
      </div>

      {pages.map((page) => {
        const isThisConnecting = connectingPageId === page.id;
        const avatarUrl = page.picture?.data?.url;

        return (
          <Card
            key={page.id}
            className={isThisConnecting ? "border-primary" : ""}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl} alt={page.name} />
                <AvatarFallback>
                  {page.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{page.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  ID: {page.id}
                </p>
              </div>

              <Button
                onClick={() => onSelect(page.id)}
                disabled={isConnecting}
                className="shrink-0"
                style={{
                  backgroundColor: isThisConnecting ? undefined : "#1877F2",
                }}
                aria-label={isThisConnecting ? `Connecting to ${page.name}` : `Connect ${page.name}`}
              >
                {isThisConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
