"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { occurrenceTypeLabels, type CustomsChannel, type OccurrenceType } from "@/domain/clearance";
import { channelLabels, clearanceStatusLabels, manifestCustomsLabels, type ClearanceStatus } from "@/domain/status-labels";
import { occurrencePhoto, type TerminalVoyage } from "@/services/api/arrivals";

export function ManifestCustomsBadge({ manifest }: { manifest: Pick<NonNullable<TerminalVoyage["manifest"]>, "version" | "customsStatus"> | null }) {
  if (!manifest) return <Badge tone="danger">Sem manifesto enviado</Badge>;
  const tone = manifest.customsStatus === "validated" ? "success" : manifest.customsStatus === "rejected" ? "danger" : "warning";
  return (
    <Badge tone={tone}>
      Manifesto v{manifest.version} · {manifestCustomsLabels[manifest.customsStatus]}
    </Badge>
  );
}

export function OccurrenceBadge({ type }: { type: OccurrenceType }) {
  return <Badge tone={type === "excess" ? "info" : "danger"}>{occurrenceTypeLabels[type]}</Badge>;
}

export function ChannelBadge({ channel }: { channel: CustomsChannel | null }) {
  if (!channel) return <Badge>Sem canal</Badge>;
  return <Badge tone={channel === "green" ? "success" : "danger"}>{channelLabels[channel]}</Badge>;
}

export function ClearanceStatusBadge({ status }: { status: ClearanceStatus }) {
  const tone = status === "released" ? "success" : status === "held" ? "danger" : "warning";
  return <Badge tone={tone}>{clearanceStatusLabels[status]}</Badge>;
}

/** Fotografia protegida: descarregada com o token e mostrada a partir de um blob local. */
export function OccurrencePhoto({ occurrenceId, photoId }: { occurrenceId: string; photoId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    occurrencePhoto(occurrenceId, photoId)
      .then(({ blob }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [occurrenceId, photoId]);

  if (!url) return <div className="h-20 w-20 animate-pulse rounded-lg bg-slate-100" />;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element -- blob local, não passa pelo otimizador de imagens */}
      <img src={url} alt="Fotografia da ocorrência" className="h-20 w-20 rounded-lg border border-slate-200 object-cover" />
    </a>
  );
}

/** Assinatura desenhada no ecrã (rato, dedo ou caneta), devolvida como PNG. */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width,
      y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height,
    };
  };

  const clear = () => {
    const context = canvas.current?.getContext("2d");
    if (!context || !canvas.current) return;
    context.clearRect(0, 0, canvas.current.width, canvas.current.height);
    setEmpty(true);
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvas}
        width={600}
        height={180}
        aria-label="Área de assinatura"
        className="h-36 w-full touch-none rounded-lg border border-dashed border-slate-300 bg-white"
        onPointerDown={(event) => {
          const context = event.currentTarget.getContext("2d");
          if (!context) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drawing.current = true;
          const { x, y } = point(event);
          context.lineWidth = 2.5;
          context.lineCap = "round";
          context.strokeStyle = "#0f172a";
          context.beginPath();
          context.moveTo(x, y);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const context = event.currentTarget.getContext("2d");
          const { x, y } = point(event);
          context?.lineTo(x, y);
          context?.stroke();
        }}
        onPointerUp={(event) => {
          if (!drawing.current) return;
          drawing.current = false;
          setEmpty(false);
          onChange(event.currentTarget.toDataURL("image/png"));
        }}
      />
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>{empty ? "Assine dentro do retângulo." : "Assinatura registada."}</span>
        <Button type="button" size="sm" variant="ghost" onClick={clear}>
          <Eraser className="h-3.5 w-3.5" aria-hidden /> Limpar
        </Button>
      </div>
    </div>
  );
}
