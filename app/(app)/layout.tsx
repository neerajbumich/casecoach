import { requireUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";

// Everything in this group shows case content and requires an allow-listed user.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      {user.mode === "dev-open" && (
        <p className="bg-warn px-4 py-1 text-center text-xs font-semibold text-white">Local preview: sign-in is switched off (AUTH_DEV_BYPASS)</p>
      )}
      <AppNav />
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 md:px-6">
        {children}
      </main>
    </div>
  );
}
