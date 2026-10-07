# CaseCoach

A personal consulting case-interview prep app. It's an installable PWA for Mac and iPhone, built with Next.js 16, Tailwind 4 and Supabase auth.

**Phase 2:** a dashboard, a searchable case library and a case page you can study without spoilers. It works offline and is locked to invited emails.

**Phase 3:** mock interviews with Claude as the interviewer, scorecards, a session log and a mistake journal that recommends your next case.

**Phase 4:** a frameworks repository and a custom-framework coach (see below).

**Phase 5:** communication best practices with timed drills (see below).

**Phase 6:** 42 industry primers and a Recruiting radar news feed (see below).

**Phase 7 (this version):** drills, flashcards, fit stories, firm pages, a Progress dashboard, case of the day and casing-partner mode (see below). **All seven phases are built.**

> **The case content is copyrighted material for personal study only.** Keep the GitHub repo **private**. The deployed app refuses to show anything until sign-in is configured, and it only admits emails listed in `ALLOWED_EMAILS`.

## Run it locally (5 minutes)

You need Node 20.9 or newer.

```bash
npm install
cp .env.example .env.local        # then edit it (see below)
npm run dev                       # http://localhost:3000
```

**To preview without sign-in**, set `AUTH_DEV_BYPASS=true` in `.env.local`. An orange banner reminds you sign-in is off. This bypass is ignored on Vercel.

**Production build check:**

```bash
npm run build && npm start
```

The service worker (offline mode) only runs in a production build.

## Set up sign-in (Supabase, free)

1. Create a project at supabase.com (the free tier is enough).
2. Go to **Project Settings → API**. Copy the Project URL and the publishable key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Keep **Authentication → Sign In / Providers → Email** enabled. The default emails work as they are: nothing to edit.
4. Set `ALLOWED_EMAILS=you@umich.edu,partner@umich.edu`. Anyone not on this list is refused, even with a Supabase account.
5. In **Authentication → URL Configuration**, add your site under **Redirect URLs**: `http://localhost:3000/**` and later `https://<your-app>.vercel.app/**`.

**Signing in**
- **First time (on your Mac):** on the sign-in page, choose **Email me a sign-in link** and open the link on the same computer. You land on Settings. Set a password there.
- **iPhone home-screen app:** sign in with your email and that password. Email links open in Safari, not the installed app, which is why the app uses a password on the phone.
- **Forgot your password:** request a new sign-in link, then set a new password.

## Phase 3 setup: the database tables (one time, about 2 minutes)

1. In Supabase, open **SQL Editor → New query**.
2. Paste in the contents of `supabase/migrations/0001_phase3_sessions.sql` and click **Run**.

This creates `sessions`, `mistakes`, `case_progress` and `llm_usage`. All four have row-level security, so each person sees only their own rows.

## How practice works

**Free, the default: Claude-app handoff**
1. Go to **Practice** and pick a case: a specific one, a random one with filters, or "targets your weakest area". Choose the interview style (McKinsey, BCG, Bain, or Deloitte/Tier 2) and the length, and whether to start with a fit question.
2. Tap **Copy interviewer prompt** and paste it into a new chat in the Claude app. On iPhone you can then switch to voice mode.
   - The prompt contains the answer key and instructs Claude never to reveal it. Don't read it yourself.
3. During the case, use the practice screen:
   - a timer;
   - a scratchpad, saved on the device;
   - a hint counter;
   - exhibit reveals. Tap one only when the interviewer hands it over. If a book's exhibit page also shows interviewer notes, you see the transcribed table instead of the image.
4. Say **END CASE**. Claude replies with a JSON scorecard. Paste that reply into **Save your scorecard**.
   - Each of 7 dimensions is scored 1–5, backed by quotes from what you said.
   - It also covers where you went wrong, your framework against the ideal one, alternative frameworks and 3 drills.
5. The session goes into the **Session log**. Its mistakes are tagged and feed the **Journal**, which shows:
   - trends such as "Arithmetic errors down 40%";
   - your average for each dimension;
   - the next case to do, chosen to target your weakest area.

If a chat ended without a scorecard, paste the transcript and tap **Copy a scoring prompt** to get one.

**Optional: in-app interviewer (uses the Anthropic API)**
- Set `ANTHROPIC_API_KEY` and `MONTHLY_SPEND_CAP_USD` (for example `20`) in Vercel. It stays off unless both are set.
- It adds a chat with the browser's free voice features: hold-to-talk, hands-free mode and spoken replies.
- Calls go only through server routes, so the key never reaches the browser.
- There's a per-user rate limit, and a hard monthly cap tracked in `llm_usage`.
- The long case prompt is cached between turns to cut cost.
- The model names are all in `lib/config/models.ts`.

