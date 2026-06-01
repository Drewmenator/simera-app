import { useState, useEffect } from "react";

const STORAGE_KEY = "simera_baa_accepted";

export function useBaa() {
  const [baaAccepted, setBaaAccepted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBaaAccepted(true);
    }
  }, []);

  const acceptBaa = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setBaaAccepted(true);
  };

  return { baaAccepted, acceptBaa };
}
