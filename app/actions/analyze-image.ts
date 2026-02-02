"use server";

import Anthropic from "@anthropic-ai/sdk";

const FALLBACK_LEXICONS = [
  "Design Lexicon",
  "Design Lexicon",
  "Design Lexicon",
  "Design Lexicon",
];

const LEXICON_PROMPT = `Analyze this image as a Senior Design Critic to deconstruct the "Visual craft and design taste" into 6 to 8 sophisticated lexicons. Choose these terms from established categories like Structural (geometry), Optical (light), Materiality (surface), Narrative (cultural vibe), Compositional (spatial logic), and Chromatic (color behavior). Use only established industry terminology recognized by designers—such as "Refractive Indexing," "Glassmorphism," or "Brutalist"—strictly avoiding any invented or non-standard labels.

Return ONLY a valid JSON array of strings: no explanation, no markdown code fence, no prefix or suffix. Example: ["Lexicon One", "Lexicon Two", "Lexicon Three", "Lexicon Four", "Lexicon Five", "Lexicon Six"].`;

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function detectImageMediaType(buffer: ArrayBuffer): ImageMediaType {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a)
    return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61)
    return "image/gif";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50)
    return "image/webp";
  return "image/jpeg";
}

async function fetchImageAsBase64(
  imageUrl: string
): Promise<{ data: string; media_type: ImageMediaType } | null> {
  try {
    const res = await fetch(imageUrl, {
      cache: "no-store",
      headers: { Accept: "image/*" },
    });
    if (!res.ok) {
      console.warn(
        `[analyze-image] Image fetch failed: ${res.status} ${res.statusText} for ${imageUrl.slice(0, 60)}... (If using Supabase storage, ensure the bucket is public.)`
      );
      return null;
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const media_type = detectImageMediaType(buffer);
    return { data: base64, media_type };
  } catch (e) {
    console.warn("[analyze-image] Image fetch error:", e);
    return null;
  }
}

export async function analyzeImageForLexicons(
  imageUrl: string
): Promise<{ lexicons: string[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    console.warn("[analyze-image] ANTHROPIC_API_KEY is missing or empty; using fallback lexicons.");
    return { lexicons: FALLBACK_LEXICONS };
  }

  const imageSource = await fetchImageAsBase64(imageUrl);
  if (!imageSource) {
    console.warn("[analyze-image] Could not fetch image as base64 (check URL and network); using fallback lexicons.");
    return { lexicons: FALLBACK_LEXICONS };
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageSource.media_type,
                data: imageSource.data,
              },
            },
            {
              type: "text",
              text: LEXICON_PROMPT,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text =
      textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    if (!text) {
      console.warn("[analyze-image] Claude returned no text; using fallback lexicons.");
      return { lexicons: FALLBACK_LEXICONS };
    }

    // Parse JSON array: try direct/code block first, then extract array from anywhere in response
    let list: string[] = [];
    let raw = text;
    const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) raw = codeMatch[1].trim();

    const tryParse = (str: string): string[] | null => {
      try {
        const parsed = JSON.parse(str) as unknown;
        const arr = Array.isArray(parsed)
          ? parsed
          : (parsed as { lexicons?: string[] }).lexicons;
        if (!Array.isArray(arr)) return null;
        return arr
          .filter((x): x is string => typeof x === "string")
          .map((s) => String(s).trim())
          .filter(Boolean);
      } catch {
        return null;
      }
    };

    list = tryParse(raw) ?? [];
    if (list.length === 0) {
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) list = tryParse(arrayMatch[0]) ?? [];
    }

    if (list.length === 0) {
      console.warn(
        "[analyze-image] Could not parse lexicons from response. First 200 chars:",
        text.slice(0, 200)
      );
      return { lexicons: FALLBACK_LEXICONS };
    }
    return { lexicons: list.slice(0, 8) };
  } catch (err) {
    console.error("[analyze-image] Claude lexicon analysis failed:", err);
    return { lexicons: FALLBACK_LEXICONS };
  }
}
