# Fit interview question bank (CaseCoach Phase 7)

Write /home/claude/cc/data/drills/fit-questions.json for an MBA student recruiting at MBB, Big 4 strategy and tier-2 consulting (and some tech).

{
  "competencies": [
    {"id": "leadership", "label": "Leadership", "blurb": "one sentence: what interviewers probe"},
    ... 8-10 competencies total: include leadership, teamwork/inclusion, impact/drive (achievement), overcoming a challenge/resilience, failure/learning, conflict/difficult people, persuasion/influence, analytical problem solving, ethics/integrity, entrepreneurial/initiative
  ],
  "firm_frameworks": [
    {"firm": "McKinsey", "name": "Personal Experience Interview (PEI)", "dimensions": [...the current PEI dimensions, verified via web search on mckinsey.com careers pages...], "note": "how it is run, 1-2 sentences (one story per interview, deep follow-ups)", "source": "URL you checked"},
    {"firm": "BCG", ...}, {"firm": "Bain", ...}  // only include what you can verify; otherwise describe generally
  ],
  "questions": [
    {"id": "slug", "q": "the question as asked", "competencies": ["ids"], "type": "story" | "motivation" | "resume", "follow_ups": ["2-3 likely deep-dive follow-ups"], "tip": "one short tip"}
  ],
  "star_guide": ["5-7 bullets on structuring a story (situation brief, focus on YOUR actions, quantify result, reflection), with timing guidance (~2 minutes)"]
}

Questions: 40 total. Include: tell me about yourself / walk me through your resume; why consulting; why this firm; why MBA / why now; strengths & weaknesses; a spike on each competency (3+ per competency); PEI-style deep-dive prompts (e.g. "Tell me about a time you had to change a group's direction"); a few tech-flavored ones (why product/tech). Original wording.

Research the firm_frameworks via web search/fetch (mckinsey.com, bcg.com, bain.com careers/interview prep pages). Validate with: python3 -c "import json;d=json.load(open('/home/claude/cc/data/drills/fit-questions.json'));c={x['id'] for x in d['competencies']};bad=[q['id'] for q in d['questions'] if not set(q['competencies'])<=c];print(len(d['questions']),'questions; bad refs',bad)"
