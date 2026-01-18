import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";
import { Suspense } from "react";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense
          fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
