import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

async function SuccessMessage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  if (!params?.message) {
    return null;
  }

  return (
    <div className="mb-4 p-3 text-sm text-primary bg-primary/10 rounded-md">
      {params.message}
    </div>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={null}>
          <SuccessMessage searchParams={searchParams} />
        </Suspense>
        <LoginForm />
      </div>
    </div>
  );
}
