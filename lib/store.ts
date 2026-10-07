import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { authMode } from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/server";
import type { MistakeRecord, Scorecard, SessionRecord, FirmMode } from "@/lib/scoring";

// Persistence for Phase 3. Supabase (with RLS) when sign-in is configured;
// a JSON file under .data/ for local preview only (AUTH_DEV_BYPASS, never on Vercel).

export type NewSession = {
  case_id: string;
  case_title: string;
  firm_mode: FirmMode;
  source: "claude-handoff" | "in-app" | "partner";
  started_at?: string;
  duration_min?: number | null;
  hints_used?: number;
  scorecard: Scorecard;
  transcript?: string | null;
  notes?: string | null;
};

export interface Store {
  listSessions(): Promise<SessionRecord[]>;
  getSession(id: string): Promise<SessionRecord | null>;
  saveSession(s: NewSession): Promise<SessionRecord>;
  deleteSession(id: string): Promise<void>;
  listMistakes(): Promise<MistakeRecord[]>;
  getProgress(): Promise<Record<string, string>>; // case_id -> updated_at (solved)
  setProgress(caseId: string, solved: boolean): Promise<void>;
  llmSpendThisMonth(): Promise<number>;
  recordLlmUsage(u: { model: string; input_tokens: number; output_tokens: number; cost_usd: number }): Promise<void>;
  // Phase 7
  listItems<T = unknown>(kind: ItemKind): Promise<Item<T>[]>;
  putItem(kind: ItemKind, key: string, data: unknown): Promise<void>;
  deleteItem(kind: ItemKind, key: string): Promise<void>;
  listFeedback(me: string): Promise<{ received: Feedback[]; given: Feedback[] }>;
  giveFeedback(f: NewFeedback): Promise<Feedback>;
  markFeedbackImported(id: string, me: string): Promise<Feedback | null>;
}

export const ITEM_KINDS = ["drill", "srs", "story"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];
export type Item<T = unknown> = { key: string; data: T; updated_at: string };

export type NewFeedback = {
  author_email: string;
  candidate_email: string;
  case_id: string;
  case_title: string;
  firm_mode: FirmMode;
  duration_min: number | null;
  scorecard: Scorecard;
};
export type Feedback = NewFeedback & { id: string; imported: boolean; created_at: string };

function toSession(n: NewSession, id: string): SessionRecord {
  const card = n.scorecard;
  return {
    id,
    case_id: n.case_id,
    case_title: n.case_title,
    firm_mode: n.firm_mode,
    source: n.source,
    started_at: n.started_at ?? new Date().toISOString(),
    duration_min: n.duration_min ?? card.duration_minutes ?? null,
    hints_used: n.hints_used ?? card.hints_used ?? 0,
    overall: card.overall ?? null,
    scores: Object.fromEntries(Object.entries(card.scores).map(([k, v]) => [k, v.score])),
    scorecard: card,
    transcript: n.transcript ?? null,
    notes: n.notes ?? null,
  };
}

const monthStart = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
};

