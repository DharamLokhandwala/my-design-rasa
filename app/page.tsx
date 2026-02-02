"use client";

import React, { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import UploadZone from "./components/UploadZone";
import LoadingState from "./components/LoadingState";
import TasteCard from "./components/TasteCard";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { analyzeImageForLexicons } from "@/app/actions/analyze-image";
import { extractImageColors } from "@/lib/extract-image-colors";

type AppState = "upload" | "loading" | "taste";

// Mock data as per requirements
const MOCK_LEXICONS = [
  "Translucence & Glassmorphism",
  "Refractive Indexing",
  "Digital Surrealism",
  "Central Symmetries",
];

const MOCK_KEYWORDS = [
  "3D Prismatic Art",
  "Abstract Refraction",
  "Emerald Cut Geometry",
  "Vaporwave Lighting",
  "Iridescent Materials",
];

export default function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  // Unwrap searchParams Promise to prevent serialization errors
  if (searchParams) {
    use(searchParams);
  }
  const router = useRouter();
  const [state, setState] = useState<AppState>("upload");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [colorSwatchesPerImage, setColorSwatchesPerImage] = useState<string[][]>([]);
  const [uploadedLexicons, setUploadedLexicons] = useState<string[]>([]);

  // If a user is already authenticated, send them straight to reflections so
  // they can drop files there instead of seeing the initial UploadZone.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) {
          // Supabase may surface an AuthSessionMissingError when there is
          // simply no current session. Treat that as \"not signed in\" and
          // avoid noisy console errors.
          if ((error as any).name !== "AuthSessionMissingError") {
            console.error("Failed to check auth status on home page:", error);
          }
          return;
        }
        if (data.user) {
          router.replace("/reflections");
        }
      })
      .catch((err) => {
        if ((err as any).name !== "AuthSessionMissingError") {
          console.error("Unexpected auth check error on home page:", err);
        }
      });
  }, [router]);

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const supabase = createSupabaseBrowserClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `designs/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from("designs")
        .upload(path, file);

      if (error) {
        console.error("Supabase storage upload failed:", error);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("designs")
        .getPublicUrl(data.path);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    if (uploadedUrls.length === 0) return;

    setImageUrls(uploadedUrls);
    setState("loading");

    try {
      const [lexiconResult, , ...colorArrays] = await Promise.all([
        analyzeImageForLexicons(uploadedUrls[0]),
        new Promise<void>((r) => setTimeout(r, 1500)),
        ...uploadedUrls.map((url) => extractImageColors(url)),
      ]);
      const allColorSwatches = colorArrays as string[][];
      setUploadedLexicons(lexiconResult.lexicons);
      setColorSwatchesPerImage(allColorSwatches);
      setState("taste");
    } catch {
      const allColorSwatches = await Promise.all(
        uploadedUrls.map((url) => extractImageColors(url))
      );
      setUploadedLexicons(MOCK_LEXICONS);
      setColorSwatchesPerImage(allColorSwatches);
      setState("taste");
    }
  };

  const handleClose = () => {
    setState("upload");
    setImageUrls([]);
    setUploadedLexicons([]);
  };

  const handleSave = () => {
    // Animation is handled in TasteCard component
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleUploadNew = () => {
    handleClose();
  };

  return (
    <div className="min-h-screen bg-[#181818]">
      <AnimatePresence mode="wait">
        {state === "upload" && (
          <UploadZone key="upload" onImageUpload={handleImageUpload} />
        )}
        {state === "loading" && <LoadingState key="loading" />}
        {state === "taste" && (
          <TasteCard
            key="taste"
            imageUrls={imageUrls}
            colorSwatchesPerImage={colorSwatchesPerImage}
            lexicons={uploadedLexicons.length > 0 ? uploadedLexicons : MOCK_LEXICONS}
            keywords={MOCK_KEYWORDS}
            initialExplanation={""}
            onClose={handleClose}
            onSave={handleSave}
            onUploadNew={handleUploadNew}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
