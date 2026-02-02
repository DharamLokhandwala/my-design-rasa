"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Save, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import SignInModal from "./SignInModal";
import { useRasa } from "../context/RasaContext";
import { saveReflection, deleteReflection, updateReflection } from "@/app/actions/reflections";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface TasteCardProps {
  imageUrls: string[];
  colorSwatchesPerImage: string[][];
  lexicons: string[];
  keywords: string[];
  initialExplanation?: string;
  onClose: () => void;
  onSave: () => void;
  onUploadNew: () => void;
  /** When set, show "delete reflection" instead of "upload new image" and call onDelete when clicked. */
  reflectionId?: string;
  onDelete?: () => void;
}

// Lexicon definitions mapping
const LEXICON_DEFINITIONS: Record<string, string> = {
  "Translucence & Glassmorphism": "A design aesthetic combining transparent materials with frosted glass effects",
  "Refractive Indexing": "The visual phenomenon of light bending through transparent surfaces creating prismatic effects",
  "Digital Surrealism": "Artistic style blending digital techniques with dreamlike, fantastical imagery",
  "Central Symmetries": "Design patterns organized around a central axis creating balanced, harmonious compositions",
};

export default function TasteCard({
  imageUrls,
  colorSwatchesPerImage,
  lexicons,
  keywords,
  initialExplanation,
  onClose,
  onSave,
  onUploadNew,
  reflectionId,
  onDelete,
}: TasteCardProps) {
  const isViewingReflection = Boolean(reflectionId && onDelete);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const router = useRouter();
  const { addToCollection, isCollected, addReflection } = useRasa();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  // Hover tooltip for lexicon definitions (commented out for now; restore when needed)
  // const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showSavedAnimation, setShowSavedAnimation] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredColorIndex, setHoveredColorIndex] = useState<number | null>(null);
  const [copiedColorIndex, setCopiedColorIndex] = useState<number | null>(null);
  const [explanation, setExplanation] = useState(initialExplanation ?? "");
  const [showExplanationSaved, setShowExplanationSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextareaToContent = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(80, el.scrollHeight)}px`;
  };

  useEffect(() => {
    resizeTextareaToContent();
  }, [explanation]);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save after user stops typing (debounced); existing reflection only
  useEffect(() => {
    const trimmed = explanation.trim();
    if (!trimmed || !reflectionId) return;
    const t = setTimeout(async () => {
      try {
        await updateReflection(reflectionId, {
          explanation: trimmed,
          lexicons,
        });
        setShowExplanationSaved(true);
        setTimeout(() => setShowExplanationSaved(false), 2000);
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [explanation, reflectionId, lexicons]);

  // Reset color-related state when image changes
  useEffect(() => {
    setHoveredColorIndex(null);
    setCopiedColorIndex(null);
  }, [currentImageIndex]);

  // Click-to-collect lexicons (commented out for now; restore when needed)
  // const handleItemClick = (item: string) => {
  //   if (!isCollected(item)) {
  //     addToCollection(item);
  //   }
  // };

  type SaveResult = "saved" | "redirected-to-login" | "error";

  const handleSave = async (): Promise<SaveResult> => {
    if (isSaving) return "error";
    setIsSaving(true);

    const currentImageUrl = imageUrls[currentImageIndex];
    const currentColors = colorSwatchesPerImage[currentImageIndex] || [];
    const trimmedExplanation = explanation.trim();

    const pendingPayload = {
      imageUrl: currentImageUrl,
      colors: currentColors,
      explanation: trimmedExplanation,
      lexicons,
    };

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Failed to check auth status:", error);
      }

      if (!user) {
        // User is not authenticated: store pending reflection and show sign-in prompt
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              "pendingReflection",
              JSON.stringify(pendingPayload)
            );
          }
        } catch (storageError) {
          console.error("Failed to persist pending reflection locally:", storageError);
        }

        setShowSignInPrompt(true);
        return "redirected-to-login";
      }

      if (reflectionId) {
        // Updating existing reflection – persist changes only (no new project/reflection)
        await updateReflection(reflectionId, {
          explanation: trimmedExplanation,
          lexicons,
        });
      } else {
        // New reflection – add to local context and persist to Supabase
        addReflection({
          imageUrl: currentImageUrl,
          colors: currentColors,
          explanation: trimmedExplanation,
          lexicons,
        });

        await saveReflection({
          imageUrl: currentImageUrl,
          lexicons,
          explanation: trimmedExplanation,
          title: lexicons?.[0],
        });
      }

      setShowSavedAnimation(true);
      setTimeout(() => {
        onSave();
        onClose();
        setShowSavedAnimation(false);
      }, 2000);

      return "saved";
    } catch (err) {
      console.error("Failed to save reflection:", err);
      return "error";
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndGoToReflections = async () => {
    const result = await handleSave();
    if (result === "saved") {
      router.push("/reflections");
    }
    // If redirected to login, that navigation already happened in handleSave.
  };

  const handleSaveOnEnter = async () => {
    const trimmed = explanation.trim();
    if (!trimmed) return;
    if (reflectionId) {
      try {
        await updateReflection(reflectionId, {
          explanation: trimmed,
          lexicons,
        });
        setShowExplanationSaved(true);
        setTimeout(() => setShowExplanationSaved(false), 2000);
      } catch (err) {
        console.error("Failed to save explanation:", err);
      }
    } else {
      await handleSave();
    }
  };

  const handleClose = async () => {
    const trimmed = explanation.trim();
    if (reflectionId && trimmed) {
      try {
        await updateReflection(reflectionId, {
          explanation: trimmed,
          lexicons,
        });
      } catch (err) {
        console.error("Failed to save on close:", err);
      }
    }
    onClose();
  };

  // Convert color to hex format
  const colorToHex = (color: string): string => {
    // If already hex, return as is
    if (color.startsWith('#')) {
      return color.toUpperCase();
    }
    
    // If RGB format, convert to hex
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`.toUpperCase();
    }
    
    return color;
  };

  const handleColorClick = async (color: string, index: number) => {
    const hexColor = colorToHex(color);
    try {
      await navigator.clipboard.writeText(hexColor);
      setCopiedColorIndex(index);
      setTimeout(() => {
        setCopiedColorIndex(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 flex items-center justify-center p-8 z-50 pointer-events-none"
      >
        <div 
          className="relative w-full max-w-6xl shadow-2xl pointer-events-auto" 
          style={{ 
            borderRadius: '36px',
            padding: '1.5px',
            background: 'linear-gradient(135deg, #393939 0%,rgba(113, 113, 113, 0.28) 100%)'
          }}
        >
          <div 
            className="relative w-full h-full bg-neutral-900 rounded-[36px] overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white" />
            </button>

            <div 
              className="flex flex-col md:flex-row"
              style={{
                background: 'linear-gradient(to right, rgb(32, 32, 32), rgb(28, 28, 28))'
              }}
            >
            {/* Left side - Image with color swatches */}
            <div className="relative w-full md:w-1/2 aspect-square bg-black">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={imageUrls[currentImageIndex]}
                  alt={`Uploaded design ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              
              {/* Image navigation buttons */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-20"
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} className="text-white" />
                  </button>
                  
                  {/* Image indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {imageUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'bg-white w-6'
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {/* Color swatches */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <AnimatePresence>
                  {colorSwatchesPerImage[currentImageIndex]?.map((color, index) => {
                    const hexColor = colorToHex(color);
                    return (
                      <motion.div
                        key={`${currentImageIndex}-${index}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.2 }}
                        className="relative"
                        onMouseEnter={() => setHoveredColorIndex(index)}
                        onMouseLeave={() => setHoveredColorIndex(null)}
                      >
                        <motion.div
                          className="w-12 h-12 rounded-full border-2 border-white/20 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorClick(color, index)}
                        />
                        <AnimatePresence>
                          {hoveredColorIndex === index && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-neutral-800 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none"
                            >
                              {copiedColorIndex === index ? 'Copied!' : hexColor}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Right side - Text panel */}
            <div 
              className="w-full md:w-1/2 p-8 md:p-12 flex flex-col gap-10"
              style={{
                backgroundImage: 'linear-gradient(90deg, rgba(29, 29, 29, 0.29) 0%, rgba(40, 40, 40, 0.18) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                backgroundColor: 'unset'
              }}
            >
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl text-neutral-400 tracking-tighter" style={{ fontFamily: 'var(--font-serif)', lineHeight: '1.5'}}>
                  Reflect on your taste
                </h2>
                <p className="text-neutral-500 font-light tracking-normal" style={{ lineHeight: '1.5', paddingBottom: '12px'}}>
                Lexicons will help you get clarity on why you like in this particular design
                </p>
                {/* Lexicons */}
              <div className="flex flex-col gap-2">
                {/* <h3 className="text-neutral-400 uppercase tracking-wider" style={{ color: 'rgba(204, 204, 204, 0.7)', fontSize: '0.75rem' }}>
                  LEXICONS
                </h3> */}
                <div className="grid grid-cols-2 gap-2 tracking-regular">
                  {lexicons.map((lexicon, index) => (
                      <div key={`${lexicon}-${index}`} className="relative">
                        <span
                          className="text-neutral-300 flex items-center gap-2 group w-full text-left"
                          style={{ fontSize: '1rem' }}
                        >
                          {lexicon}
                        </span>
                        {/* Click-to-collect: uncomment when needed. Restore handleItemClick, use button with onClick, and show check when isCollected(lexicon). */}
                        {/* <button onClick={() => handleItemClick(lexicon)} ...>
                          <span>{lexicon}</span>
                          {collected && <motion.span><Check size={16} /></motion.span>}
                        </button> */}
                        {/* Hover tooltip: uncomment when needed. Requires hoveredItem state and onMouseEnter/onMouseLeave on wrapper. */}
                        {/* <AnimatePresence>
                          {hoveredItem === lexicon && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-neutral-300 text-neutral-800 text-xs rounded max-w-xs z-20"
                              style={{ whiteSpace: "normal" }}
                            >
                              {LEXICON_DEFINITIONS[lexicon] || "A design vocabulary term"}
                            </motion.div>
                          )}
                        </AnimatePresence> */}
                      </div>
                    ))}
                </div>
              </div>
              </div>
              

              

              {/* Keywords */}
              <div className="flex flex-col gap-2">
                <h3
                  className="text-neutral-400 tracking-wider"
                  style={{ color: "#cccccc", fontSize: "0.75rem" }}
                >
                  Reflect here
                </h3>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveOnEnter();
                      }
                    }}
                    onBlur={async () => {
                      const trimmed = explanation.trim();
                      if (!trimmed) return;
                      if (reflectionId) {
                        try {
                          await updateReflection(reflectionId, {
                            explanation: trimmed,
                            lexicons,
                          });
                          setShowExplanationSaved(true);
                          setTimeout(() => setShowExplanationSaved(false), 2000);
                        } catch (err) {
                          console.error("Failed to save explanation:", err);
                        }
                      }
                      // New reflection: toast only shown after full save (e.g. "save reflection" button)
                    }}
                    className="w-full min-h-[80px] rounded-2xl border px-4 py-3 text-sm text-white placeholder-neutral-500 resize-none focus:outline-none overflow-hidden"
                    style={{
                      borderColor: "rgb(56, 56, 56)",
                      background: "linear-gradient(to right, #202020, #1c1c1c)",
                    }}
                    placeholder="e.g., I love this design because of the pastel colors going really well with the material chosen..."
                  />
                  <AnimatePresence>
                    {showExplanationSaved && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute -bottom-8 left-0 px-3 py-1 rounded-full bg-neutral-800 text-xs text-white shadow-lg"
                      >
                        explanation saved
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveAndGoToReflections}
            className="rounded-full px-6 py-3 text-sm font-medium text-white bg-neutral-100/10 border border-neutral-600/80 hover:bg-neutral-100/20 transition-colors flex items-center gap-2"
            disabled={isSaving}
          >
            <Save size={16} />
            <span>save reflection</span>
          </motion.button>
          {isViewingReflection ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="rounded-full px-6 py-3 text-sm font-medium text-white flex items-center gap-2 border border-neutral-600/80 bg-neutral-800/90 transition-colors duration-200 hover:bg-red-900/80 hover:border-red-500 hover:text-red-100"
            >
              <Trash2 size={16} aria-hidden />
              {/* <span>delete reflection</span> */}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onUploadNew}
              className="rounded-full px-6 py-3 text-sm font-medium text-white transition-colors"
            >
              upload new image
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Sign in / sign up prompt when signed-out user tries to save */}
      <SignInModal
        open={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        title="Sign in or sign up to save your reflection."
        subtitle="Enter your email and we'll send you a magic link."
      />

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55]"
              onClick={() => setShowDeleteConfirm(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[56] w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 p-6 shadow-xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-white text-center text-base font-medium mb-6">
                Are you sure you want to delete this reflection?
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-neutral-300 border border-neutral-600 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!reflectionId || !onDelete || isDeleting) return;
                    setIsDeleting(true);
                    try {
                      await deleteReflection(reflectionId);
                      setShowDeleteConfirm(false);
                      onDelete();
                    } catch (err) {
                      console.error("Failed to delete reflection:", err);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={16} aria-hidden />
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Saved animation */}
      <AnimatePresence>
        {showSavedAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none"
          >
            <div className="bg-neutral-900 px-8 py-4 rounded-lg border border-neutral-700">
              <p className="text-white text-lg font-semibold">
                Saved to your rasa
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
