import { VerifyEmailContent } from "@/components/features/auth/VerifyEmailContent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Check your email
            </CardTitle>
            <CardDescription>
              We sent you a verification link to confirm your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
              <VerifyEmailContent />
            </Suspense>
            <p className="text-sm text-center text-muted-foreground">
              Already verified?{" "}
              <Link href="/auth/login" className="text-primary underline">
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
