/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Props = { privacyUrl?: string };

export default function ConsentBannerHybrid({
  privacyUrl = "/privacy",
}: Props) {
  const [shown, setShown] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem("consent");
    if (!v) setShown(true);
  }, []);

  // Réserver de la place en bas pour ne pas masquer le contenu
  useEffect(() => {
    if (!shown) return;
    const el = barRef.current;
    const applyPad = () => {
      const h = el?.offsetHeight ?? 0;
      document.body.style.paddingBottom = `${h}px`;
    };
    applyPad();
    window.addEventListener("resize", applyPad);
    return () => {
      window.removeEventListener("resize", applyPad);
      document.body.style.paddingBottom = "";
    };
  }, [shown]);

  const grant = () => {
    (window as any).gtag?.("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
    localStorage.setItem("consent", "granted");
    setShown(false);
  };

  const deny = () => {
    (window as any).gtag?.("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    localStorage.setItem("consent", "denied");
    setShown(false);
  };

  if (!shown) return null;

  // --- Disposition (CSS pur) ---
  const wrap: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    // marge intérieure générale + respect du safe-area iOS
    padding: "16px",
    paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
  };

  const card: React.CSSProperties = {
    maxWidth: "72rem", // ≈ 1152px pour mieux “respirer”
    margin: "0 auto",
    // padding interne généreux
    padding: "18px 20px",
    // layout
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "center",
    justifyContent: "space-between",
    // look & feel
    background: "var(--b1, #fff)",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  };

  const textBox: React.CSSProperties = {
    flex: "1 1 420px",
    minWidth: 0,
  };

  const actions: React.CSSProperties = {
    display: "flex",
    gap: 10,
    flex: "0 0 auto",
  };

  return (
    <div
      data-nosnippet
      role="region"
      aria-label="Bannière de consentement"
      style={wrap}
      ref={barRef}
    >
      <div
        className="bg-base-100 border border-base-300 rounded-box shadow-lg"
        style={card}
      >
        <p
          className="m-0 text-[0.95rem] leading-relaxed text-base-content/80"
          style={textBox}
        >
          Nous utilisons des cookies pour mesurer l’audience et afficher des
          annonces personnalisées. Vous pouvez accepter ou refuser.{" "}
          {/* <Link
            href={privacyUrl}
            className="link link-hover font-medium"
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
          >
            En savoir plus
          </Link>
          . */}
        </p>

        <div style={actions}>
          <button type="button" className="btn btn-sm btn-ghost">
            <span onClick={deny}>Tout refuser</span>
          </button>
          <button
            type="button"
            onClick={grant}
            className="btn btn-sm btn-primary"
            // un peu plus d’air vertical sur mobile
            style={{ paddingInline: 16, paddingBlock: 10 }}
            autoFocus
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
