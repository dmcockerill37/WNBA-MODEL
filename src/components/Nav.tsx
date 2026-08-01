"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/today", label: "Today" },
  { href: "/tomorrow", label: "Tomorrow" },
  { href: "/yesterday", label: "Yesterday" },
  { href: "/tracker", label: "Bet Tracker" },
  { href: "/history", label: "History" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "#0d1220",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        height: "56px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
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
        const active = pathname === link.href || pathname.startsWith(link.href + "/");
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
