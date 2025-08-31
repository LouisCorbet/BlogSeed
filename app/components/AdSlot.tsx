/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/AdSlot.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  slot: string; // ex: "1234567890"
  className?: string;
  style?: React.CSSProperties; // pour réserver la hauteur (éviter le CLS)
  format?: "auto" | "fluid"; // "auto" par défaut ; "fluid" pour in-article
  responsive?: boolean; // true => data-full-width-responsive="true"
  // Optionnel : layoutKey pour "in-article" / "in-feed" (fourni par AdSense)
  layoutKey?: string; // ex: "-gw-3+1f-3d+2z"
};

const ADS_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export default function AdSlot({
  slot,
  className = "",
  style,
  format = "auto",
  responsive = true,
  layoutKey,
}: Props) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!window || !(window as any).adsbygoogle || !insRef.current) return;

    // Empêche le double push sur le même <ins/>
    try {
      (window as any).adsbygoogle.push({});
    } catch {
      // silencieux si bloqué par un adblock ou double push
    }
  }, [slot]);

  // Hauteur par défaut: bannière responsive (adapter si besoin)
  const defaultStyle: React.CSSProperties = style ?? {
    display: "block",
    minHeight: 250,
  };

  return (
    <ins
      ref={insRef as any}
      className={`adsbygoogle ${className}`}
      style={defaultStyle}
      data-ad-client={ADS_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
      {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
    />
  );
}
