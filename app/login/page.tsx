"use client";

import React, { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#181818] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-neutral-950 border border-neutral-800 p-6">
        <h1
          className="text-2xl text-white tracking-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Sign in
        </h1>
        <p className="text-sm text-neutral-400 mt-2">
          We’ll email you a magic link to sign in.
        </p>

        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setStatus("sending");
            setErrorMsg(null);
            try {
              const redirectTo = `${window.location.origin}/auth/callback`;
              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: redirectTo },
              });
              if (error) throw error;
              setStatus("sent");
            } catch (err: any) {
              setStatus("error");
              setErrorMsg(err?.message ?? "Failed to send magic link");
            }
          }}
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-xl px-4 py-3 text-sm font-medium text-white bg-neutral-100/10 border border-neutral-700 hover:bg-neutral-100/20 transition-colors disabled:opacity-50"
          >
            {status === "sending" ? "sending…" : "send magic link"}
          </button>
        </form>

        {status === "sent" && (
          <p className="text-sm text-neutral-300 mt-4">
            Check your email for the sign-in link.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-300 mt-4">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}

