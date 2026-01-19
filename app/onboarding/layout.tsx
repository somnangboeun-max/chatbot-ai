import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding | Chatbot AI",
  description: "Set up your business for Chatbot AI",
};

/**
 * Onboarding Layout
 *
 * Minimal chrome layout without bottom navigation during onboarding.
 * Provides a clean, focused experience for the onboarding wizard.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background">
      <main className="flex min-h-svh items-center justify-center p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
