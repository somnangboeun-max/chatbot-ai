"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Dashboard", badgeKey: null },
  { href: "/messages", icon: MessageSquare, label: "Messages", badgeKey: "messages" },
  { href: "/settings", icon: Settings, label: "Settings", badgeKey: null },
] as const;

interface BottomNavigationProps {
  messagesCount?: number;
}

export function BottomNavigation({ messagesCount = 0 }: BottomNavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getBadgeCount = (badgeKey: string | null): number => {
    if (badgeKey === "messages") return messagesCount;
    return 0;
  };

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ href, icon: Icon, label, badgeKey }) => {
          const active = isActive(href);
          const badgeCount = getBadgeCount(badgeKey);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[64px] min-h-[44px] px-3",
                "transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium text-white bg-amber-500 rounded-full"
                    aria-label={`${badgeCount} items need attention`}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
