"use client";

import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SessionNotice(): JSX.Element | null {
  const pathname = usePathname();
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const showExpiredNotice = (): void => setSessionExpired(true);
    const clearExpiredNotice = (): void => setSessionExpired(false);
    window.addEventListener("nextops:session-expired", showExpiredNotice);
    window.addEventListener("nextops:session-restored", clearExpiredNotice);
    return () => {
      window.removeEventListener("nextops:session-expired", showExpiredNotice);
      window.removeEventListener("nextops:session-restored", clearExpiredNotice);
    };
  }, []);

  if (!sessionExpired || pathname === "/login" || pathname === "/invite") return null;

  const returnPath = pathname || "/";
  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-amber-700/60 bg-slate-950 p-4 text-sm text-amber-100 shadow-2xl"
      role="alert"
    >
      <span>Your session has expired. Sign in to continue.</span>
      <Link
        className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-500"
        href={`/login?next=${encodeURIComponent(returnPath)}`}
      >
        Sign in
      </Link>
      <button
        className="rounded px-1 text-slate-400 hover:text-white"
        type="button"
        aria-label="Dismiss notification"
        onClick={() => setSessionExpired(false)}
      >
        ×
      </button>
    </div>
  );
}
