"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const links = [
  { href: "/today", label: "Today" },
  { href: "/tomorrow", label: "Tomorrow" },
  { href: "/yesterday", label: "Yesterday" },
  { href: "/tracker", label: "Bet Tracker" },
  { href: "/history", label: "History" },
];

const NAV_STYLE = {
  background: "#0d1220",
  borderBottom: "1px solid var(--border)",
  padding: "0 24px",
  display: "flex",
  alignItems: "center",
  height: "56px",
  position: "sticky" as const,
  top: 0,
  zIndex: 50,
};

export default function Nav() {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  const brand = (
    <span
      style={{
        color: "var(--text-primary)",
        fontWeight: 700,
        fontSize: "15px",
        letterSpacing: "-0.02em",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: "18px" }}>🏀</span>
      WNBA Model
    </span>
  );

  if (isMobile) {
    return (
      <nav style={{ ...NAV_STYLE, justifyContent: "space-between" }}>
        {brand}
        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: "22px",
            lineHeight: 1,
            padding: 0,
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isOpen ? "✕" : "☰"}
        </button>

        {isOpen && (
          <>
            <div
              onClick={() => setIsOpen(false)}
              style={{
                position: "fixed",
                inset: "56px 0 0 0",
                zIndex: 48,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: "56px",
                left: 0,
                right: 0,
                background: "#0d1220",
                borderBottom: "1px solid var(--border)",
                zIndex: 49,
                paddingBottom: "8px",
              }}
            >
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: "block",
                      padding: "14px 24px",
                      color: active
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                      fontWeight: active ? 600 : 400,
                      fontSize: "15px",
                      textDecoration: "none",
                      borderLeft: active
                        ? "3px solid var(--accent)"
                        : "3px solid transparent",
                      background: active
                        ? "rgba(59,130,246,0.06)"
                        : "transparent",
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>
    );
  }

  return (
    <nav style={{ ...NAV_STYLE, gap: "8px" }}>
      <span
        style={{
          color: "var(--text-primary)",
          fontWeight: 700,
          fontSize: "15px",
          letterSpacing: "-0.02em",
          marginRight: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "18px" }}>🏀</span>
        WNBA Model
      </span>

      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
              background: active ? "var(--bg-card)" : "transparent",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "13px",
              fontWeight: active ? 600 : 400,
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
