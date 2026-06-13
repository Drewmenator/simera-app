"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { uploadAuditAsync, pollAuditJob, type AuditResult } from "@/lib/api";
import { parse835File, type ParseResult } from "@/lib/parse-835";
import { ValidatorStep } from "./validator-step";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (result: AuditResult) => void;
}

type Step = "drop" | "validating" | "validated" | "uploading" | "processing" | "done" | "error";

// ── Sample 835 loader ─────────────────────────────────────────────────────────

async function loadSampleFile(): Promise<File> {
  const res = await fetch("/riverview-sample.835");
  if (!res.ok) throw new Error("Could not load sample file");
  const blob = await res.blob();
  return new File([blob], "riverview-sample.835", { type: "text/plain" });
}

// ── Main component ────────────────────────────────────────────────────────────

export function UploadModal({ open, onClose, onComplete }: UploadModalProps) {
  const { getToken } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [practiceName, setPracticeName] = useState("");
  const [step, setStep] = useState<Step>("drop");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [validationResult, setValidationResult] = useState<ParseResult | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      clearPoll();
      // Reset state when modal closes so next open is fresh
      setFiles([]);
      setPracticeName("");
      setStep("drop");
      setErrorMsg("");
      setValidationResult(null);
    }
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

  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      const file = await loadSampleFile();
      setFiles([file]);
      setPracticeName("Riverview Family Medicine");
    } catch {
      setErrorMsg("Could not load sample file. Please try uploading your own 835.");
      setStep("error");
    } finally {
      setLoadingSample(false);
    }
  };

  // Step 1: validate — runs the client-side 835 parser and shows results
  const handleSubmit = async () => {
    if (!files.length) return;
    // Skip validation for sample file — it's known-good
    const isSampleRun = files[0]?.name === "riverview-sample.835";
    if (isSampleRun) {
      await handleValidatedSubmit();
      return;
    }
    setStep("validating");
    try {
      // Validate the first file (primary file); multi-file uploads trust the first
      const result = await parse835File(files[0]);
      setValidationResult(result);
      setStep("validated");
    } catch {
      // Validation itself failed — still allow submit, just skip
      setStep("validated");
      setValidationResult(null);
    }
  };

  // Step 2: actually upload — called after user reviews validation results
  const handleValidatedSubmit = async () => {
    if (!files.length) return;
    setStep("uploading");
    setErrorMsg("");

    const isSampleRun = files[0]?.name === "riverview-sample.835";
    const name = practiceName || "Your Practice";

    let jobId: string;
    try {
      jobId = await uploadAuditAsync(
        files,
        isSampleRun ? `${name} (Sample)` : name,
        "primary_care",
        getToken
      );
    } catch (err: any) {
      setStep("error");
      setErrorMsg(err.message ?? "Upload failed");
      return;
    }

    setStep("processing");

    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    const MAX_POLL_ERRORS = 5;
    const MAX_POLL_DURATION_MS = totalBytes > 10 * 1024 * 1024
      ? 10 * 60 * 1000
      : 5  * 60 * 1000;
    const isLargeUpload = totalBytes > 5 * 1024 * 1024;
    const pollStart = Date.now();
    let pollErrors = 0;

    pollRef.current = setInterval(async () => {
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
        pollErrors = 0;
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
      } catch {
        pollErrors++;
        if (pollErrors >= MAX_POLL_ERRORS) {
          clearPoll();
          setStep("error");
          setErrorMsg("Lost connection to server. Please refresh and check your results.");
        }
      }
    }, 3000);
  };

  if (!open) return null;

  const isSampleLoaded = files.length === 1 && files[0].name === "riverview-sample.835";
  const isProcessing = step === "uploading" || step === "processing";

  // ── Validation screen ──────────────────────────────────────────────────────
  if (step === "validating") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Validating 835 file…</p>
              <p className="text-xs text-muted-foreground">Checking structure, segment counts, and dates</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-primary rounded-full animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  if (step === "validated" && validationResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">835 Validation Report</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Review before submitting for analysis</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ValidatorStep
            fileName={files[0]?.name ?? ""}
            result={validationResult}
            onProceed={handleValidatedSubmit}
            onBack={() => { setStep("drop"); setValidationResult(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">

        {/* Header */}
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

        {/* ── Sample CTA (shown when no files selected yet) ─────────────────── */}
        {files.length === 0 && step === "drop" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-800">See it in action first</p>
                <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                  Run a live audit on Riverview Family Medicine — a fictional practice with realistic denial patterns. No PHI, no account required beyond your login.
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingSample ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading sample…</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Load Riverview sample (synthetic — no PHI)</>
              )}
            </button>
          </div>
        )}

        {/* ── Sample loaded notice ───────────────────────────────────────────── */}
        {isSampleLoaded && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="text-xs text-emerald-700">
              <span className="font-semibold">Sample loaded — Riverview Family Medicine.</span> This is synthetic data with no real patient information. Results will look exactly like a real audit.
            </div>
          </div>
        )}

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

        {/* Drop zone (only when no sample loaded) */}
        {!isSampleLoaded && (
          <>
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
              <p className="text-sm font-medium text-foreground">Drop 835 ERA files here</p>
              <p className="text-xs text-muted-foreground mt-1">
                .835 · .edi · .txt · Multiple files OK (upload 3–6 months for best analysis)
              </p>
            </div>

            {/* Divider with "or" — shown only when no sample and no custom files yet */}
            {files.length === 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
          </>
        )}

        {/* File list — custom files or sample */}
        {files.length > 0 && (
          <div className="space-y-1.5">
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-secondary/40 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs text-foreground flex-1 truncate">{f.name}</span>
                  <span className={`text-[10px] ${f.size > 10 * 1024 * 1024 ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>
                    {f.size >= 1024 * 1024
                      ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${(f.size / 1024).toFixed(0)} KB`}
                  </span>
                  {!isProcessing && (
                    <button onClick={() => removeFile(i)}>
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {files.reduce((s, f) => s + f.size, 0) > 10 * 1024 * 1024 && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <span>⚠</span>
                <span>Large upload detected — analysis will take 1–3 minutes</span>
              </p>
            )}
          </div>
        )}

        {/* Status messages */}
        {step === "uploading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading {files.length} file{files.length > 1 ? "s" : ""}…
          </div>
        )}
        {step === "processing" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
              <span>{isSampleLoaded ? "Analyzing Riverview sample data…" : "Analyzing your 835 data…"}</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-teal-500 rounded-full animate-indeterminate" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isSampleLoaded ? "Sample audit takes ~15 seconds" : files.reduce((s, f) => s + f.size, 0) > 10 * 1024 * 1024
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
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* PHI acknowledgment — only shown when uploading real (non-sample) files */}
        {files.length > 0 && !isSampleLoaded && step === "drop" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Before uploading real patient data:</strong> Your 835 files contain PHI. Uploading requires an executed BAA with Simera and all subprocessors (Anthropic, AWS, Supabase, Vercel). Confirm your BAA is in place under <strong>Settings → Compliance</strong> before proceeding.
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!files.length || isProcessing || step === "done"}
          className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing
            ? "Analyzing…"
            : isSampleLoaded
            ? "Run Sample Audit →"
            : files.length > 0
            ? `Validate & Run Audit (${files.length} file${files.length > 1 ? "s" : ""})`
            : "Select a file to continue"}
        </button>

        <p className="text-[10px] text-muted-foreground text-center">
          Files are processed in memory and never stored on our servers.
          <br />
          HIPAA-compliant · End-to-end encrypted · BAA required for real patient data
        </p>
      </div>
    </div>
  );
}
