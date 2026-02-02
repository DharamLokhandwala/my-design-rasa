"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional. Default: "Sign in or sign up" */
  title?: string;
  /** Optional. Default: "Enter your email and we'll send you a magic link." */
  subtitle?: string;
}

export default function SignInModal({
  open,
  onClose,
  title = "Sign in or sign up",
  subtitle = "Enter your email and we'll send you a magic link.",
}: SignInModalProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "rate_limited">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isRateLimited = (err: unknown): boolean => {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      return msg.includes("rate limit") || msg.includes("429") || msg.includes("too many requests");
    }
    return false;
  };

  const RATE_LIMIT_MESSAGE =
    "Too many sign-in emails sent. Please wait a minute before trying again—or check your inbox; you may already have a sign-in link.";

  const handleClose = () => {
    setEmail("");
    setStatus("idle");
    setErrorMsg(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55]"
        onClick={handleClose}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[56] w-full max-w-sm rounded-2xl border border-neutral-600/80 overflow-hidden shadow-xl pointer-events-auto"
        style={{
          backgroundImage: "url('/gradient2.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="relative z-10 p-6">
        <p className="text-white text-center text-lg font-medium mb-4">
          {title}
        </p>
        <p className="text-neutral-400 text-center text-sm mb-4">
          {subtitle}
        </p>
        {status === "sent" ? (
          <div className="flex flex-col items-center gap-4 mb-4">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-14 h-14 rounded-full bg-green-600/20 border-2 border-green-500 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
              >
                <Check size={32} className="text-green-400" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.25 }}
              className="text-neutral-200 text-sm text-center"
            >
              Check your email for sign-in link.
            </motion.p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3 mb-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setStatus("sending");
              setErrorMsg(null);
              try {
                const redirectTo =
                  typeof window !== "undefined"
                    ? `${window.location.origin}/auth/callback`
                    : "";
                const { error } = await supabase.auth.signInWithOtp({
                  email: email.trim(),
                  options: { emailRedirectTo: redirectTo },
                });
                if (error) throw error;
                setStatus("sent");
              } catch (err: unknown) {
                if (isRateLimited(err)) {
                  setStatus("rate_limited");
                  setErrorMsg(RATE_LIMIT_MESSAGE);
                } else {
                  setStatus("error");
                  setErrorMsg(
                    err instanceof Error ? err.message : "Failed to send magic link"
                  );
                }
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
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white bg-neutral-100/10 border border-neutral-500 hover:bg-neutral-100/20 transition-colors disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
        {status === "error" && errorMsg && (
          <p className="text-red-300 text-sm text-center mb-4">{errorMsg}</p>
        )}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-neutral-300  hover:bg-neutral-800 hover:text-white transition-colors"
          >
            {status === "sent" ? "Close" : "Cancel"}
          </button>
        </div>
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
