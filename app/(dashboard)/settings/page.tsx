import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Package, Bell, User } from "lucide-react";

export const metadata = {
  title: "Settings",
};

const settingsItems = [
  {
    href: "/settings/business",
    icon: Building2,
    title: "Business Info",
    description: "Name, hours, location, phone",
  },
  {
    href: "/settings/products",
    icon: Package,
    title: "Products & Prices",
    description: "Manage your product catalog",
  },
  {
    href: "/settings/notifications",
    icon: Bell,
    title: "Notifications",
    description: "Staff alerts and preferences",
  },
  {
    href: "/settings/account",
    icon: User,
    title: "Account",
    description: "Email, password, logout",
  },
];

export default function SettingsPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-3">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
