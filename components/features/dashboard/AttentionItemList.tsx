import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { AttentionItemCard } from "./AttentionItemCard";
import type { AttentionItem } from "@/types/dashboard";

interface AttentionItemListProps {
  items: AttentionItem[];
}

export function AttentionItemList({ items }: AttentionItemListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-muted-foreground">All caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Attention Needed ({items.length})
      </h3>
      <Card>
        <CardContent className="p-0">
          {items.map((item) => (
            <AttentionItemCard key={item.id} item={item} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
