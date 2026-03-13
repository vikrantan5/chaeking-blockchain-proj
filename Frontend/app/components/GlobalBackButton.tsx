"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function GlobalBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (!pathname || pathname === "/") {
    return null;
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <button
      onClick={handleBack}
      className="fixed top-4 left-4 z-[60] inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-black/55"
      data-testid="global-back-button"
      aria-label="Go back"
      type="button"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}