# US Playbook spec (CaseCoach)

Reader: an Indian MBA student at Michigan Ross (worked at a food-delivery/quick-commerce company in India and in audit) preparing for US consulting and tech interviews. Goal: the US consumer, business and cultural context that case interviews silently assume. Practical, specific, interview-oriented. NOT a tourist guide.

Write ONE JSON file per chapter: /home/claude/cc/data/us/<id>.json (UTF-8, 2-space indent):
{
  "id": "kebab-slug",
  "section": "consumer" | "business" | "culture",
  "order": number,                       // position within its section
  "title": "Short title",
  "summary": "1-2 sentences: what this chapter gives you and why it matters in interviews.",
  "blocks": [ ...see block types... ],
  "in_a_case": ["3-5 bullets: how this shows up in case interviews or fit conversations, concrete (e.g. 'A grocer's Q1 dip: post-holiday + January budget resets; check the calendar before blaming operations')"],
  "flashcards": [{"front": "...", "back": "..."}],   // 6-12 cards, crisp, testable facts or concepts from this chapter
  "sources": ["URLs you actually checked (for any statistic)"],
  "checked": "2026-10"
}

Block types (use a varied mix; 5-10 blocks per chapter):
- {"type": "text", "title"?: "...", "body": "1 short paragraph (≤ 80 words)"}
- {"type": "list", "title": "...", "items": ["≤ 25 words each"]}
- {"type": "table", "title": "...", "columns": ["..."], "rows": [["..."]], "note"?: "..."}   // ≤ 12 rows, short cells
- {"type": "callout", "tone": "tip" | "watch", "title": "...", "body": "≤ 60 words"}       // tip = interview advice; watch = common misconception
- {"type": "compare", "title": "...", "left": "India", "right": "US", "rows": [["topic", "India side", "US side"]]}  // India-vs-US comparison, ≤ 10 rows

Rules:
- ACCURACY: any number must be a well-established figure, stated approximately (~), with a source URL in "sources" that you actually fetched (Census, BLS, BEA, Federal Reserve, NRF, Pew, company reports, reputable outlets). Prefer the most recent data (2024-2026). If you can't verify a number, leave it out or describe qualitatively.
- No precise figures that go stale quickly unless they're labeled with a year (e.g. "~$X in 2024").
- Durable phrasing for trends ("growing", "a major theme since 2023") rather than hype.
- Original wording. No copying.
- Neutral and respectful on culture; describe norms, avoid stereotypes about any group.
- Validate with: python3 /home/claude/cc/data/us/_check.py <files>
