"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

/**
 * CelebrationScreen Component
 *
 * Displays a celebration screen with confetti animation after
 * successful onboarding completion. Shows success message in
 * both English and Khmer.
 */
export function CelebrationScreen() {
  const router = useRouter();

  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000;
    const end = Date.now() + duration;
    let animationId: number;
    let isCancelled = false;

    const frame = () => {
      if (isCancelled) return;

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end && !isCancelled) {
        animationId = requestAnimationFrame(frame);
      }
    };

    frame();

    // Cleanup: cancel animation if component unmounts
    return () => {
      isCancelled = true;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Success Icon */}
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Main Message */}
      <h1 className="text-2xl font-bold mb-2">Your bot is ready!</h1>
      <p className="text-xl text-muted-foreground mb-2">
        បូតរបស់អ្នកត្រៀមខ្លួនរួចរាល់ហើយ!
      </p>
      <p className="text-muted-foreground mb-8">
        Your chatbot will now respond to customer messages automatically.
      </p>

      {/* CTA Button */}
      <Button
        onClick={() => router.push("/dashboard")}
        className="min-h-[48px] px-8 text-lg"
      >
        Go to Dashboard
      </Button>
    </div>
  );
}
