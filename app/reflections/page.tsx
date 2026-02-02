"use client";

import React, { useState, use, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import TasteCard from "../components/TasteCard";
import LoadingState from "../components/LoadingState";
import UploadZone from "../components/UploadZone";
import { useRasa, type Reflection } from "../context/RasaContext";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import AuthButton from "../components/AuthButton";
import { getReflections, saveReflection } from "@/app/actions/reflections";
import { analyzeImageForLexicons } from "@/app/actions/analyze-image";
import { extractImageColors } from "@/lib/extract-image-colors";

// Mock data (same as main page)
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

// Upload icon SVG (same as UploadZone)
const UploadIcon = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 210 210"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white opacity-80"
  >
    <path
      d="M126.569 83.9274L131.579 92.6039C139.541 106.395 136.066 119.364 122.275 127.327L90.5239 145.658C80.8623 151.236 71.5502 151.207 64.1355 145.889L64.3773 145.346L75.7998 122.08C77.6496 118.284 82.0623 116.039 86.1086 116.835L88.0093 117.152C92.4303 117.985 97.2042 115.228 98.6939 110.984L106.646 88.3574C108.136 84.1126 112.91 81.3564 117.331 82.1887L126.569 83.9274Z"
      fill="white"
    />
    <path
      d="M94.4439 37.3078L83.3047 43.7391C78.4928 46.5172 77.2758 51.0592 80.0539 55.8711L86.4852 67.0103C89.2633 71.8222 93.8053 73.0392 98.6172 70.2611L109.756 63.8298C114.568 61.0517 115.785 56.5097 113.007 51.6978L106.576 40.5586C103.798 35.7467 99.2558 34.5297 94.4439 37.3078ZM104.919 49.8508C106.098 55.131 102.611 60.3778 100.906 61.3622C99.2006 62.3465 92.9946 62.7975 88.9298 59.0821C88.3087 58.5313 87.7575 57.8392 87.3419 57.1193C85.92 54.6565 85.7047 51.3961 87.8378 49.0532C89.1069 47.6638 90.9271 46.9665 92.6704 47.2735C93.336 45.6263 94.8281 44.3606 96.7037 43.9344C100.824 43.0207 104.176 46.2889 104.919 49.8508Z"
      fill="white"
    />
    <path
      d="M109.758 63.8291L98.6183 70.2603C93.8064 73.0384 89.2644 71.8214 86.4862 67.0096L80.055 55.8703C79.18 54.3548 78.7394 52.8915 78.6354 51.4865C78.5975 51.5084 78.5596 51.5303 78.5218 51.5521L46.7711 69.8834C32.9796 77.8459 29.5047 90.8146 37.4672 104.606L55.7984 136.357C58.1828 140.487 60.9808 143.67 64.1327 145.892L64.3745 145.348L75.7969 122.083C77.6468 118.287 82.0594 116.042 86.1058 116.838L88.0065 117.155C92.4274 117.987 97.2014 115.231 98.6911 110.986L106.643 88.3602C108.133 84.1154 112.907 81.3591 117.328 82.1914L126.566 83.9302L113.244 60.8561C113.223 60.8182 113.201 60.7803 113.179 60.7424C112.386 61.9072 111.273 62.9541 109.758 63.8291Z"
      fill="#545454"
    />
    <path
      d="M69.6058 99.0338C74.586 96.1585 76.2923 89.7903 73.417 84.8101C70.5417 79.8298 64.1735 78.1235 59.1933 80.9988C54.213 83.8742 52.5067 90.2423 55.382 95.2226C58.2574 100.203 64.6255 101.909 69.6058 99.0338Z"
      fill="white"
    />
    <path
      d="M149.689 91.7353L152.282 101.413C156.404 116.795 149.691 128.422 134.308 132.544L98.8951 142.033C88.119 144.921 79.1317 142.482 73.3459 135.427L73.7202 134.964L90.7751 115.448C93.5443 112.26 98.3876 111.234 102.09 113.05L103.844 113.848C107.899 115.796 113.223 114.37 115.761 110.655L129.298 90.8579C131.836 87.1433 137.161 85.7165 141.216 87.6647L149.689 91.7353Z"
      fill="white"
    />
    <path
      d="M130.726 38.3889L118.301 41.718C112.934 43.156 110.583 47.2283 112.021 52.5952L115.35 65.0195C116.788 70.3864 120.861 72.7375 126.228 71.2994L138.652 67.9704C144.019 66.5323 146.37 62.46 144.932 57.0931L141.603 44.6689C140.165 39.302 136.092 36.9508 130.726 38.3889ZM137.597 53.2156C137.37 58.6212 132.643 62.7865 130.741 63.296C128.84 63.8056 122.728 62.6349 119.764 57.9941C119.306 57.3013 118.953 56.4901 118.738 55.6872C118.002 52.9403 118.638 49.7353 121.305 48.0243C122.89 47.0107 124.829 46.8083 126.433 47.556C127.502 46.1371 129.271 45.3008 131.193 45.3746C135.409 45.5584 137.801 49.5827 137.597 53.2156Z"
      fill="white"
    />
    <path
      d="M138.651 67.9709L126.227 71.3C120.86 72.738 116.788 70.3869 115.35 65.02L112.021 52.5957C111.568 50.9054 111.521 49.378 111.784 47.9939C111.742 48.0052 111.7 48.0166 111.657 48.0279L76.244 57.5168C60.8617 61.6385 54.1486 73.266 58.2703 88.6483L67.7592 124.062C68.9935 128.668 70.8721 132.467 73.3416 135.429L73.7158 134.966L90.7707 115.45C93.54 112.262 98.3832 111.236 102.086 113.052L103.84 113.85C107.894 115.799 113.219 114.372 115.757 110.657L129.294 90.8601C131.832 87.1455 137.156 85.7188 141.211 87.667L149.685 91.7375L142.789 66.0017C142.777 65.9594 142.766 65.9171 142.755 65.8749C141.688 66.7949 140.342 67.518 138.651 67.9709Z"
      fill="#888888"
    />
    <path
      d="M90.7582 91.5835C96.3129 90.0952 99.6093 84.3856 98.1209 78.8309C96.6325 73.2762 90.923 69.9798 85.3682 71.4681C79.8135 72.9565 76.5171 78.6661 78.0055 84.2208C79.4939 89.7755 85.2034 93.0719 90.7582 91.5835Z"
      fill="white"
    />
    <path
      d="M170.521 101.786V111.805C170.521 127.73 161.027 137.224 145.102 137.224H108.439C97.2832 137.224 89.2332 132.543 85.4707 124.23L85.952 123.88L107.477 109.443C110.977 107.08 115.921 107.343 119.027 110.055L120.514 111.28C123.927 114.211 129.439 114.211 132.852 111.28L151.052 95.6613C154.464 92.7301 159.977 92.7301 163.389 95.6613L170.521 101.786Z"
      fill="white"
    />
    <path
      d="M166.011 45.3506H153.149C147.593 45.3506 144.268 48.6756 144.268 54.2318V67.0943C144.268 72.6506 147.593 75.9756 153.149 75.9756H166.011C171.568 75.9756 174.893 72.6506 174.893 67.0943V54.2318C174.893 48.6756 171.568 45.3506 166.011 45.3506ZM168.811 61.4506C167.193 66.6131 161.549 69.4131 159.58 69.4131C157.611 69.4131 152.011 66.7006 150.349 61.4506C150.086 60.6631 149.955 59.7881 149.955 58.9568C149.955 56.1131 151.399 53.1818 154.418 52.2193C156.211 51.6506 158.136 51.9568 159.493 53.0943C160.893 52.0006 162.818 51.6506 164.655 52.2193C168.68 53.4881 169.949 57.9943 168.811 61.4506Z"
      fill="white"
    />
    <path
      d="M166.013 75.9756H153.151C147.595 75.9756 144.27 72.6506 144.27 67.0943V54.2318C144.27 52.4818 144.62 50.9943 145.232 49.7256C145.188 49.7256 145.145 49.7256 145.101 49.7256H108.438C92.5133 49.7256 83.0195 59.2193 83.0195 75.1443V111.807C83.0195 116.576 83.8508 120.732 85.4695 124.232L85.9508 123.882L107.476 109.444C110.976 107.082 115.92 107.344 119.026 110.057L120.513 111.282C123.926 114.213 129.438 114.213 132.851 111.282L151.051 95.6631C154.463 92.7318 159.976 92.7318 163.388 95.6631L170.52 101.788V75.1443C170.52 75.1006 170.52 75.0568 170.52 75.0131C169.251 75.6256 167.763 75.9756 166.013 75.9756Z"
      fill="#A4A4A4"
    />
    <path
      d="M113.639 86.3885C119.39 86.3885 124.052 81.7266 124.052 75.976C124.052 70.2253 119.39 65.5635 113.639 65.5635C107.888 65.5635 103.227 70.2253 103.227 75.976C103.227 81.7266 107.888 86.3885 113.639 86.3885Z"
      fill="white"
    />
    <path
      d="M163.535 100.886C158.547 99.573 152.685 98.873 145.685 98.873C135.972 98.873 132.385 101.236 127.397 104.998C127.135 105.173 126.872 105.436 126.61 105.698L118.297 114.536C111.297 121.886 98.6973 121.973 91.6973 114.448L83.3848 105.698C83.1223 105.436 82.8598 105.173 82.5973 104.998C77.6098 101.236 74.0223 98.873 64.3098 98.873C57.3098 98.873 51.4473 99.573 46.4598 100.886C25.6348 106.486 25.6348 123.023 25.6348 137.548V145.686C25.6348 167.648 25.6348 192.498 72.4473 192.498H137.547C168.61 192.498 184.36 176.748 184.36 145.686V137.548C184.36 123.023 184.36 106.486 163.535 100.886ZM125.385 160.998H84.6098C81.2848 160.998 78.5723 158.286 78.5723 154.873C78.5723 151.461 81.2848 148.748 84.6098 148.748H125.385C128.71 148.748 131.422 151.461 131.422 154.873C131.422 158.286 128.71 160.998 125.385 160.998Z"
      fill="white"
    />
    <path
      d="M131.43 154.875C131.43 158.288 128.718 161 125.393 161H84.6176C81.2926 161 78.5801 158.288 78.5801 154.875C78.5801 151.463 81.2926 148.75 84.6176 148.75H125.393C128.718 148.75 131.43 151.463 131.43 154.875Z"
      fill="#5B5B5B"
    />
  </svg>
);

