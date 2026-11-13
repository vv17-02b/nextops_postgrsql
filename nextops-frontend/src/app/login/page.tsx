"use client";

import { useState, type FormEvent, type JSX } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getApiHeaders, getApiUrl } from "@/lib/api";

type AuthMode = "login" | "register";

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (typeof payload === "object" && payload !== null && "message" in payload) {
      const message = payload.message;
      if (typeof message === "string") return message;
      if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
        return message.join(" ");
      }
    }
  } catch {
    // Use the status-based message below when the response is not JSON.
  }
  return `Request failed (HTTP ${response.status}).`;
}

function getSafeReturnPath(): string {
  const requestedPath = new URLSearchParams(window.location.search).get("next");
  return requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/";
}

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const trimmedCompany = companyName.trim();
        const registration = await apiFetch(getApiUrl("/api/auth/register"), {
          method: "POST",
          headers: getApiHeaders(true),
          body: JSON.stringify({
            email,
            password,
            ...(trimmedCompany.length >= 2 ? { companyName: trimmedCompany } : {}),
          }),
        });
        if (!registration.ok) throw new Error(await getErrorMessage(registration));
      }

      const login = await apiFetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: getApiHeaders(true),
        body: JSON.stringify({ email, password }),
      });
      if (!login.ok) throw new Error(await getErrorMessage(login));

      window.dispatchEvent(new Event("nextops:session-restored"));
      router.replace(getSafeReturnPath());
      router.refresh();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
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
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Sign in to your workspace" : "Create your workspace"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Your session is stored in a secure, HttpOnly cookie.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {mode === "register" && (
            <label className="block text-sm">
              <span className="mb-1.5 block text-slate-300">Company / Workspace name</span>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-blue-500"
                type="text"
                autoComplete="organization"
                placeholder="Напр. Технології та Інновації або Rozetka"
                minLength={2}
                maxLength={100}
                required
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
            </label>
          )}
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
          <label className="block text-sm">
            <span className="mb-1.5 block text-slate-300">Password</span>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-blue-500"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "register" ? 12 : 6}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {mode === "register" && (
              <span className="mt-1 block text-xs text-slate-500">Use at least 12 characters.</span>
            )}
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
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create workspace"}
          </button>
        </form>

        <a
          className="mt-4 block w-full text-center text-sm text-slate-400 hover:text-blue-200"
          href="/forgot-password"
        >
          Forgot password?
        </a>

        <button
          className="mt-5 w-full text-sm text-blue-300 hover:text-blue-200"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "New here? Create a workspace" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
