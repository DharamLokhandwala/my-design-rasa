"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-[#181818]"
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="rounded-full border-2 border-neutral-600 border-t-white/80 p-4"
        >
          <Loader2 size={40} className="text-white/90" strokeWidth={2} />
        </motion.div>
        <div className="flex flex-col items-center gap-2 text-center">
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-lg font-medium text-white"
          >
            Analyzing your image with AI…
          </motion.p>
          <p className="text-sm text-neutral-400">
            Finding taste lexicons — this may take a few seconds
          </p>
        </div>
        <motion.div
          className="flex gap-1.5"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2,
                repeat: Infinity,
                repeatDelay: 0.3,
              },
            },
            hidden: {},
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { scale: 0.8, opacity: 0.4 },
                visible: { scale: 1, opacity: 1 },
              }}
              transition={{ duration: 0.4 }}
              className="h-2 w-2 rounded-full bg-neutral-500"
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