## Frameworks (Phase 4)

- **19 canonical frameworks** are stored in `data/frameworks/*.json`: 12 case frameworks (profitability, market entry, M&A, pricing and others) and 7 tools (Porter's Five Forces, 3Cs, value chain and others).
- **Each framework page** shows:
  - when to use it and when not to;
  - a visual issue tree;
  - the questions and data to ask in each bucket;
  - industry adaptations;
  - common mistakes;
  - related frameworks;
  - the library cases that use it.
- **Case pages** list the frameworks each case uses.
  - The links are computed when the data is built, from each case's type, tags and suggested structure. All 69 cases are linked.
  - Edit a framework's `match` field to change which cases it links to.
- **The coach** at `/frameworks/coach` works in two ways:
  - Paste a case prompt to get a suggested structure.
  - Add your own structure as well to get a critique on MECE, tailoring, hypothesis and prioritisation.
- **How the coach runs:**
  - By default, it copies a prompt for the Claude app, which is free.
  - If `ANTHROPIC_API_KEY` and `MONTHLY_SPEND_CAP_USD` are set, it can also answer in the app. Those calls count toward the same monthly cap.

## Communication (Phase 5)

- **The Learn tab** holds Frameworks and Communication. Industries arrive in Phase 6.
- **9 modules** follow the moments of a case in order: opening, presenting your structure, signposting, math out loud, reading exhibits, brainstorming, the final recommendation, handling pushback, and adjusting to each firm's style.
- **Each module** gives:
  - the rule, and what the interviewer is judging;
  - do's and don'ts;
  - phrases to use;
  - a weak vs strong example.
- **Your focus** points you to the modules that target your 2 weakest scorecard areas, based on your saved sessions.
- **3 timed drills use real library cases:**
  - Structure pitch: 90s to think, 90s to speak.
  - Exhibit read: 30s to think, 45s to speak.
  - 60-second recommendation: 30s to think, 60s to speak.
- **After each drill:**
  1. Score yourself against a checklist.
  2. Compare with the casebook's version.
  3. Optionally copy a feedback prompt into the Claude app for free.
- **The Journal** links each recurring mistake to the module that fixes it.
- The content lives in `lib/communication.ts`, and the drill case picker is in `lib/drills.ts`.

## Industries and news (Phase 6)

- **Industries (`/industries`):** 42 five-minute primers. Each one covers:
  - how the industry makes money, its value chain, driver trees and costs;
  - typical margins and the metrics to know;
  - current themes, debates to have a view on, and key players;
  - typical case questions (linked to frameworks) and your library cases;
  - live news.
- The primers are in `data/industries/*.json`. Rough ranges only, no invented statistics. `_SPEC.md` and `_check.py` there describe and validate the format.
- **Recruiting radar (`/news`, plus a strip on Home):**
  - **Sources:** free public RSS feeds (WSJ Business, Markets, Tech and World; Consulting.us; TechCrunch). No API key, no cost.
  - **Refresh:** fetched on the server and cached for 30 minutes.
  - **Ranking** (`lib/news-rank.ts`): stories are ranked for consulting and tech recruiting, tagged, and given a one-line "why it matters" that links to a framework where it fits. Opinion columns and market roundups are dropped.
  - WSJ links open on wsj.com, where your own subscription (e.g. university access) gives the full article. The app never logs in to WSJ.
  - **Offline testing:** set `NEWS_FIXTURE_DIR` to a folder of `<feed-id>.xml` files. This is ignored on Vercel.

## Training tools (Phase 7)

**One-time setup:** run `supabase/migrations/0002_phase7_training.sql` in the Supabase SQL Editor. It has already been run on your project and checked with a rolled-back privacy test.

- **Home**
  - **Case of the day:** the same case all day, chosen from cases you haven't done and aimed at your weakest scorecard area.
  - Your practice streak and quick links to the drills.
- **Practice → Mental math**
  - Timed case arithmetic in 8 types: multiplication, division, percent of, percent change, fractions, breakeven, growth/CAGR and big numbers.
  - Forgiving answers: `1.2M`, `$450k` and `12.5%` all work.
  - A tip when you miss, and a "focus on my weakest" mode.
- **Practice → Market sizing**
  - 30 problems (easy, medium, hard) with a 5-minute timer.
  - Each has a model driver tree, assumptions, the math, an acceptable range, a sanity check and a feedback prompt for Claude.
  - All problems use the same anchors: US population ~340M, households ~130M.
- **Practice → Flashcards**
  - Spaced repetition over about 360 cards, synced across devices.
  - Decks: case math and finance (formulas, fractions, definitions, sizing anchors), framework branches and opening lines, the metrics from each industry primer, and communication rules.
- **Practice → Fit stories**
  - A STAR story bank tagged by 10 competencies.
  - Coverage view with gaps and McKinsey PEI readiness.
  - 40 fit questions with follow-ups, and a practice mode with a Claude role-play prompt.
- **Practice → Casing partner**
  - Interview a friend on any library case. You get an interviewer view with step-by-step prompts, when to give each piece of information, the answer key, and a full-screen exhibit mode to show the candidate.
  - Score them on the 7 areas and send the scorecard. They review it and can add it to their own journal as a "partner" session.
- **Learn → Firms:** 10 firm profiles (McKinsey, BCG, Bain, Deloitte, EY-Parthenon, Strategy&, Kearney, Oliver Wyman, L.E.K., Accenture), each with:
  - the interview process and assessments (e.g. McKinsey Solve, the PEI and its four qualities);
  - what the firm looks for and culture notes;
  - "why us" prompts and prep tips;
  - sources.
- **Progress** (bottom tab, replaces Journal)
  - Streak, a 12-week activity heatmap and interview-skill averages.
  - Mental-math accuracy and speed by type.
  - Drill totals and flashcard mastery.
  - Fit story gaps, plus a link to the mistake journal.
- **Casing partners**
  - Add emails to `PARTNER_EMAILS`.
  - Partners can use the library, drills and interviewer mode. Their own data is private to them (database row-level security).
  - They can only send a scorecard to someone invited to the app.
- **Where the data lives**
  - Drill results, flashcard progress and stories are stored per user in the `user_items` table.
  - Partner scorecards are stored in `partner_feedback`.
  - In local preview mode everything goes into `.data/store.json`, which is shared by anyone using that preview.

## Deploy to Vercel

1. Push this folder to a **private** GitHub repo.
2. In Vercel, import the repo (the framework is detected as Next.js).
3. Add the environment variables from `.env.example`: the Supabase URL and key, `ALLOWED_EMAILS` and (optionally) `PARTNER_EMAILS`. Don't set `AUTH_DEV_BYPASS`.
4. Deploy.
5. In Supabase, go to **Authentication → URL Configuration** and set the Site URL to your Vercel URL.

**Install on iPhone:** open the site in Safari, tap **Share**, then **Add to Home Screen**.

## Adding more cases

Extracted cases are JSON files, one per case, using the schema in `lib/schema/case.ts`.

1. Copy new files from `_CaseCoach/cases/` in your Consulting Case Books folder into `data/cases/`.
2. Put their exhibit images in `private/exhibits/<case-id>/pNNN.webp`.
3. Run `npm run data`. It rebuilds `data/library.json` and reports any problems.
4. Commit and push; Vercel redeploys.

## How the content is protected

- Every request goes through `proxy.ts`. If there's no valid Supabase session for an allowed email, pages redirect to `/login` and API routes return 401.
- If Supabase isn't configured, the app **fails closed**: every page redirects to the sign-in page, which only says sign-in isn't set up, and every API route returns 503.
- Pages also re-check sign-in themselves, and always render per request, so nothing is prerendered into static files.
- Case data is bundled only into the server code. It never goes in `/public`.
- Exhibit images live in `private/` and are served only by the authenticated `/api/exhibits` route.
- Search engines are blocked by the `noindex` header and `robots.txt`.
- Offline copies live only in your browser's cache. **Settings → Sign out** deletes them.

## Project layout

```
app/(app)/            signed-in pages: dashboard, library, case/[id], practice, journal, frameworks, settings
app/login/            email-code sign-in
app/api/exhibits/     authenticated exhibit images
components/           UI (Dashboard, Library, CaseView, Settings)
lib/                  auth, Supabase client, case loader, taxonomy, model config
lib/config/models.ts  the ONE place to change Claude model names (used from Phase 3)
data/cases/           one JSON file per case (the seed data)
data/frameworks/      one JSON file per framework (Phase 4)
private/exhibits/     exhibit images (not public)
public/sw.js          hand-written service worker (offline)
scripts/build-data.mjs  bundles cases + frameworks and links them
```

## Changes from the original plan

- **Charts are plain HTML/CSS instead of Recharts.**
  - The dashboard only needs bar lists and a heatmap, and plain elements keep the page light (Lighthouse mobile scores 96–98). They're also fully tappable and screen-reader friendly.
  - Recharts will be added in Phase 3 for score-trend lines.
- **The service worker is hand-written instead of using Serwist.**
  - It's about 80 lines, needs no build step, and I control exactly what gets cached. For example, sign-in redirects are never cached.
- **"Solved" status is stored on each device for now.** Phase 3 moves it to Supabase along with the session log, so it syncs between your Mac and iPhone.
