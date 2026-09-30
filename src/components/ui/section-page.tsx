"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

interface SectionPageProps {
  title: string;
  description: string;
  items: Array<{ label: string; value: string; tone?: "neutral" | "success" | "warning" }>; 
}

export function SectionPage({ title, description, items }: SectionPageProps) {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label} title={item.label}>
            <p
              className={`text-3xl font-semibold ${
                item.tone === "success"
                  ? "text-emerald-600"
                  : item.tone === "warning"
                    ? "text-amber-600"
                    : "text-slate-900"
              }`}
            >
              {item.value}
            </p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
