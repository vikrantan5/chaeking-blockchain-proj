"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NGOSignupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signup");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white" data-testid="legacy-ngo-signup-redirect-page">
      <p className="text-sm text-gray-600" data-testid="legacy-ngo-signup-redirect-message">
        Redirecting to NGO signup...
      </p>
    </div>
  );
}