"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Reflection } from "../context/RasaContext";
import { getReflections } from "@/app/actions/reflections";
import {
  generateGlimpseSummary,
  getGlimpseSummary,
  saveGlimpseSummary,
} from "@/app/actions/glimpse-summary";

interface TasteGlimpseCardProps {
  reflections: Reflection[];
  onGoToReflections?: () => void;
  hideButton?: boolean;
}

function buildTasteDescription(reflections: Reflection[]): string {
  const allLexicons = reflections.flatMap((r) => r.lexicons || []);
  const uniqueLexicons = Array.from(new Set(allLexicons));
  const explanations = reflections
    .map((r) => r.explanation?.trim())
    .filter(Boolean);

  if (reflections.length === 0) {
    return "Your design taste is taking shape. Upload and reflect on images to see an interconnected summary of your aesthetic thread.";
  }

  if (uniqueLexicons.length === 0 && explanations.length === 0) {
    return "Across your design reflections, a visual thread is forming. Add notes and lexicons to your images to weave them into a clearer picture of your taste.";
  }

  const n = reflections.length;
  const reflectionWord = n === 1 ? "reflection" : "reflections";

  // Interconnected thread: open with scope, then lexicons as the common vocabulary
  const lexiconPart =
    uniqueLexicons.length > 0
      ? uniqueLexicons.slice(0, 6).join(", ") +
        (uniqueLexicons.length > 6 ? ", and more" : "")
      : "";

  // Weave in explanations as the narrative thread
  const explanationSnippets = explanations
    .map((e) => {
      const trimmed = e.slice(0, 80);
      return trimmed + (e.length > 80 ? "…" : "");
    })
    .filter(Boolean);

  if (lexiconPart && explanationSnippets.length > 0) {
    const thread =
      explanationSnippets.length === 1
        ? explanationSnippets[0]
        : explanationSnippets
            .slice(0, 3)
            .map((s, i) => (i === 0 ? s : ` ${s}`))
            .join("; ");
    return `Across your ${n} design ${reflectionWord}, a shared thread runs through: ${lexiconPart}. Your reflections speak to ${thread}—together they form one interconnected picture of your taste.`;
  }

  if (lexiconPart) {
    return `Across your ${n} design ${reflectionWord}, your taste converges around ${lexiconPart}. These choices form an interconnected thread that defines your current design language.`;
  }

  const thread =
    explanationSnippets.length === 1
      ? explanationSnippets[0]
      : explanationSnippets
          .slice(0, 3)
          .join("; ");
  return `Across your ${n} design ${reflectionWord}, a narrative emerges: ${thread}. Together they weave a single thread of your design taste.`;
}

function getReflectionSetKey(refs: Reflection[]): string {
  return refs
    .map((r) => r.id)
    .sort()
    .join(",");
}

// Build centered fan transforms for N cards (symmetric spread, centered as a group)
function getFanTransforms(count: number): { rotate: number; translateX: number }[] {
  if (count <= 0) return [];
  const centerIndex = (count - 1) / 2;
  const xStep = 28;
  const rotateStep = 7;
  return Array.from({ length: count }, (_, i) => ({
    translateX: (i - centerIndex) * xStep,
    rotate: (i - centerIndex) * rotateStep,
  }));
}

