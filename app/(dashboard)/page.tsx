import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {/* Placeholder for HeroSummaryCard (Story 3.2) */}
      <div className="mb-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Ready to help your customers!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Connect your Facebook Page to start receiving messages.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for AttentionItems (Story 3.4) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Attention Needed</h3>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">All caught up!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
