# Industry primer spec (CaseCoach, Phase 6)

Audience: an MBA student preparing for consulting (MBB) and tech interviews. Goal: a 5-minute primer
that gives case-interview fluency in the industry: how it makes money, the economics, the metrics
interviewers expect you to know, current themes, and the typical case questions.

Write ONE JSON file per industry: /home/claude/cc/data/industries/<id>.json, UTF-8, 2-space indent.

```json
{
  "id": "<taxonomy slug, exactly as given>",
  "name": "Display name",
  "group": "one of: Tech & media | Consumer & retail | Travel & transport | Energy & resources | Financial services | Healthcare | Industrials | Public & services",
  "one_liner": "One sentence: what the industry is and what defines its economics.",
  "how_it_makes_money": "2-3 sentences on business models and revenue sources.",
  "value_chain": ["4-6 steps, upstream to downstream, each 2-6 words"],
  "revenue_formula": ["1-3 case-style driver trees, e.g. 'Revenue = available seat miles × load factor × yield'"],
  "cost_structure": ["3-6 main cost buckets, each with a short note; rough shares only if well established, e.g. 'Fuel: often ~20-30% of airline operating costs'"],
  "margins": "1-2 sentences, typical profitability ranges stated as rough ranges, and what drives the spread.",
  "key_metrics": [{"name": "Metric (abbr)", "what": "what it measures and why it matters, one sentence"}],
  "trends": ["4-6 current themes (2025-2026), durable phrasing, no precise figures that go stale"],
  "key_players": ["6-10 well-known companies; for fragmented industries include a note like '(highly fragmented)'"],
  "case_angles": [{"question": "a typical case question in this industry", "framework_id": "one of the ids below"}],
  "interview_hooks": ["2-3 debates to have a point of view on in an interview"],
  "news": {
    "keywords": ["6-12 lowercase terms distinctive to this industry, as they appear in headlines (e.g. 'airline', 'jet fuel', 'faa')"],
    "companies": ["6-12 company names as they appear in headlines (e.g. 'Delta', 'United Airlines')"]
  }
}
```

key_metrics: 5-7 items. case_angles: 3-4 items.

Allowed framework_id values: profitability, market-entry, mergers-acquisitions, pricing, new-product-gtm,
growth-strategy, cost-reduction, market-sizing, investment-npv, breakeven, operations-capacity,
competitive-response, turnaround, porters-five-forces, three-cs, supply-demand, customer-segmentation,
value-chain, public-sector-social-impact.

Rules:
- Accuracy over flourish. Use well-established knowledge. Do NOT invent statistics. Only give numbers
  that are widely known ballparks, phrased as approximate ("roughly", "~"). No market-size figures.
- Keep it US-centric by default, mentioning global where it matters.
- Concise: each string is one sentence or a short phrase. The whole file should be ~500-800 words.
- Original wording (don't copy from any source).
- news.keywords must be specific enough not to match unrelated stories (avoid 'market', 'growth', 'bank' alone is OK only for banking).
- After writing each file, validate it: `python3 /home/claude/cc/data/industries/_check.py <file>` and fix any error.
