"use client";

import Link from "next/link";
import { MoveLeft, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="relative flex flex-col items-center gap-12 text-center max-w-md">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 -z-10 bg-primary/10 blur-[100px] rounded-full animate-pulse scale-150" />

        {/* Ghost Icon with Animation */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [-20, 0, -20] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110" />
          <Ghost className="h-28 w-28 text-primary relative z-10" />
        </motion.div>

        {/* Text Content */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-7xl font-black tracking-tighter text-foreground"
          >
            404
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3"
          >
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Lost in Transmission?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We couldn't find the frequency you're looking for. It might have
              been moved, deleted, or never existed in this dimension.
            </p>
          </motion.div>
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            asChild
            className="h-12 px-8 rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all group"
          >
            <Link href="/" className="flex items-center gap-2">
              <MoveLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Frequency</span>
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 py-4 opacity-30 select-none text-center">
        <p className="text-xs font-mono tracking-widest uppercase mb-1">
          Frequency Chat App // Terminal
        </p>
        <p className="text-[10px] opacity-70">SIGNAL LOST IN SECTOR 404</p>
      </div>
    </div>
  );
}