// ── Supabase backend ───────────────────────────────────────────────────────────
class SupabaseStore implements Store {
  private async db() {
    return createClient();
  }
  async listSessions() {
    const { data, error } = await (await this.db()).from("sessions").select("*").order("started_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as SessionRecord[];
  }
  async getSession(id: string) {
    const { data } = await (await this.db()).from("sessions").select("*").eq("id", id).maybeSingle();
    return (data as SessionRecord) ?? null;
  }
  async saveSession(n: NewSession) {
    const db = await this.db();
    const rec = toSession(n, randomUUID());
    const { error } = await db.from("sessions").insert({ ...rec });
    if (error) throw new Error(error.message);
    if (rec.scorecard.mistakes.length) {
      const { error: e2 } = await db.from("mistakes").insert(
        rec.scorecard.mistakes.map((m) => ({ session_id: rec.id, case_id: rec.case_id, category: m.category, description: m.description, quote: m.quote ?? null })),
      );
      if (e2) throw new Error(e2.message);
    }
    await this.setProgress(rec.case_id, true);
    return rec;
  }
  async deleteSession(id: string) {
    await (await this.db()).from("sessions").delete().eq("id", id);
  }
  async listMistakes() {
    const { data, error } = await (await this.db()).from("mistakes").select("*").order("created_at", { ascending: false }).limit(2000);
    if (error) throw new Error(error.message);
    return (data ?? []) as MistakeRecord[];
  }
  async getProgress() {
    const { data } = await (await this.db()).from("case_progress").select("case_id, solved, updated_at");
    return Object.fromEntries((data ?? []).filter((r) => r.solved).map((r) => [r.case_id, r.updated_at]));
  }
  async setProgress(caseId: string, solved: boolean) {
    const db = await this.db();
    if (solved) await db.from("case_progress").upsert({ case_id: caseId, solved: true, updated_at: new Date().toISOString() });
    else await db.from("case_progress").delete().eq("case_id", caseId);
  }
  async llmSpendThisMonth() {
    const { data } = await (await this.db()).from("llm_usage").select("cost_usd").gte("created_at", monthStart());
    return (data ?? []).reduce((s, r) => s + Number(r.cost_usd), 0);
  }
  async recordLlmUsage(u: { model: string; input_tokens: number; output_tokens: number; cost_usd: number }) {
    await (await this.db()).from("llm_usage").insert(u);
  }
  async listItems<T>(kind: ItemKind) {
    const { data, error } = await (await this.db()).from("user_items").select("key, data, updated_at").eq("kind", kind).order("updated_at", { ascending: false }).limit(5000);
    if (error) throw new Error(error.message);
    return (data ?? []) as Item<T>[];
  }
  async putItem(kind: ItemKind, key: string, data: unknown) {
    const { error } = await (await this.db()).from("user_items").upsert({ kind, key, data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  }
  async deleteItem(kind: ItemKind, key: string) {
    await (await this.db()).from("user_items").delete().eq("kind", kind).eq("key", key);
  }
  async listFeedback(me: string) {
    // RLS returns only rows I wrote or rows addressed to me.
    const { data, error } = await (await this.db()).from("partner_feedback").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Feedback[];
    return { received: rows.filter((r) => r.candidate_email.toLowerCase() === me), given: rows.filter((r) => r.author_email.toLowerCase() === me) };
  }
  async giveFeedback(f: NewFeedback) {
    const { data, error } = await (await this.db()).from("partner_feedback").insert(f).select("*").single();
    if (error) throw new Error(error.message);
    return data as Feedback;
  }
  async markFeedbackImported(id: string, me: string) {
    const db = await this.db();
    const { data } = await db.from("partner_feedback").select("*").eq("id", id).maybeSingle();
    const row = data as Feedback | null;
    if (!row || row.candidate_email.toLowerCase() !== me || row.imported) return null;
    const { error } = await db.from("partner_feedback").update({ imported: true }).eq("id", id);
    if (error) throw new Error(error.message);
    return row;
  }
}

// ── Local file backend (preview only) ────────────────────────────────────────────
type FileData = { sessions: SessionRecord[]; mistakes: MistakeRecord[]; progress: Record<string, string>; usage: { at: string; cost_usd: number }[]; items?: Record<string, Item[]>; feedback?: Feedback[] };
const FILE = join(process.cwd(), ".data", "store.json");

class FileStore implements Store {
  private async read(): Promise<FileData> {
    try {
      return JSON.parse(await readFile(FILE, "utf8"));
    } catch {
      return { sessions: [], mistakes: [], progress: {}, usage: [] };
    }
  }
  private async write(d: FileData) {
    await mkdir(join(process.cwd(), ".data"), { recursive: true });
    await writeFile(FILE, JSON.stringify(d, null, 1));
  }
  async listSessions() {
    return (await this.read()).sessions.sort((a, b) => b.started_at.localeCompare(a.started_at));
  }
  async getSession(id: string) {
    return (await this.read()).sessions.find((s) => s.id === id) ?? null;
  }
  async saveSession(n: NewSession) {
    const d = await this.read();
    const rec = toSession(n, randomUUID());
    d.sessions.push(rec);
    for (const m of rec.scorecard.mistakes) {
      d.mistakes.push({ id: randomUUID(), session_id: rec.id, case_id: rec.case_id, category: m.category, description: m.description, quote: m.quote ?? null, created_at: rec.started_at });
    }
    d.progress[rec.case_id] = new Date().toISOString();
    await this.write(d);
    return rec;
  }
  async deleteSession(id: string) {
    const d = await this.read();
    d.sessions = d.sessions.filter((s) => s.id !== id);
    d.mistakes = d.mistakes.filter((m) => m.session_id !== id);
    await this.write(d);
  }
  async listMistakes() {
    return (await this.read()).mistakes;
  }
  async getProgress() {
    return (await this.read()).progress;
  }
  async setProgress(caseId: string, solved: boolean) {
    const d = await this.read();
    if (solved) d.progress[caseId] = new Date().toISOString();
    else delete d.progress[caseId];
    await this.write(d);
  }
  async llmSpendThisMonth() {
    const ms = monthStart();
    return (await this.read()).usage.filter((u) => u.at >= ms).reduce((s, u) => s + u.cost_usd, 0);
  }
  async recordLlmUsage(u: { cost_usd: number }) {
    const d = await this.read();
    d.usage.push({ at: new Date().toISOString(), cost_usd: u.cost_usd });
    await this.write(d);
  }
  async listItems<T>(kind: ItemKind) {
    const d = await this.read();
    return [...(d.items?.[kind] ?? [])].sort((a, b) => b.updated_at.localeCompare(a.updated_at)) as Item<T>[];
  }
  async putItem(kind: ItemKind, key: string, data: unknown) {
    const d = await this.read();
    d.items ??= {};
    const list = (d.items[kind] ?? []).filter((i) => i.key !== key);
    list.push({ key, data, updated_at: new Date().toISOString() });
    d.items[kind] = list;
    await this.write(d);
  }
  async deleteItem(kind: ItemKind, key: string) {
    const d = await this.read();
    if (d.items?.[kind]) d.items[kind] = d.items[kind].filter((i) => i.key !== key);
    await this.write(d);
  }
  async listFeedback(me: string) {
    const rows = [...((await this.read()).feedback ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { received: rows.filter((r) => r.candidate_email.toLowerCase() === me), given: rows.filter((r) => r.author_email.toLowerCase() === me) };
  }
  async giveFeedback(f: NewFeedback) {
    const d = await this.read();
    const row: Feedback = { ...f, id: randomUUID(), imported: false, created_at: new Date().toISOString() };
    (d.feedback ??= []).push(row);
    await this.write(d);
    return row;
  }
  async markFeedbackImported(id: string, me: string) {
    const d = await this.read();
    const row = d.feedback?.find((r) => r.id === id);
    if (!row || row.candidate_email.toLowerCase() !== me || row.imported) return null;
    row.imported = true;
    await this.write(d);
    return { ...row, imported: false };
  }
}

export function getStore(): Store {
  const mode = authMode();
  if (mode === "supabase") return new SupabaseStore();
  if (mode === "dev-open") return new FileStore();
  throw new Error("Storage unavailable: sign-in is not configured");
}
