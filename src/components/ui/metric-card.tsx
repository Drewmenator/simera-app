import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  change?: { value: string; positive: boolean };
  icon?: LucideIcon;
  accent?: "amber" | "green" | "red" | "blue" | "muted";
  className?: string;
}

const accentStyles = {
  amber: "text-amber-400",
  green: "text-emerald-400",
  red: "text-red-400",
  blue: "text-blue-400",
  muted: "text-muted-foreground",
};

export function MetricCard({
  label,
  value,
  subValue,
  change,
  icon: Icon,
  accent = "muted",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 space-y-1",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </p>
        {Icon && (
          <Icon className={cn("w-3.5 h-3.5", accentStyles[accent])} />
        )}
      </div>
      <p className={cn("text-2xl font-bold tabular-nums", accentStyles[accent])}>
        {value}
      </p>
      <div className="flex items-center gap-2">
        {subValue && (
          <p className="text-[11px] text-muted-foreground">{subValue}</p>
        )}
        {change && (
          <span
            className={cn(
              "text-[11px] font-medium",
              change.positive ? "text-emerald-400" : "text-red-400"
            )}
          >
            {change.positive ? "↑" : "↓"} {change.value}
          </span>
        )}
      </div>
    </div>
  );
}
