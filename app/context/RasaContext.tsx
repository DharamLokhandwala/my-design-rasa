"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Reflection {
  id: string;
  imageUrl: string;
  colors: string[];
  explanation: string;
  lexicons: string[];
  createdAt: number;
}

interface RasaContextType {
  collectedItems: Set<string>;
  addToCollection: (item: string) => void;
  isCollected: (item: string) => boolean;
  reflections: Reflection[];
  addReflection: (data: {
    imageUrl: string;
    colors: string[];
    explanation: string;
    lexicons: string[];
  }) => void;
  /** Remove a reflection by id (e.g. after delete). Also removes any reflection with the same imageUrl (handles client-id duplicates). */
  removeReflection: (id: string, imageUrl?: string) => void;
}

const RasaContext = createContext<RasaContextType | undefined>(undefined);

export function RasaProvider({ children }: { children: ReactNode }) {
  const [collectedItems, setCollectedItems] = useState<Set<string>>(new Set());
  const [reflections, setReflections] = useState<Reflection[]>([]);

  const addToCollection = (item: string) => {
    setCollectedItems((prev) => new Set([...prev, item]));
  };

  const isCollected = (item: string) => {
    return collectedItems.has(item);
  };

  const addReflection: RasaContextType["addReflection"] = (data) => {
    setReflections((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        ...data,
      },
      ...prev,
    ]);
  };

  const removeReflection: RasaContextType["removeReflection"] = (id, imageUrl) => {
    setReflections((prev) =>
      prev.filter(
        (r) => r.id !== id && (imageUrl == null || r.imageUrl !== imageUrl)
      )
    );
  };

  return (
    <RasaContext.Provider
      value={{ collectedItems, addToCollection, isCollected, reflections, addReflection, removeReflection }}
    >
      {children}
    </RasaContext.Provider>
  );
}

export function useRasa() {
  const context = useContext(RasaContext);
  if (context === undefined) {
    throw new Error("useRasa must be used within a RasaProvider");
  }
  return context;
}
