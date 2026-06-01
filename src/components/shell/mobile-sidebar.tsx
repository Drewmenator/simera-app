"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  onUploadClick?: () => void;
}

export function MobileSidebar({ open, onClose, onUploadClick }: MobileSidebarProps) {
  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-56 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-md bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <Sidebar
          onUploadClick={() => {
            onClose();
            onUploadClick?.();
          }}
        />
      </div>
    </div>
  );
}