export default function TasteGlimpseCard({
  reflections,
  onGoToReflections,
  hideButton = false,
}: TasteGlimpseCardProps) {
  const [dbReflections, setDbReflections] = useState<Reflection[] | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  // Start true so we show skeleton immediately; set false when we know no content or summary is ready
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getReflections();
        if (cancelled) return;
        const mapped: Reflection[] = rows.map((r) => ({
          id: r.id,
          createdAt: Date.parse(r.created_at),
          imageUrl: r.image_url,
          colors: [],
          explanation: r.explanation ?? "",
          lexicons: r.lexicons ?? [],
        }));
        setDbReflections(mapped);
      } catch (e) {
        // If not authenticated or Supabase not configured yet, fall back to passed-in reflections.
        if (!cancelled) setDbReflections(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load or generate glimpse summary. Use DB: only regenerate when reflection set (image URLs) changes.
  useEffect(() => {
    let cancelled = false;
    const refs = dbReflections && dbReflections.length > 0 ? dbReflections : reflections;
    const hasContent = refs.some(
      (r) => (r.lexicons?.length ?? 0) > 0 || (r.explanation?.trim()?.length ?? 0) > 0
    );
    if (refs.length === 0 || !hasContent) {
      setAiSummary(null);
      setSummaryLoading(false);
      return;
    }
    const reflectionIdsKey = getReflectionSetKey(refs);
    setSummaryLoading(true);
    (async () => {
      const saved = await getGlimpseSummary();
      if (cancelled) return;
      if (saved && saved.reflection_ids_key === reflectionIdsKey && saved.summary) {
        setAiSummary(saved.summary);
        setSummaryLoading(false);
        return;
      }
      const payload = refs.map((r) => ({
        lexicons: r.lexicons ?? [],
        explanation: r.explanation ?? "",
      }));
      const summary = await generateGlimpseSummary(payload);
      if (cancelled) return;
      if (summary) {
        try {
          await saveGlimpseSummary(reflectionIdsKey, summary);
        } catch (e) {
          console.error("Failed to save glimpse summary:", e);
        }
        setAiSummary(summary);
      }
      setSummaryLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [dbReflections, reflections]);

  const effectiveReflections = useMemo(
    () => (dbReflections && dbReflections.length > 0 ? dbReflections : reflections),
    [dbReflections, reflections]
  );

  const MAX_CARDS = 6;
  // Only show as many cards as uploaded, up to 6 (no placeholders)
  const cards = effectiveReflections
    .slice(0, MAX_CARDS)
    .map((r) => ({ id: r.id, imageUrl: r.imageUrl }));
  const extraCount = Math.max(0, effectiveReflections.length - MAX_CARDS);
  const fanTransforms = useMemo(() => getFanTransforms(cards.length), [cards.length]);
  const allLexicons = Array.from(
    new Set(effectiveReflections.flatMap((r) => r.lexicons || []))
  );
  const description =
    aiSummary ?? buildTasteDescription(effectiveReflections);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-2xl mx-auto flex flex-col items-center gap-10"
    >
      {/* Title */}
      <h2
        className="text-2xl md:text-3xl text-neutral-400 text-center tracking-tighter"
        style={{
          fontFamily: "var(--font-serif)",
          lineHeight: 1.2,
        }}
      >
        Glimpse into your taste.
      </h2>

      {/* Stack + description: stack behind (low z), description on top (high z) */}
      <div className="relative w-full mt-2 pt-[88px] overflow-visible">
        {/* Fanned image stack — behind, z-0; only show after reflections are loaded to avoid placeholder flash */}
        <div
          className="absolute left-0 right-0 top-0 z-0 overflow-visible"
          style={{ height: "250px" }}
          aria-hidden
        >
          {dbReflections === null ? (
            /* Loading: single skeleton so we don't show 5 gradient placeholders */
            <div
              className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[140px] h-[176px] rounded-2xl bg-neutral-800/80 border border-neutral-800 animate-pulse"
              style={{ marginLeft: -70 }}
            />
          ) : (
            cards.map((card, index) => {
              const { rotate, translateX } = fanTransforms[index];
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20, rotate: 0 }}
                  animate={{
                    opacity: 1,
                    y: -100,
                    x: translateX,
                    rotate: rotate,
                  }}
                  transition={{
                    delay: index * 0.06,
                    duration: 0.4,
                    type: "spring",
                    stiffness: 100,
                  }}
                  className="absolute rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl"
                  style={{
                    width: 140,
                    height: 176,
                    left: "50%",
                    bottom: 0,
                    marginLeft: -70,
                    transformOrigin: "bottom center",
                    zIndex: index,
                  }}
                >
                  <img
                    src={card.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              );
            })
          )}
        </div>

        {/* Taste description card — on top, higher z-index */}
        <div
          className="relative z-20 w-full max-w-3/5 mx-auto rounded-2xl border border-neutral-400/20 overflow-hidden"
          style={{
            backgroundImage: "url('/gradient3.svg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/70" aria-hidden />
          <div className="relative z-10 px-5 py-4">
          {summaryLoading ? (
            <div className="flex flex-col gap-2">
              <div className="h-3 w-full max-w-[90%] rounded bg-neutral-800 animate-pulse" />
              <div className="h-3 w-full max-w-[70%] rounded bg-neutral-800 animate-pulse" />
              <div className="h-3 w-full max-w-[85%] rounded bg-neutral-800 animate-pulse" />
              <p className="text-neutral-500 text-sm mt-1">Summarizing your taste…</p>
            </div>
          ) : (
            <p
              className="text-neutral-300 text-base md:text-xl leading-relaxed font-medium"
              style={{ lineHeight: 1.5 }}
            >
              {description}
            </p>
          )}
          </div>
        </div>
      </div>

      {/* Lexicons card */}
      {allLexicons.length > 0 && (
        <div className="w-full max-w-3/5 rounded-2xl bg-neutral-950 border border-neutral-800 px-5 py-4">
          <div className="flex flex-wrap gap-2 ">
            {allLexicons.slice(0, 8).map((lexicon, idx) => (
              <span
                key={`${lexicon}-${idx}`}
                className="inline-flex items-center rounded-full border border-neutral-800 px-3 py-1.5 text-s text-neutral-400 bg-neutral-900/50"
              >
                {lexicon}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ever evolving text */}
      <p className="text-neutral-500 text-sm text-center">
        This space will adapt your evolving taste...
      </p>

      {/* Go to reflections */}
      {!hideButton && (
        onGoToReflections ? (
          <motion.button
            type="button"
            onClick={onGoToReflections}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full px-6 py-3 text-sm font-medium text-white transition-colors"
            style={{
              background:
                "linear-gradient(to right, rgb(32, 32, 32), rgb(28, 28, 28))",
              border: "1.5px solid rgba(160, 160, 160, 0.21)",
              borderRadius: "9999px",
            }}
          >
            Go to reflections
          </motion.button>
        ) : (
          <Link
            href="/reflections"
            className="rounded-full px-6 py-3 text-sm font-medium text-white transition-colors inline-block"
            style={{
              background:
                "linear-gradient(to right, rgb(32, 32, 32), rgb(28, 28, 28))",
              border: "1.5px solid rgba(160, 160, 160, 0.21)",
              borderRadius: "9999px",
            }}
          >
            Go to reflections
          </Link>
        )
      )}
    </motion.div>
  );
}
