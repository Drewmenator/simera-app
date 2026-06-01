export function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function deadlineLabel(days: number): string {
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${new Date(Date.now() + days * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function deadlineColor(days: number): string {
  if (days < 0) return "#c2553d";
  if (days <= 3) return "#c2553d";
  if (days <= 7) return "#bd852f";
  if (days <= 14) return "#bd852f";
  return "#5c747e";
}

export function deadlineBg(days: number): string {
  if (days <= 3) return "#f8e8e3";
  if (days <= 7) return "#f8efdd";
  if (days <= 14) return "#f8efdd";
  return "#f6f8f8";
}
