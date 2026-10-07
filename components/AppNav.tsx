"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/library", label: "Library", icon: "M4 5h6v14H4zM14 5h6v14h-6z" },
  { href: "/learn", label: "Learn", icon: "M12 7v2M12 9H6v4M12 9h6v4M4 13h4v4H4zM16 13h4v4h-4zM10 3h4v4h-4z" },
  { href: "/practice", label: "Practice", icon: "M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3" },
  { href: "/progress", label: "Progress", icon: "M4 19V5M4 19h16M8 15l3-4 3 2 5-6" },
];

const GEAR = "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href) || (href === "/learn" && /^\/(frameworks|communication|industries|news|firms|us)(\/|$)/.test(pathname)) || (href === "/library" && pathname.startsWith("/case/")) || (href === "/progress" && /^\/(journal|sessions)/.test(pathname));
}

export function AppNav() {
  const pathname = usePathname();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="safe-top sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm font-bold text-accent-ink">C</span>
            CaseCoach
          </Link>
          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive(pathname, t.href) ? "page" : undefined}
                className="rounded-md px-3 py-1.5 text-sm text-ink-2 hover:bg-surface-2 aria-[current=page]:bg-surface-2 aria-[current=page]:font-semibold aria-[current=page]:text-ink"
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/settings"
            aria-label="Settings"
            aria-current={pathname.startsWith("/settings") ? "page" : undefined}
            className="ml-auto grid h-10 w-10 place-items-center rounded-md text-ink-2 hover:bg-surface-2 aria-[current=page]:bg-surface-2 aria-[current=page]:text-ink"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
              <path d={GEAR} />
            </svg>
          </Link>
        </div>
      </header>
      <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${active ? "font-semibold text-ink" : "text-muted"}`}
                >
                  <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinejoin="round" strokeLinecap="round">
                    <path d={t.icon} />
                  </svg>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
