# US sizing anchors (CaseCoach)

Write /home/claude/cc/data/us/anchors.json: a JSON array of 60-80 US numbers an interviewer expects a candidate to estimate with or recognize, for market sizing.

Each: {"id": "kebab", "category": "People & households" | "Spending & income" | "Transport & energy" | "Food & retail" | "Health" | "Work & business" | "Tech & media" | "Home & pets" | "Time & misc",
       "label": "US households", "value": "~130M", "interview_value": "130M" (the round number to use in a case), "note": "one line: context or how to derive/remember it", "source": "URL actually fetched", "year": 2024}

Rules:
- VERIFY every number with web search/fetch from authoritative sources (Census, BLS, BEA, EIA, FHWA, USDA, CDC, Federal Reserve, APPA for pets, NRF, Pew, FCC, etc.). Use the latest available year. If you can't verify, drop it.
- Keep these consistent with the app's existing anchors where they overlap: US population ~340M, households ~130M (~2.5 people each), adults ~260M, life expectancy ~80 (use whatever verified values say; if current data differs materially, report it in your reply).
- Cover: population by age bands, households & household size, births/deaths per year, cars/registered vehicles, licensed drivers, gas stations, miles driven, flights/airline passengers, median household income, consumer spending share of GDP, retail sales, e-commerce share, grocery spend, restaurant spend & restaurant count, Starbucks/McDonald's US store counts (company reports), smartphone ownership, broadband, streaming subscriptions, pets (dogs/cats households), homeownership rate, housing units, employment, labor force, small businesses count, Fortune 500 revenue, healthcare spend share of GDP, hospitals count, physicians, insured rate, schools/students, college enrollment, electricity use per household, etc.
- Then validate: python3 -c "import json;d=json.load(open('/home/claude/cc/data/us/anchors.json'));ids=[a['id'] for a in d];assert len(ids)==len(set(ids));assert all(a.get('source','').startswith('http') for a in d);print(len(d),'anchors',sorted({a['category'] for a in d}))"
