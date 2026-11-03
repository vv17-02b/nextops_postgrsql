"use client";

import { Suspense, useState, type FormEvent, type JSX } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, getApiHeaders, getApiUrl } from "@/lib/api";

function getErrorMessage(response: Response, payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const value = (payload as { message: unknown }).message;
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      return value.join(" ");
    }
  }
  return `Request failed (HTTP ${response.status}).`;
}

/**
 * Password recovery step 2: reached from the emailed reset link
 * (/reset-password?token=...). Sets the new password, which also
 * revokes every existing session for the account.
 */
function ResetPasswordForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenMissing = token.length === 0;

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch(getApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: getApiHeaders(true),
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) {
        let payload: unknown = null;
        try {
          payload = await response.json();
        } catch {
          // Non-JSON error body.
        }
        throw new Error(getErrorMessage(response, payload));
      }
      router.replace("/login?reset=success");
      router.refresh();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reset the password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (tokenMissing) {
    return (
      <>
        <h1 className="text-2xl font-bold">Invalid reset link</h1>
        <p className="mt-3 text-sm text-slate-400">
          This page needs a reset token from the emailed link. Request a new
          one to continue.
        </p>
        <a className="mt-6 inline-block w-full rounded-lg border border-slate-700 px-4 py-2.5 text-center text-sm font-semibold text-blue-300 transition hover:border-blue-500 hover:text-blue-200" href="/forgot-password">
          Request a new link
        </a>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <p className="mt-2 text-sm text-slate-400">
        Setting a new password signs you out of every device.
      </p>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        <label className="block text-sm">
          <span className="mb-1.5 block text-slate-300">New password</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-blue-500"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <span className="mt-1 block text-xs text-slate-500">Use at least 12 characters.</span>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-slate-300">Confirm new password</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-blue-500"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        {error && (
          <p className="rounded-lg border border-red-900/70 bg-red-950/50 p-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        <button
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Set new password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 p-6 text-slate-100 shadow-2xl sm:p-8">
        <p className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-blue-400">
          NextOps Studio
        </p>
        <Suspense fallback={<p className="text-sm text-slate-400">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
