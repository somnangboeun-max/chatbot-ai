import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export const metadata = {
  title: "Messages",
};

export default function MessagesPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Messages</h2>

      {/* Empty state - no conversations yet */}
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            No conversations yet
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Connect Facebook to start receiving messages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
