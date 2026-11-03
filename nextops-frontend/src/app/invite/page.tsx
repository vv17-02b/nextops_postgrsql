"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, getApiHeaders, getApiUrl } from "@/lib/api";

export default function InvitationPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
    void apiFetch(getApiUrl("/api/health/live"));
  }, []);

  async function acceptInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      const response = await apiFetch(getApiUrl("/api/invitation/accept"), {
        method: "POST",
        headers: getApiHeaders(true),
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) {
        const payload = await response.json() as { message?: string };
        throw new Error(payload.message ?? `Invitation could not be accepted (HTTP ${response.status}).`);
      }
      setStatus("Invitation accepted. You can now sign in.");
      setPassword("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invitation could not be accepted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Join your workspace</h1>
      <form className="space-y-4" onSubmit={acceptInvitation}>
        <label className="block">
          <span className="mb-1 block">Password (at least 12 characters)</span>
          <input
            className="w-full rounded border p-2"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50" disabled={submitting || !token}>
          {submitting ? "Accepting..." : "Accept invitation"}
        </button>
      </form>
      {status && <p className="mt-4" role="status">{status}</p>}
    </main>
  );
}
