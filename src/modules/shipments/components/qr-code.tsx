"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** QR em SVG gerado no navegador (o conteúdo assinado não sai para serviços externos). */
export function QrCode({ value, size = 160, label }: { value: string; size?: number; label: string }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let current = true;
    QRCode.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M" })
      .then((markup) => current && setSvg(markup))
      .catch(() => current && setSvg(""));
    return () => {
      current = false;
    };
  }, [value]);

  return (
    <div
      role="img"
      aria-label={label}
      data-qr={value}
      style={{ width: size, height: size }}
      className="[&>svg]:h-full [&>svg]:w-full"
      // SVG gerado localmente pela biblioteca qrcode a partir do texto da etiqueta.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
