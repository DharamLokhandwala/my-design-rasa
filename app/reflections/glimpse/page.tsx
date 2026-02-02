"use client";

import React, { use } from "react";
import Link from "next/link";
import TasteGlimpseCard from "../../components/TasteGlimpseCard";
import { useRasa } from "../../context/RasaContext";

export default function TasteGlimpsePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  if (searchParams) {
    use(searchParams);
  }
  const { reflections } = useRasa();

  return (
    <div className="min-h-screen bg-[#101010] text-white flex flex-col">
      {/* Top: Go to reflections button (right) */}
      <header className="relative pt-8 pb-10 px-6 flex justify-end items-center">
        <Link
          href="/reflections"
          className="inline-flex items-center rounded-full tracking-wide bg-neutral-900/80 border border-neutral-700 px-5 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors shadow-lg backdrop-blur"
        >
          Go to reflections
        </Link>
      </header>

      <main className="flex-1 px-6 pb-12 flex flex-col items-center justify-center">
        {/* TESTING: always show glimpse; re-enable "> 2" check for production */}
        <TasteGlimpseCard
          reflections={reflections}
          hideButton={true}
        />
      </main>
    </div>
  );
}
