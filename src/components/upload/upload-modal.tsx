"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { uploadAuditAsync, pollAuditJob, type AuditResult } from "@/lib/api";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (result: AuditResult) => void;
}

type Step = "drop" | "uploading" | "processing" | "done" | "error";

export function UploadModal({ open, onClose, onComplete }: UploadModalProps) {
  const { getToken } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [practiceName, setPracticeName] = useState("");
  const [step, setStep] = useState<Step>("drop");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Clean up on unmount or when modal closes
  useEffect(() => {
    if (!open) clearPoll();
    return clearPoll;
  }, [open]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".835") || f.name.endsWith(".edi") || f.name.endsWith(".txt")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!files.length) return;
    setStep("uploading");
    setErrorMsg("");

    let jobId: string;
    try {
      jobId = await uploadAuditAsync(files, practiceName || "Your Practice", "primary_care", getToken);
    } catch (err: any) {
      setStep("error");
      setErrorMsg(err.message ?? "Upload failed");
      return;
    }

    setStep("processing");

    // Large files need more processing time on the server.
    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    const MAX_POLL_ERRORS = 5;          // tolerate 5 transient errors before giving up
    const MAX_POLL_DURATION_MS = totalBytes > 10 * 1024 * 1024
      ? 10 * 60 * 1000   // 10 minutes for large files (>10 MB)
      : 5  * 60 * 1000;  // 5 minutes for small / medium files
    const isLargeUpload = totalBytes > 5 * 1024 * 1024;
    const pollStart = Date.now();
    let pollErrors = 0;

    pollRef.current = setInterval(async () => {
      // Absolute timeout — stop polling after dynamic window
      if (Date.now() - pollStart > MAX_POLL_DURATION_MS) {
        clearPoll();
        setStep("error");
        setErrorMsg(
          isLargeUpload
            ? "Large file analysis timed out. Try uploading fewer files at once or contact support."
            : "Analysis is taking longer than expected. Please try again."
        );
        return;
      }
      try {
        const job = await pollAuditJob(jobId, getToken);
        pollErrors = 0; // reset on success
        if (job.status === "complete" && job.result) {
          clearPoll();
          setStep("done");
          setTimeout(() => {
            onComplete(job.result!);
            onClose();
          }, 1200);
        } else if (job.status === "error") {
          clearPoll();
          setStep("error");
          setErrorMsg(job.message ?? "Audit processing failed");
        }
        // status === "processing" → keep polling
      } catch {
        pollErrors++;
        if (pollErrors >= MAX_POLL_ERRORS) {
          clearPoll();
          setStep("error");
          setErrorMsg("Lost connection to server. Please refresh and check your results.");
        }
        // otherwise swallow the error and keep polling
      }
    }, 3000); // poll every 3s for large files
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Upload 835 ERA Files</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              We&apos;ll find every dollar you&apos;re leaving on the table.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Practice name */}
        <div>
          <label className="text-xs font-medium text-foreground block mb-1.5">
            Practice Name
          </label>
          <input
            type="text"
            value={practiceName}
            onChange={(e) => setPracticeName(e.target.value)}
            placeholder="e.g. Riverview Family Medicine"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/30"
          }`}
        >
          <input
            type="file"
            multiple
            accept=".835,.edi,.txt"
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">
            Drop 835 ERA files here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            .835 · .edi · .txt · Multiple files OK (upload 3–6 months for best analysis)
          </p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-1.5">
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary/40 rounded-lg"
                >
                  <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs text-foreground flex-1 truncate">{f.name}</span>
                  <span className={`text-[10px] ${f.size > 10 * 1024 * 1024 ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>
                    {f.size >= 1024 * 1024
                      ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${(f.size / 1024).toFixed(0)} KB`}
                  </span>
                  <button onClick={() => removeFile(i)}>
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
            </div>
            {/* Size advisory for large uploads */}
            {files.reduce((s, f) => s + f.size, 0) > 10 * 1024 * 1024 && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <span>⚠</span>
                <span>Large upload detected — analysis will take 1–3 minutes</span>
              </p>
            )}
          </div>
        )}

        {/* Status */}
        {step === "uploading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading {files.length} file{files.length > 1 ? "s" : ""}...
          </div>
        )}
        {step === "processing" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
              <span>Analyzing your 835 data…</span>
            </div>
            {/* Indeterminate teal progress bar */}
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-teal-500 rounded-full animate-indeterminate" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {files.reduce((s, f) => s + f.size, 0) > 10 * 1024 * 1024
                ? "Large file detected — analysis may take 1–3 minutes"
                : files.reduce((s, f) => s + f.size, 0) > 2 * 1024 * 1024
                ? "This takes 30–90 seconds for this file size"
                : "This takes 15–30 seconds for most files"}
            </p>
          </div>
        )}
        {step === "done" && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle className="w-4 h-4" />
            Audit complete — loading your report
          </div>
        )}
        {step === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!files.length || step === "uploading" || step === "processing" || step === "done"}
          className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {step === "uploading" || step === "processing"
            ? "Analyzing..."
            : `Run Audit${files.length ? ` (${files.length} file${files.length > 1 ? "s" : ""})` : ""}`}
        </button>

        <p className="text-[10px] text-muted-foreground text-center">
          Files are processed in memory and never stored on our servers.
          <br />
          HIPAA-compliant · End-to-end encrypted
        </p>
      </div>
    </div>
  );
}
