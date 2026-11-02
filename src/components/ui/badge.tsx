type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, { badge: string; dot: string }> = {
  neutral: { badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  success: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  warning: { badge: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  danger: { badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
  info: { badge: "bg-brand-50 text-brand-700 ring-brand-200", dot: "bg-brand-500" },
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[tone].badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${toneClasses[tone].dot}`} aria-hidden />
      {children}
    </span>
  );
}