export default function ReflectionsDirectory({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  // Unwrap searchParams Promise to prevent serialization errors
  if (searchParams) {
    use(searchParams);
  }
  const router = useRouter();
  const { reflections, removeReflection } = useRasa();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [remoteReflections, setRemoteReflections] = useState<Reflection[]>([]);
  const [isLoadingReflections, setIsLoadingReflections] = useState(true);
  const [selected, setSelected] = useState<Reflection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "taste">("idle");
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadedColorSwatches, setUploadedColorSwatches] = useState<string[][]>([]);
  const [uploadedLexicons, setUploadedLexicons] = useState<string[]>([]);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data.user) {
        setIsSignedIn(false);
      } else {
        setIsSignedIn(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session?.user);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load persisted reflections from Supabase (only when signed in)
  useEffect(() => {
    if (isSignedIn !== true) {
      setIsLoadingReflections(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setIsLoadingReflections(true);
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
        setRemoteReflections(mapped);
      } catch (err) {
        console.error("Failed to load reflections from Supabase:", err);
      } finally {
        if (!cancelled) {
          setIsLoadingReflections(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  // If there is a pending reflection stored locally (from an anonymous user who
  // just signed up), persist it once the user lands here after auth.
  useEffect(() => {
    let cancelled = false;

    const trySavePending = async (retry = false): Promise<boolean> => {
      if (typeof window === "undefined") return false;
      const raw = window.localStorage.getItem("pendingReflection");
      if (!raw) return false;

      try {
        const parsed = JSON.parse(raw) as {
          imageUrl: string;
          colors?: string[];
          explanation?: string;
          lexicons?: string[];
        };

        const result = await saveReflection({
          imageUrl: parsed.imageUrl,
          lexicons: parsed.lexicons ?? [],
          explanation: parsed.explanation ?? "",
          title: parsed.lexicons?.[0],
        });

        if (cancelled) return false;

        setRemoteReflections((prev) => [
          {
            id: result.reflectionId,
            createdAt: Date.now(),
            imageUrl: parsed.imageUrl,
            colors: parsed.colors ?? [],
            explanation: parsed.explanation ?? "",
            lexicons: parsed.lexicons ?? [],
          },
          ...prev,
        ]);
        try {
          window.localStorage.removeItem("pendingReflection");
        } catch {
          // ignore
        }
        return true;
      } catch (err) {
        const isNotAuth =
          err instanceof Error && err.message === "Not authenticated";
        if (isNotAuth) {
          // Session may not be ready yet after magic-link redirect; don't log.
          if (!retry) {
            await new Promise((r) => setTimeout(r, 1500));
            if (!cancelled) return trySavePending(true);
          }
          return false;
        }
        console.error(
          "Failed to persist pending reflection after authentication:",
          err
        );
        try {
          window.localStorage.removeItem("pendingReflection");
        } catch {
          // ignore
        }
        return false;
      }
    };

    trySavePending();

    return () => {
      cancelled = true;
    };
  }, [setRemoteReflections, router]);

  const handleImageUpload = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter(
        (file) => file.type === "image/jpeg" || file.type === "image/png"
      );
      if (imageFiles.length === 0) return;
      try {
        const uploadedUrls: string[] = [];
        for (const file of imageFiles) {
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
        if (uploadedUrls.length > 0) {
          setUploadedImageUrls(uploadedUrls);
          setUploadState("loading");
          try {
            const [lexiconResult, , ...colorArrays] = await Promise.all([
              analyzeImageForLexicons(uploadedUrls[0]),
              new Promise<void>((r) => setTimeout(r, 1500)),
              ...uploadedUrls.map((url) => extractImageColors(url)),
            ]);
            const allColorSwatches = colorArrays as string[][];
            setUploadedLexicons(lexiconResult.lexicons);
            setUploadedColorSwatches(allColorSwatches);
            setUploadState("taste");
          } catch {
            const allColorSwatches = await Promise.all(
              uploadedUrls.map((url) => extractImageColors(url))
            );
            setUploadedLexicons(MOCK_LEXICONS);
            setUploadedColorSwatches(allColorSwatches);
            setUploadState("taste");
          }
        }
      } catch (err) {
        console.error("Error handling upload:", err);
      }
    },
    [supabase]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) await handleImageUpload(files);
    },
    [handleImageUpload]
  );

  const handleUploadClose = useCallback(() => {
    setUploadState("idle");
    setUploadedImageUrls([]);
    setUploadedColorSwatches([]);
    setUploadedLexicons([]);
  }, []);

  const handleUploadSave = useCallback(() => {
    // Animation is handled in TasteCard component
    setTimeout(() => {
      handleUploadClose();
    }, 2000);
  }, [handleUploadClose]);

  const handleUploadNew = useCallback(() => {
    handleUploadClose();
  }, [handleUploadClose]);

  const handleCloseSelectedReflection = useCallback(async () => {
    setSelected(null);
    try {
      const rows = await getReflections();
      const mapped: Reflection[] = rows.map((r) => ({
        id: r.id,
        createdAt: Date.parse(r.created_at),
        imageUrl: r.image_url,
        colors: [],
        explanation: r.explanation ?? "",
        lexicons: r.lexicons ?? [],
      }));
      setRemoteReflections(mapped);
    } catch (err) {
      console.error("Failed to refetch reflections:", err);
    }
  }, []);

  const allReflections: Reflection[] = [
    ...remoteReflections,
    ...reflections,
  ];

  // While auth is still loading, show a brief loading state so signed-in users
  // don't see UploadZone when navigating from TasteGlimpseCard.
  if (isSignedIn === null) {
    return (
      <div className="min-h-screen bg-[#181818] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-neutral-600 border-t-neutral-300 animate-spin" />
          <p className="text-sm text-neutral-500">Loading reflections…</p>
        </div>
      </div>
    );
  }

  // When signed out, show UploadZone (same as home for anonymous users).
  // UploadZone includes AuthButton, which uses the sign-in popup (SignInModal).
  if (isSignedIn === false) {
    return (
      <div className="min-h-screen bg-[#181818]">
        <UploadZone onImageUpload={handleImageUpload} />
        <AnimatePresence>
          {uploadState === "loading" && <LoadingState key="upload-loading" />}
        </AnimatePresence>
        <AnimatePresence>
          {uploadState === "taste" && (
            <TasteCard
              key="uploaded-taste"
              imageUrls={uploadedImageUrls}
              colorSwatchesPerImage={uploadedColorSwatches}
              lexicons={uploadedLexicons.length > 0 ? uploadedLexicons : MOCK_LEXICONS}
              keywords={MOCK_KEYWORDS}
              initialExplanation={""}
              onClose={handleUploadClose}
              onSave={handleUploadSave}
              onUploadNew={handleUploadNew}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#101010] text-white flex flex-col relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header: helper text on left, title centered, actions on the right */}
      <header className="relative pt-8 pb-10 px-6 flex items-center">
        <span className="text-[11px] tracking-[0.15em] uppercase text-neutral-500 font-sans font-medium">
          drop files anywhere
        </span>
        <h2
          className="absolute left-1/2 -translate-x-1/2 text-2xl md:text-3xl text-neutral-400 text-center tracking-tighter"
          style={{
            fontFamily: "var(--font-serif)",
            lineHeight: 1.2,
          }}
        >
          Your taste reflections
        </h2>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/reflections/glimpse"
            className="inline-flex items-center rounded-full bg-neutral-900/80 border tracking-wide border-neutral-700 px-5 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors shadow-lg backdrop-blur"
          >
            Taste glimpse
          </Link>
          <AuthButton />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pb-12 flex flex-col gap-12">
        {isLoadingReflections && allReflections.length === 0 ? (
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-neutral-400">
                loading your reflections
              </p>
              <div className="h-2 w-24 rounded-full bg-neutral-800 overflow-hidden">
                <div className="h-full w-1/2 bg-neutral-500 animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="relative rounded-[32px] bg-black/80 border border-neutral-900 overflow-hidden flex flex-col animate-pulse"
                >
                  <div className="p-4 pb-0">
                    <div className="relative rounded-[24px] overflow-hidden bg-neutral-900 aspect-[4/5]" />
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex h-6 w-20 rounded-full bg-neutral-800" />
                      <span className="inline-flex h-6 w-16 rounded-full bg-neutral-800" />
                      <span className="inline-flex h-6 w-24 rounded-full bg-neutral-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : allReflections.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-neutral-400 flex-1">
            <p className="text-sm">
              You don&apos;t have any saved reflections yet.
            </p>
            <Link
              href="/"
              className="text-sm text-neutral-200 underline underline-offset-4 hover:text-white"
            >
              Upload an image to start reflecting
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allReflections.map((reflection) => (
                <article
                  key={reflection.id}
                  className="relative rounded-[32px] bg-black/90 border border-neutral-800 overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => setSelected(reflection)}
                >
                  <div className="p-4 pb-0">
                    <div className="relative rounded-[18px] overflow-hidden bg-black">
                      <img
                        src={reflection.imageUrl}
                        alt="Saved reflection"
                        className="w-full h-full object-cover aspect-[4/5]"
                      />
                    </div>
                  </div>

                  <div className="px-5 py-4 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(reflection.lexicons || []).slice(0, 3).map((lexicon, idx) => (
                        <span
                          key={`${lexicon}-${idx}`}
                          className="inline-flex items-center rounded-full border border-neutral-800 px-3 py-1 text-xs uppercase tracking-wider text-neutral-400 bg-neutral-900/60"
                        >
                          {lexicon}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Drop overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-4"
            >
              <motion.div
                animate={{ scale: 1.5, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <UploadIcon />
              </motion.div>
              <p className="text-white text-lg font-medium">dropping files</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state for uploaded images */}
      <AnimatePresence>
        {uploadState === "loading" && <LoadingState key="upload-loading" />}
      </AnimatePresence>

      {/* Taste card popup for uploaded images */}
      <AnimatePresence>
        {uploadState === "taste" && (
          <TasteCard
            key="uploaded-taste"
            imageUrls={uploadedImageUrls}
            colorSwatchesPerImage={uploadedColorSwatches}
            lexicons={uploadedLexicons.length > 0 ? uploadedLexicons : MOCK_LEXICONS}
            keywords={MOCK_KEYWORDS}
            initialExplanation={""}
            onClose={handleUploadClose}
            onSave={handleUploadSave}
            onUploadNew={handleUploadNew}
          />
        )}
      </AnimatePresence>

      {/* Taste card popup for selected reflection */}
      <AnimatePresence>
        {selected && uploadState === "idle" && (
          <TasteCard
            key={selected.id}
            imageUrls={[selected.imageUrl]}
            colorSwatchesPerImage={[selected.colors]}
            lexicons={selected.lexicons}
            keywords={[]}
            initialExplanation={selected.explanation}
            onClose={handleCloseSelectedReflection}
            onSave={() => {}}
            onUploadNew={() => setSelected(null)}
            reflectionId={selected.id}
            onDelete={() => {
              setRemoteReflections((prev) => prev.filter((r) => r.id !== selected.id));
              removeReflection(selected.id, selected.imageUrl);
              setSelected(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

