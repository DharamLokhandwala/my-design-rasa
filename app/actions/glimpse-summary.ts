"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const SUMMARY_PROMPT = `Act as a Senior Design Lead and UX Strategist. Review the provided collection of images to perform a thematic pattern analysis of the user's aesthetic preferences. Synthesize your findings into a 1 to 2 sentences (less than 80 words) summary that defines their cohesive design identity, starting the response with "You." Speak directly to the user, identifying the recurring intersection of their structural logic, materiality, and cultural influences using established industry terminology (e.g., "Parametricism," "Biophilic Minimalism," or "High-Fidelity Gloss") while strictly avoiding non-standard labels. Your goal is to articulate the underlying visual logic that connects these disparate works into a singular, professional "Visual Manifesto."

Output only the summary paragraph—no headings, bullets, or extra text.`;

export type ReflectionInput = {
  lexicons: string[];
  explanation: string;
};

export async function generateGlimpseSummary(
  reflections: ReflectionInput[]
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) return null;

  const hasContent = reflections.some(
    (r) => (r.lexicons?.length ?? 0) > 0 || (r.explanation?.trim()?.length ?? 0) > 0
  );
  if (reflections.length === 0 || !hasContent) return null;

  const inputText = reflections
    .map((r, i) => {
      const lex = (r.lexicons ?? []).join(", ");
      const exp = (r.explanation ?? "").trim();
      return `Reflection ${i + 1}: Lexicons: ${lex || "none"}. ${exp ? `Note: ${exp}` : ""}`;
    })
    .join("\n\n");

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `${SUMMARY_PROMPT}\n\nReflections:\n${inputText}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text =
      textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    return text || null;
  } catch (err) {
    console.error("Glimpse summary failed:", err);
    return null;
  }
}

export type GlimpseSummaryRow = {
  reflection_ids_key: string;
  summary: string;
};

export async function getGlimpseSummary(): Promise<GlimpseSummaryRow | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;
  const { data, error } = await supabase
    .from("glimpse_summaries")
    .select("reflection_ids_key, summary")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("getGlimpseSummary failed:", error);
    return null;
  }
  return data && data.summary ? data : null;
}

export async function saveGlimpseSummary(
  reflectionIdsKey: string,
  summary: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("glimpse_summaries")
    .upsert(
      {
        user_id: user.id,
        reflection_ids_key: reflectionIdsKey,
        summary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}
