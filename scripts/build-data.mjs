// Builds the library bundle from data/cases/*.json (one file per extracted case).
// Output: data/library.json (full records, server-only) and data/library-index.json (light, for lists/charts).
// Run automatically by `npm run dev` / `npm run build`. Add new cases by dropping JSON files into data/cases/.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "data", "cases");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const cases = [];
const problems = [];

for (const f of files) {
  let c;
  try {
    c = JSON.parse(readFileSync(join(dir, f), "utf8"));
  } catch (e) {
    problems.push(`${f}: invalid JSON (${e.message})`);
    continue;
  }
  for (const k of ["id", "title", "school", "prompt", "case_type", "industry", "stages"]) {
    if (c[k] == null) problems.push(`${f}: missing ${k}`);
  }
  c.variant_group_id ??= c.id;
  c.is_canonical_variant ??= true;
  for (const e of c.exhibits ?? []) {
    if (e.image_path && !existsSync(join(process.cwd(), "private", e.image_path))) {
      problems.push(`${f}: exhibit image not found (${e.image_path})`);
      delete e.image_path;
    }
  }
  cases.push(c);
}

const ids = new Set();
for (const c of cases) {
  if (ids.has(c.id)) problems.push(`duplicate id ${c.id}`);
  ids.add(c.id);
}

const index = cases.map((c) => ({
  id: c.id,
  title: c.title,
  school: c.school,
  edition: c.edition,
  year: c.year,
  case_type: c.case_type,
  industry: c.industry,
  sub_industry: c.sub_industry ?? null,
  format: c.format,
  difficulty: c.difficulty,
  difficulty_inferred: c.difficulty_inferred,
  quant_intensity: c.quant_intensity,
  estimated_minutes: c.estimated_minutes,
  tags: c.tags ?? [],
  exhibits: (c.exhibits ?? []).length,
  math: (c.math ?? []).length,
  confidence: c.extraction?.confidence ?? "medium",
  teaser: c.prompt.replace(/\s+/g, " ").slice(0, 180),
  firm: (c.firm_style_hint ?? []).join(", "),
}));

writeFileSync(join(process.cwd(), "data", "library.json"), JSON.stringify(cases));
writeFileSync(join(process.cwd(), "data", "library-index.json"), JSON.stringify(index));

// ── Frameworks (Phase 4): bundle data/frameworks/*.json and link cases to frameworks ──────────
const fwDir = join(process.cwd(), "data", "frameworks");
const frameworks = existsSync(fwDir)
  ? readdirSync(fwDir).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(join(fwDir, f), "utf8")))
  : [];
const labelsOf = (n) => [n.label, ...(n.children ?? []).flatMap(labelsOf)];
const byCase = {};
const byFramework = Object.fromEntries(frameworks.map((f) => [f.id, []]));
for (const c of cases) {
  const tags = new Set(c.tags ?? []);
  const text = labelsOf(c.suggested_framework?.tree ?? { label: "" }).join(" ").toLowerCase();
  const scored = frameworks
    .map((f) => {
      let s = 0;
      const ct = f.match?.case_types ?? [];
      if (ct.includes(c.case_type[0])) s += 5;
      s += c.case_type.slice(1).filter((t) => ct.includes(t)).length * 3;
      s += (f.match?.tags ?? []).filter((t) => tags.has(t)).length * 2;
      // Tools (Five Forces, 3Cs…) rarely match a case type, so their structural keywords count more.
      const kw = (f.match?.keywords ?? []).filter((k) => text.includes(k)).length;
      s += f.category === "tool" ? Math.min(3, kw) : Math.min(2, kw * 0.5);
      return { id: f.id, s };
    })
    .filter((x) => x.s >= 3)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4);
  byCase[c.id] = scored.map((x) => x.id);
  for (const x of scored) byFramework[x.id].push({ id: c.id, s: x.s });
}
for (const k of Object.keys(byFramework)) byFramework[k] = byFramework[k].sort((a, b) => b.s - a.s).map((x) => x.id);
writeFileSync(join(process.cwd(), "data", "frameworks.json"), JSON.stringify(frameworks));
writeFileSync(join(process.cwd(), "data", "framework-map.json"), JSON.stringify({ byCase, byFramework }));
const unlinked = cases.filter((c) => !byCase[c.id].length).map((c) => c.id);
console.log(`[data] ${frameworks.length} frameworks; ${cases.length - unlinked.length}/${cases.length} cases linked` + (unlinked.length ? ` (unlinked: ${unlinked.join(", ")})` : ""));

// ── Industries (Phase 6): bundle data/industries/*.json (files starting with _ are notes/tools) ──
const indDir = join(process.cwd(), "data", "industries");
const industries = existsSync(indDir)
  ? readdirSync(indDir).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort().map((f) => JSON.parse(readFileSync(join(indDir, f), "utf8")))
  : [];
const fwIds = new Set(frameworks.map((f) => f.id));
for (const ind of industries) {
  for (const a of ind.case_angles ?? []) if (!fwIds.has(a.framework_id)) problems.push(`industry ${ind.id}: unknown framework ${a.framework_id}`);
}
writeFileSync(join(process.cwd(), "data", "industries.json"), JSON.stringify(industries));
console.log(`[data] ${industries.length} industry primers`);

// ── Firms and training content (Phase 7) ──
const firmDir = join(process.cwd(), "data", "firms");
const firms = existsSync(firmDir)
  ? readdirSync(firmDir).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort().map((f) => JSON.parse(readFileSync(join(firmDir, f), "utf8")))
  : [];
writeFileSync(join(process.cwd(), "data", "firms.json"), JSON.stringify(firms));
console.log(`[data] ${firms.length} firm profiles`);

// ── US Playbook: chapters + sizing anchors ──
const usDir = join(process.cwd(), "data", "us");
const usFiles = existsSync(usDir) ? readdirSync(usDir).filter((f) => f.endsWith(".json") && !f.startsWith("_")) : [];
const usChapters = usFiles.filter((f) => f !== "anchors.json").map((f) => JSON.parse(readFileSync(join(usDir, f), "utf8")));
const SECTION_ORDER = { consumer: 0, business: 1, culture: 2 };
usChapters.sort((a, b) => SECTION_ORDER[a.section] - SECTION_ORDER[b.section] || a.order - b.order);
const anchors = usFiles.includes("anchors.json") ? JSON.parse(readFileSync(join(usDir, "anchors.json"), "utf8")) : [];
writeFileSync(join(process.cwd(), "data", "us.json"), JSON.stringify({ chapters: usChapters, anchors }));
console.log(`[data] US playbook: ${usChapters.length} chapters, ${anchors.length} sizing anchors`);

console.log(`[data] ${cases.length} cases bundled from ${files.length} files`);
if (problems.length) {
  console.warn(`[data] ${problems.length} problem(s):\n  - ` + problems.join("\n  - "));
}
