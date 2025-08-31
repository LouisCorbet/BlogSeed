"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pageview } from "@/lib/gtag";

export default function GAReporter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ne pas tracer l’admin
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!pathname || isAdmin) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
    pageview(url);
  }, [pathname, searchParams, isAdmin]);

  return null;
}
