"use client";

import { useState, type FormEvent, type JSX } from "react";
import { apiFetch, getApiHeaders, getApiUrl } from "@/lib/api";

/**
 * Password recovery step 1: request a reset link by email.
 * The backend answers identically whether or not the account exists,
 * and this page mirrors that behavior in its messaging.
 */
export default function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiFetch(getApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: getApiHeaders(true),
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        let message = `Request failed (HTTP ${response.status}).`;
        try {
          const payload: unknown = await response.json();
          if (typeof payload === "object" && payload !== null && "message" in payload) {
            const value = (payload as { message: unknown }).message;
            if (typeof value === "string") message = value;
          }
        } catch {
          // Keep the status-based message.
        }
        throw new Error(message);
      }
      setSubmitted(true);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send the reset request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 p-6 text-slate-100 shadow-2xl sm:p-8">
        <p className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-blue-400">
          NextOps Studio
        </p>

        {submitted ? (
          <>
            <h1 className="text-2xl font-bold">Check your inbox</h1>
            <p className="mt-3 text-sm text-slate-400">
              If an account exists for that email, a password reset link has been
              sent. The link is valid for 30 minutes and can be used once.
            </p>
            <a
              className="mt-6 inline-block w-full rounded-lg border border-slate-700 px-4 py-2.5 text-center text-sm font-semibold text-blue-300 transition hover:border-blue-500 hover:text-blue-200"
              href="/login"
            >
              Back to sign in
            </a>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Reset your password</h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter the email of your workspace account and we will send a
              single-use reset link.
            </p>

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <label className="block text-sm">
                <span className="mb-1.5 block text-slate-300">Email</span>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-blue-500"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <a className="mt-5 block w-full text-center text-sm text-blue-300 hover:text-blue-200" href="/login">
              Back to sign in
            </a>
          </>
        )}
      </section>
    </main>
  );
}
