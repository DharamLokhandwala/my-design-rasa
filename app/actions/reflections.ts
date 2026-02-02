"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Database } from "@/types/supabase";

export type ReflectionRow = {
  id: string;
  created_at: string;
  image_url: string;
  lexicons: string[];
  explanation: string;
  project_id: string;
};

export async function getReflections(): Promise<ReflectionRow[]> {
  const supabase = await createSupabaseServerClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      // When there is no auth session at all, Supabase may throw an
      // AuthSessionMissingError. Treat that as "no reflections" instead of
      // surfacing a noisy error in the console.
      if ((userError as any).name === "AuthSessionMissingError") {
        return [];
      }
      throw userError;
    }
    if (!user) return [];

    // Fetch last 5 reflections for the current user (via owning project)
    const { data, error } = await supabase
      .from("reflections")
      .select(
        "id, created_at, project_id, image_url, lexicons, explanation, projects!inner(user_id)"
      )
      .eq("projects.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      project_id: r.project_id,
      image_url: r.image_url,
      lexicons: r.lexicons ?? [],
      explanation: r.explanation ?? "",
    }));
  } catch (err) {
    // Caller can decide how to surface this (we keep it non-fatal for the UI).
    console.error("getReflections failed:", err);
    return [];
  }
}

export async function saveReflection(input: {
  title?: string;
  imageUrl: string;
  lexicons: string[];
  explanation: string;
}): Promise<{ projectId: string; reflectionId: string }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    // Same handling as in getReflections – if there is no auth session at all,
    // surface a consistent, high-level error instead of the low-level
    // AuthSessionMissingError.
    if ((userError as any).name === "AuthSessionMissingError") {
      throw new Error("Not authenticated");
    }
    throw userError;
  }
  if (!user) throw new Error("Not authenticated");

  const title =
    input.title?.trim() ||
    input.lexicons?.[0]?.trim() ||
    "Untitled project";

  // Create a project per saved reflection (simple model for now)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert<Database["public"]["Tables"]["projects"]["Insert"]>({
      user_id: user.id,
      title,
      image_url: input.imageUrl,
    })
    .select("id")
    .single();

  if (projectError) throw projectError;

  const { data: reflection, error: reflectionError } = await supabase
    .from("reflections")
    .insert<Database["public"]["Tables"]["reflections"]["Insert"]>({
      project_id: project.id,
      lexicons: input.lexicons ?? [],
      explanation: input.explanation ?? "",
      image_url: input.imageUrl,
    })
    .select("id")
    .single();

  if (reflectionError) throw reflectionError;

  return { projectId: project.id, reflectionId: reflection.id };
}

export async function updateReflection(
  reflectionId: string,
  input: { explanation: string; lexicons?: string[] }
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    if ((userError as any).name === "AuthSessionMissingError") {
      throw new Error("Not authenticated");
    }
    throw userError;
  }
  if (!user) throw new Error("Not authenticated");

  const updates: { explanation: string; lexicons?: string[] } = {
    explanation: input.explanation ?? "",
  };
  if (input.lexicons != null) {
    updates.lexicons = input.lexicons;
  }

  const { error } = await supabase
    .from("reflections")
    .update(updates)
    .eq("id", reflectionId);

  if (error) throw error;
}

export async function deleteReflection(reflectionId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    if ((userError as any).name === "AuthSessionMissingError") {
      throw new Error("Not authenticated");
    }
    throw userError;
  }
  if (!user) throw new Error("Not authenticated");

  const { data: reflection, error: fetchError } = await supabase
    .from("reflections")
    .select("project_id")
    .eq("id", reflectionId)
    .single();

  if (fetchError || !reflection) {
    throw new Error("Reflection not found");
  }

  const { error: deleteProjectError } = await supabase
    .from("projects")
    .delete()
    .eq("id", reflection.project_id);

  if (deleteProjectError) throw deleteProjectError;
}

