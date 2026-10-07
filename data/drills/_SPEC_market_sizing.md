# Market sizing problem set (CaseCoach Phase 7)

Write /home/claude/cc/data/drills/market-sizing.json: a JSON array of 30 problems for MBA consulting interview practice.
Mix: 10 easy, 12 medium, 8 hard. Mix of B2C and B2B, US and a few global/India ones, supply-side and demand-side approaches, and some tech (e.g. annual revenue of a SaaS category, number of EV chargers). Avoid only-famous-ones; include a few classics (golf balls, gas stations) but mostly fresh ones.

Each problem:
{
  "id": "kebab-slug",
  "question": "Estimate the annual US market for X (in $ / units). One sentence, as an interviewer would say it.",
  "difficulty": 1 | 2 | 3,             // easy/medium/hard
  "unit": "$" | "units" | "people" | "other",
  "tags": ["b2c" | "b2b", "demand-side" | "supply-side", "us" | "global" | "india", optional topical tags],
  "clarify": ["1-3 clarifying questions worth asking and the assumed answers"],
  "approach": ["the driver tree, top-down, as 3-6 lines, e.g. 'US households (~130M) × share with a dog (~40%) × ...'"],
  "assumptions": [{"label": "US households", "value": "~130M", "why": "short justification"}],
  "calc": ["step-by-step arithmetic lines with round numbers, ending in the estimate"],
  "estimate": "the model answer with unit, e.g. '~$9B'",
  "estimate_value": number,            // the model answer as a raw number in base units (dollars/units), e.g. 9000000000
  "range": [low_number, high_number],  // a reasonable range an interviewer would accept (usually ~0.5x to 2x)
  "sanity_check": "one sentence cross-check (e.g. per-capita, compare to a known company revenue order of magnitude)",
  "so_what": "one sentence on how the number would be used by the client"
}

Anchors to use (consistent across problems; don't use other values for these):
- US population ~340M; US households ~130M (~2.5 people each); US adults ~260M; US life expectancy ~80 years
- World population ~8B; India population ~1.4B
- US GDP ~$28T (use only if needed)
- Weeks/year 52; working days/year ~250; days/year 365

Rules:
- Arithmetic MUST be exactly consistent: each calc line must follow from the previous; estimate_value must equal the final calc number. Round sensibly (interview-style).
- Assumptions must be defensible ballparks; hedge with "~". Never present an assumption as a sourced fact.
- Original problems (don't copy case book text).
- After writing, run: python3 /home/claude/cc/data/drills/_check_ms.py and fix all errors.
