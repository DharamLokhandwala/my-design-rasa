"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import SignInModal from "./SignInModal";

export default function AuthButton() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data.user) {
        setEmail(null);
      } else {
        setEmail(data.user.email ?? data.user.id);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? session?.user?.id ?? null);
      router.refresh();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!email) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowSignInModal(true)}
          className="inline-flex items-center rounded-full bg-neutral-900/80 border border-neutral-700 px-5 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors shadow-lg backdrop-blur"
        >
          sign in
        </button>
        <SignInModal
          open={showSignInModal}
          onClose={() => setShowSignInModal(false)}
        />
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.reload();
      }}
      className="inline-flex items-center rounded-full bg-neutral-900/80 border border-neutral-700 px-5 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors shadow-lg backdrop-blur"
      title={email}
    >
      sign out
    </button>
  );
}

