import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function createSupabaseServerClient() {
  // Next.js 16: cookies() is async (can return a Promise)
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return typeof (cookieStore as any).getAll === "function"
          ? (cookieStore as any).getAll()
          : [];
      },
      setAll(cookiesToSet) {
        // Server Actions can set cookies via next/headers
        cookiesToSet.forEach(({ name, value, options }) => {
          if (typeof (cookieStore as any).set === "function") {
            (cookieStore as any).set(name, value, options);
          }
        });
      },
    },
  });
}

