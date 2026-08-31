"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function sessionId() {
  const key = "pv_session";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  sessionStorage.setItem(key, created);
  return created;
}

function send(event: string, label?: string) {
  const params = new URLSearchParams(window.location.search);
  const utm = Object.fromEntries(
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"]
      .map((key) => [key, params.get(key)] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      event,
      label,
      path: window.location.pathname,
      session: sessionId(),
      campaign: params.get("utm_campaign") ?? undefined,
      utm,
    }),
  });
}

function isPublicFunnel(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/modelos" ||
    pathname.startsWith("/modelos/") ||
    pathname === "/criar" ||
    pathname.startsWith("/pagamento/")
  );
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (isPublicFunnel(pathname)) send("page_view");
  }, [pathname]);

  useEffect(() => {
    const trackClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const tracked = target?.closest<HTMLElement>("[data-analytics]");
      const analyticsEvent = tracked?.dataset.analytics;
      if (analyticsEvent && isPublicFunnel(window.location.pathname)) {
        send(analyticsEvent, tracked.dataset.analyticsLabel);
      }
    };
    document.addEventListener("click", trackClick);
    return () => document.removeEventListener("click", trackClick);
  }, []);

  return null;
}
