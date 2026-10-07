"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Two-tap delete (no browser confirm dialog).
export function DeleteSession({ id }: { id: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  return (
    <button
      onClick={async () => {
        if (!armed) return setArmed(true);
        await fetch(`/api/sessions/${id}`, { method: "DELETE" });
        router.push("/sessions");
        router.refresh();
      }}
      onBlur={() => setArmed(false)}
      className={`ml-auto rounded-lg px-4 py-2 text-sm ${armed ? "bg-warn text-white" : "border border-line text-muted"}`}
    >
      {armed ? "Tap again to delete" : "Delete session"}
    </button>
  );
}
