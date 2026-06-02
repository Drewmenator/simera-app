"use client";

import { useEffect, useRef, useCallback } from "react";
import { useClerk } from "@clerk/nextjs";

const IDLE_MS = 15 * 60 * 1000; // 15 minutes — HIPAA session timeout

/**
 * Signs the user out after 15 minutes of inactivity.
 * Resets on any mouse, keyboard, or touch event.
 * Wire this into any layout that renders PHI.
 */
export function useIdleTimeout() {
  const { signOut } = useClerk();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      signOut({ redirectUrl: "/sign-in?reason=idle" });
    }, IDLE_MS);
  }, [signOut]);

  useEffect(() => {
    const events: string[] = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "wheel"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset(); // start on mount
    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [reset]);
}
