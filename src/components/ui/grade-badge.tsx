import { cn } from "@/lib/utils";

const gradeConfig: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  B: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  C: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  D: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  F: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
};

export function GradeBadge({ grade, size = "md" }: { grade: string; size?: "sm" | "md" | "lg" }) {
  const config = gradeConfig[grade] ?? gradeConfig["C"];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold border rounded",
        config.bg,
        config.text,
        config.border,
        size === "sm" && "text-xs w-5 h-5",
        size === "md" && "text-sm w-7 h-7",
        size === "lg" && "text-2xl w-12 h-12 rounded-lg",
      )}
    >
      {grade}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: "critical" | "high" | "medium" | "low" }) {
  const colors = {
    critical: "bg-red-400",
    high: "bg-orange-400",
    medium: "bg-amber-400",
    low: "bg-emerald-400",
  };
  return <span className={cn("inline-block w-2 h-2 rounded-full flex-shrink-0", colors[severity])} />;
}
