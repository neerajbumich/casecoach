import Link from "next/link";
import { listFrameworks } from "@/lib/frameworks";
import { MODULES } from "@/lib/communication";
import { listIndustries } from "@/lib/industries";
import { listFirms } from "@/lib/firms";
import { listChapters } from "@/lib/us";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  const sections = [
    { href: "/frameworks", title: "Frameworks", body: `${listFrameworks().length} ways to structure a case, each linked to the cases that use them, plus a coach for custom structures.` },
    { href: "/communication", title: "Communication", body: `${MODULES.length} moments where delivery wins or loses the case, with phrases to use and timed drills on real cases.` },
    { href: "/industries", title: "Industries", body: `${listIndustries().length} five-minute primers: economics, metrics, themes, typical cases and live news.` },
    { href: "/us", title: "US Playbook", body: `${listChapters().length} chapters on US consumers, business, healthcare and interview culture, plus the US numbers to know for sizing.` },
    { href: "/firms", title: "Firms", body: `${listFirms().length} firm profiles: interview process, what they look for, culture and angles for "why us".` },
    { href: "/news", title: "Recruiting radar", body: "WSJ, consulting and tech news ranked for consulting and tech recruiting, with why each story matters." },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="block h-full rounded-xl border border-line bg-surface p-4 hover:bg-surface-2">
              <span className="block text-lg font-semibold">{s.title}</span>
              <span className="mt-1 block text-sm text-ink-2">{s.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
