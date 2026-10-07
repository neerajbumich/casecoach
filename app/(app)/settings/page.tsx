import { getUser } from "@/lib/auth";
import { getCase, getIndex } from "@/lib/cases";
import { Settings } from "@/components/Settings";
import { llmEnabled, monthlyCapUsd } from "@/lib/llm-config";
import { getStore } from "@/lib/store";
import { partnerEmails } from "@/lib/auth-config";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getUser();
  const index = getIndex();
  const urls = ["/", "/library", ...index.map((c) => `/case/${c.id}`)];
  const images = index.flatMap((c) => (getCase(c.id)?.exhibits ?? []).filter((e) => e.image_path).map((e) => `/api/${e.image_path}`));
  const ai = llmEnabled() ? { on: true, spent: await getStore().llmSpendThisMonth().catch(() => 0), cap: monthlyCapUsd() } : { on: false, spent: 0, cap: 0 };
  return <Settings email={user?.email ?? ""} pages={[...urls, "/practice", "/journal", "/sessions", "/progress", "/learn", "/frameworks", "/communication", "/industries", "/firms", "/practice/math", "/practice/cards", "/practice/sizing", "/practice/fit"]} images={[...new Set(images)]} caseCount={index.length} ai={ai} role={user?.role ?? "owner"} partners={partnerEmails()} />;
}
