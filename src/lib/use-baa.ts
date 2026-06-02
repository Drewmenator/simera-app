"use client";

import { useState, useEffect } from "react";
import { getBaaStatus } from "@/lib/api";

const STORAGE_KEY = "simera_baa_accepted";

export function useBaa() {
  const [baaAccepted, setBaaAccepted] = useState(false);

  useEffect(() => {
    // Fast local check first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBaaAccepted(true);
      return;
    }
    // Then verify against API (catches cross-device acceptance)
    getBaaStatus()
      .then(({ has_baa }) => {
        if (has_baa) {
          localStorage.setItem(STORAGE_KEY, new Date().toISOString());
          setBaaAccepted(true);
        }
      })
      .catch(() => {
        // Fail silently — localStorage is the fallback
      });
  }, []);

  const acceptBaa = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setBaaAccepted(true);
  };

  return { baaAccepted, acceptBaa };
}
