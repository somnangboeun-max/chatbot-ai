import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Not Found page for invalid onboarding steps
 */
export default function OnboardingNotFound() {
  return (
    <Card className="w-full max-w-lg text-center">
      <CardHeader>
        <CardTitle className="text-2xl">Step Not Found</CardTitle>
        <CardDescription>
          The onboarding step you&apos;re looking for doesn&apos;t exist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/onboarding/1">
          <Button>Start from Beginning</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
