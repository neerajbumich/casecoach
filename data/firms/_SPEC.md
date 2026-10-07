# Firm profile spec (CaseCoach Phase 7)

Reader: an MBA student (Michigan Ross, class of 2028) recruiting for US consulting internships.
Write ONE JSON file per firm at /home/claude/cc/data/firms/<id>.json (UTF-8, 2-space indent).

{
  "id": "slug, e.g. mckinsey",
  "name": "McKinsey & Company",
  "tier": "MBB" | "Big 4 strategy" | "Tier 2",
  "one_liner": "One sentence on what the firm is known for.",
  "at_a_glance": ["4-6 short facts: HQ, rough global size (headcount/offices, stated approximately), ownership (partnership etc.), signature practices/strengths. Approximate and hedge (\"~\", \"roughly\"). Nothing you can't verify."],
  "interview_process": {
    "rounds": ["Each round as it typically runs for MBA summer associate/intern recruiting, e.g. 'First round: 2 interviews, each ~25 min case + ~15 min fit'"],
    "case_style": "How the case is run (interviewer-led vs candidate-led, written case, exhibits, math intensity), 1-3 sentences.",
    "fit_style": "How fit/behavioral is assessed (e.g. McKinsey PEI and its dimensions), 1-3 sentences.",
    "assessments": "Online tests or digital assessments if any (e.g. McKinsey Solve), or 'None standard' — 1-2 sentences."
  },
  "what_they_look_for": ["4-6 traits the firm emphasizes, in the firm's own framing where known"],
  "culture": ["3-5 short culture notes that come up in coffee chats (e.g. Bain 'A Bain-er never lets another Bain-er fail'). Only well-documented ones."],
  "why_us_angles": ["4-5 specific, non-generic angles a candidate could use for 'why this firm' (practices, programs, training, model), phrased as prompts to personalize, not scripts"],
  "prep_tips": ["4-6 concrete, firm-specific preparation tips"],
  "practice_mode": "mckinsey" | "bcg" | "bain" | "tier2",
  "sources": ["2-4 URLs you actually checked (firm careers pages preferred)"],
  "checked": "2026-09"
}

Rules:
- RESEARCH with web search/fetch before writing: verify interview format, assessment names, PEI dimensions, headcount order of magnitude on current (2025-2026) sources, preferring the firm's own careers pages. If something can't be verified, leave it out or phrase it generally.
- No invented numbers. Round and hedge.
- Concise: each string ≤ 30 words. Original wording.
- Validate: python3 /home/claude/cc/data/firms/_check.py <files>
