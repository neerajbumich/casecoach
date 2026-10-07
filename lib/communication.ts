// Phase 5: communication best practices. One module per "moment" in a case interview.
// Each module links to the scorecard dimension and mistake categories it improves, and to a drill.
import type { DimensionKey, MistakeCategory } from "@/lib/scoring";

export type DrillKind = "structure" | "exhibit" | "synthesis";

export type CommModule = {
  id: string;
  title: string;
  moment: string; // when in the case this applies
  principle: string; // one-sentence rule
  why: string; // what the interviewer is judging
  dos: string[];
  donts: string[];
  phrases: { label: string; lines: string[] }[];
  example?: { context: string; weak: string; strong: string; why: string };
  dimensions: DimensionKey[];
  mistakes: MistakeCategory[];
  drill?: DrillKind;
};

export const MODULES: CommModule[] = [
  {
    id: "opening",
    title: "Opening the case",
    moment: "First 2 minutes: right after the prompt",
    principle: "Play back the question in one sentence, confirm the objective, and ask only the clarifying questions that would change your structure.",
    why: "The interviewer is checking that you listen, that you know what 'success' means for the client, and that you don't waste time on questions you don't need.",
    dos: [
      "Summarise the prompt in your own words, in one breath: client, situation, question.",
      "Confirm the objective and how it's measured (profit? share? by when?).",
      "Ask 2–3 clarifying questions max, each with a reason: 'Is the decline across all regions? That tells me whether it's market-wide or us.'",
      "Write the key numbers down as you hear them.",
    ],
    donts: [
      "Re-read the whole prompt back word for word.",
      "Fire off a checklist of generic questions (business model, competitors, geography…) before you have a reason.",
      "Start structuring before you know the objective.",
    ],
    phrases: [
      { label: "Playback", lines: ["So our client, a [who], has seen [what], and they want to know [question]. Is that right?", "Just to make sure I have it: the goal is [objective] within [timeframe]?"] },
      { label: "Purposeful clarifying", lines: ["Before I structure, one question that would change my approach: …", "Is [X] something we can change, or should I treat it as fixed?"] },
    ],
    example: {
      context: "Prompt: a regional grocery chain's profits fell 20% last year.",
      weak: "Okay, so the client is a grocery chain and profits fell 20%. Can you tell me about their business model, their competitors, their customers and where they operate?",
      strong: "So a regional grocer's profits dropped 20% last year and they want to know why and how to recover. Is recovery back to prior profit the goal, and over what timeframe? And did competitors see the same drop? That tells me whether to look at the market or at us first.",
      why: "The strong version confirms a measurable goal and asks one question with a clear purpose: it splits the problem in half.",
    },
    dimensions: ["communication", "hypothesis"],
    mistakes: ["clarifying", "communication"],
  },
  {
    id: "structure",
    title: "Presenting your structure",
    moment: "After your 60–90 seconds of thinking time",
    principle: "Go top-down: say how many buckets, name them, walk each with 2–3 specifics, then say where you'd start and why.",
    why: "The structure is the single biggest signal of 'can this person run a workstream'. A clear delivery matters as much as the content.",
    dos: [
      "Ask for time: 'Could I take a minute to structure my thoughts?'",
      "Number your buckets out loud: 'I'd look at three areas.'",
      "Turn your page toward the interviewer and point as you talk.",
      "Tailor labels to the case (say 'basket size per store visit', not just 'revenue').",
      "End with a hypothesis and a first step: 'My hunch is X, so I'd start with Y.'",
    ],
    donts: [
      "Read every sub-bullet in a monotone for three minutes.",
      "Name the framework ('I'll use Porter's Five Forces') instead of the content.",
      "Finish with 'so… yeah' and wait for the interviewer to pick.",
    ],
    phrases: [
      { label: "Top-down", lines: ["To answer whether [client] should [decision], I'd look at three areas: A, B and C.", "First, … Within that I'd want to know … Second, … Third, …"] },
      { label: "Hand-off", lines: ["Given [fact from prompt], my initial hypothesis is [X], so I'd like to start with [bucket]. Does that sound reasonable?"] },
    ],
    example: {
      context: "Should a US coffee chain enter India?",
      weak: "I'll use a market entry framework. Market, competition, company, economics, entry mode. For market I'd look at size and growth…",
      strong: "To decide whether to enter India, I'd answer four questions. One: is the market attractive — size, growth and how much people pay for café coffee versus tea? Two: can we win — who's there already and what would make us different? Three: does it pay — investment per store, margins and payback? Four: how would we enter — own stores, franchise or a JV? My hunch is the market is attractive but crowded, so I'd start with question two.",
      why: "Questions instead of labels, tailored details, and a hypothesis that tells the interviewer where to go next.",
    },
    dimensions: ["structure", "communication", "hypothesis"],
    mistakes: ["structure", "hypothesis", "communication"],
    drill: "structure",
  },
  {
    id: "signposting",
    title: "Signposting and driving the case",
    moment: "Every transition between parts of the case",
    principle: "Before each move, say where you are, what you found, and where you're going next.",
    why: "Interviewers score whether you 'drive'. Signposts show you own the case instead of waiting to be led.",
    dos: [
      "Close each section with a mini-conclusion: 'So costs are in line with peers; the issue is on revenue.'",
      "Link back to your structure: 'That rules out bucket two, so moving to bucket three…'",
      "Update your hypothesis out loud when new data changes it.",
      "Propose the next step rather than asking 'what should I do next?'",
    ],
    donts: [
      "Jump to a new topic without closing the last one.",
      "Ask the interviewer for permission at every step.",
      "Keep digging in a bucket after you've found the answer there.",
    ],
    phrases: [
      { label: "Closing a section", lines: ["So the takeaway is …, which means …", "That confirms / kills my hypothesis that …"] },
      { label: "Moving on", lines: ["Next, I'd like to understand … because …", "Let me step back to my structure: we've covered A, the open question is B."] },
    ],
    dimensions: ["communication", "hypothesis"],
    mistakes: ["communication", "hypothesis", "time-management"],
  },
  {
    id: "math",
    title: "Doing math out loud",
    moment: "Any calculation",
    principle: "State your approach before calculating, calculate in clear steps with units, sanity-check, then say what the number means.",
    why: "They're judging whether a client could follow and trust your numbers. A correct answer with a hidden method scores lower than a transparent one.",
    dos: [
      "Lay out the equation first: 'Profit = customers × spend × margin − fixed costs. Let me plug in.'",
      "Round sensibly and say so: 'I'll call it 30,000 to keep it clean.'",
      "Keep units and zeros visible (write M and K).",
      "Sanity-check: 'That's about 10% of revenue, which feels plausible for grocery.'",
      "Finish with the so-what, not just the number.",
    ],
    donts: [
      "Go silent for a minute and announce a number.",
      "Drop zeros between steps.",
      "Stop at the number: '$3.2 million.' …and?",
    ],
    phrases: [
      { label: "Setting up", lines: ["My approach: first …, then …, and compare that to …", "Let me write the equation before plugging in numbers."] },
      { label: "So-what", lines: ["That's $X, which means [implication for the client].", "So breakeven is Y units, roughly Z% of the market, which seems achievable / a stretch."] },
    ],
    example: {
      context: "Calculate annual profit of an airport burger stand.",
      weak: "…(40 seconds of silence)… $70,000.",
      strong: "Profit is customers per day × spend × margin × days open, minus fixed costs. 350 passengers plus 150 employees is 500 customers a day. At $10 and a 20% margin that's $1,000 a day, or $350K over 350 days. Minus $280K fixed costs gives $70K profit. That's a thin cushion: a 20% dip in traffic wipes it out, so I'd be cautious.",
      why: "The interviewer can follow every step, catch a slip early, and hears the business implication.",
    },
    dimensions: ["quant", "communication"],
    mistakes: ["math-setup", "math-arithmetic", "business-judgment"],
  },
  {
    id: "exhibits",
    title: "Reading an exhibit",
    moment: "Whenever you're handed a chart or table",
    principle: "Take 20–30 seconds, then say: what the exhibit shows, the one thing that jumps out, and what it means for the question.",
    why: "They're testing whether you find the signal fast and connect it to the case, not whether you can describe a chart.",
    dos: [
      "Read the title, axes, units and footnotes before the data.",
      "Lead with the insight: 'The key thing here is that segment C is shrinking while it's our biggest.'",
      "Quantify: 'down 15% vs +5% for the market'.",
      "Tie it back: 'which suggests the profit drop is a mix problem'.",
    ],
    donts: [
      "Narrate every bar left to right.",
      "Miss the units or the footnote (it's often the trap).",
      "Stop at the observation without the implication.",
    ],
    phrases: [
      { label: "Insight first", lines: ["The main takeaway is …", "What stands out is …, versus …"] },
      { label: "Implication", lines: ["For our question, that means …", "That points me toward …, so I'd next want to see …"] },
    ],
    dimensions: ["exhibits", "communication"],
    mistakes: ["exhibit-reading", "business-judgment"],
    drill: "exhibit",
  },
  {
    id: "brainstorm",
    title: "Brainstorming",
    moment: "'What could explain…?' or 'What ideas do you have…?'",
    principle: "Give your buckets first, then fill them with specific ideas, then prioritise.",
    why: "They want creativity with structure: many ideas, organised so nothing obvious is missing, and a view on which matter.",
    dos: [
      "Pause 10–20 seconds, then announce the split: 'I'd think about internal and external reasons.'",
      "Use simple MECE splits: internal/external, short/long term, customer/company/competitor, revenue/cost.",
      "Give 2–3 concrete ideas per bucket.",
      "Close by picking the most promising one or two and why.",
    ],
    donts: [
      "List ideas in random order as they come to mind.",
      "Stop at three ideas.",
      "Stay abstract ('improve marketing') without an example.",
    ],
    phrases: [
      { label: "Framing", lines: ["I'd group the ideas into two buckets: … and …", "Let me think about this from the customer's side and from ours."] },
      { label: "Prioritising", lines: ["Of these, I'd prioritise … because it's fastest / biggest / cheapest."] },
    ],
    dimensions: ["creativity", "structure"],
    mistakes: ["brainstorming", "structure"],
  },
  {
    id: "synthesis",
    title: "The final recommendation",
    moment: "'The CEO just walked in. What do you tell her?'",
    principle: "Answer first, then 2–3 reasons with numbers, then risks, then next steps, in under 60 seconds.",
    why: "This is the last impression and the closest thing to real client work. They check that you commit to an answer and support it with what you found.",
    dos: [
      "Stand up the answer in the first sentence: 'You should enter India through a JV.'",
      "Use the numbers you calculated as reasons.",
      "Name 1–2 real risks and how to mitigate them.",
      "Give concrete next steps.",
      "Take 15–30 seconds to prepare; it's allowed.",
    ],
    donts: [
      "Recap the case chronologically ('First we looked at…').",
      "Hedge ('it depends', 'maybe') without committing.",
      "Introduce new facts or analysis you didn't do.",
    ],
    phrases: [
      { label: "Answer first", lines: ["My recommendation is that [client] should [action].", "The answer is [yes/no]: …"] },
      { label: "Support and close", lines: ["There are three reasons. First … Second … Third …", "The main risk is …, which we could mitigate by …", "As next steps, I'd …"] },
    ],
    example: {
      context: "PE firm deciding whether to buy a spice company.",
      weak: "So we looked at the income statement and saw costs were high, then we found packaging savings, then we did the valuation, and it came to about $155M, so I think it could be a good deal, depending on the risks.",
      strong: "You should buy Favored Flavors. Three reasons: fixing packaging and saffron sourcing adds about $3M of EBITDA; revenue grows from $50M to $80M by 2024; and at a 10× exit that's roughly $155–165M of value, over 2× your $75M. The main risk is the growth forecast, so I'd stress-test it against a flat market, and next I'd validate the supplier savings with procurement.",
      why: "Answer in the first four words, reasons are numbers from the case, one risk with a mitigation, one next step.",
    },
    dimensions: ["synthesis", "communication"],
    mistakes: ["synthesis", "business-judgment"],
    drill: "synthesis",
  },
  {
    id: "pushback",
    title: "Pushback, silence and getting stuck",
    moment: "When the interviewer challenges you, or you're lost",
    principle: "Stay calm, think out loud, and either defend with a reason or update with a reason.",
    why: "Pushback is often a test of composure, not a sign you're wrong. Getting stuck is fine; going silent isn't.",
    dos: [
      "Pause and consider: 'That's a fair challenge. Let me think about it.'",
      "If you still agree with yourself, defend it with evidence; if not, update clearly.",
      "When stuck, go back to your structure or restate what you know.",
      "Ask a targeted question: 'Is there data on X? That would help me decide.'",
    ],
    donts: [
      "Cave immediately every time you're challenged.",
      "Argue without a new reason.",
      "Freeze. Silence over 20 seconds feels like 2 minutes.",
    ],
    phrases: [
      { label: "Under pushback", lines: ["Good point. I'd still hold my view because …", "You're right, that changes things: if X, then I'd …"] },
      { label: "When stuck", lines: ["Let me step back. What we know so far is …", "One way to get at this would be … — do we have data on that?"] },
    ],
    dimensions: ["communication", "hypothesis"],
    mistakes: ["communication", "business-judgment"],
  },
  {
    id: "firm-styles",
    title: "Adjusting to the firm's style",
    moment: "Before the interview",
    principle: "Same skills, different rhythm: McKinsey leads you question by question; BCG and Bain expect you to drive.",
    why: "Knowing the format stops you from waiting for direction in a candidate-led case, or from over-structuring a quick interviewer-led question.",
    dos: [
      "McKinsey (interviewer-led): answer the question asked, crisply; structure each question; expect a brainstorm, an exhibit and math on a fixed path.",
      "BCG (candidate-led, often creative): drive, propose next steps, show business intuition and creativity; exhibits can be dense.",
      "Bain (candidate-led, practical): drive, be hypothesis-led and numbers-focused; expect a clear 'answer first' close.",
      "Tier 2 and boutiques: usually candidate-led and similar to Bain; industry knowledge can matter more.",
    ],
    donts: [
      "Wait to be told what to do next in a candidate-led case.",
      "Give a 3-minute framework to a narrow McKinsey sub-question.",
    ],
    phrases: [
      { label: "Candidate-led driving", lines: ["Next, I'd like to look at … — do we have data on that?", "Based on that, I'd propose we …"] },
      { label: "Interviewer-led answers", lines: ["To answer that directly: … and here's why.", "I'd look at three things for this question: …"] },
    ],
    dimensions: ["communication", "structure"],
    mistakes: ["communication", "time-management"],
  },
];

export function getModule(id: string) {
  return MODULES.find((m) => m.id === id);
}

/** Modules ordered by how much they target the user's weakest dimensions. */
export function modulesForWeakness(avg: Partial<Record<DimensionKey, number | null>>): CommModule[] {
  const scored = Object.entries(avg).filter((e): e is [DimensionKey, number] => typeof e[1] === "number");
  if (!scored.length) return [];
  const weakest = scored.sort((a, b) => a[1] - b[1]).slice(0, 2).map(([k]) => k);
  return MODULES.filter((m) => m.dimensions.some((d) => weakest.includes(d)))
    .sort((a, b) => weakest.indexOf(a.dimensions.find((d) => weakest.includes(d))!) - weakest.indexOf(b.dimensions.find((d) => weakest.includes(d))!))
    .slice(0, 3);
}

export const DRILLS: Record<DrillKind, { title: string; blurb: string; prepSec: number; speakSec: number; checklist: string[] }> = {
  structure: {
    title: "Structure pitch",
    blurb: "Get a real case prompt, take 90 seconds to structure, then deliver it in 90 seconds. Compare with the casebook's structure.",
    prepSec: 90,
    speakSec: 90,
    checklist: [
      "Played back the question and objective",
      "Said how many buckets before naming them",
      "Labels tailored to this client, not generic",
      "2–3 specifics under each bucket",
      "Buckets don't overlap and nothing big is missing",
      "Ended with a hypothesis and where to start",
    ],
  },
  exhibit: {
    title: "Exhibit read",
    blurb: "See an exhibit from a real case, take 30 seconds, then state the insight and the so-what. Compare with the key insight.",
    prepSec: 30,
    speakSec: 45,
    checklist: [
      "Checked title, units and footnotes",
      "Led with the single most important insight",
      "Quantified it (%, ×, $)",
      "Tied it back to the case question",
      "Said what I'd look at next",
    ],
  },
  synthesis: {
    title: "60-second recommendation",
    blurb: "Get the facts from a solved case, take 30 seconds, then give the CEO your recommendation in 60 seconds. Compare with the casebook's answer.",
    prepSec: 30,
    speakSec: 60,
    checklist: [
      "Answer in the first sentence",
      "2–3 reasons, each with a number",
      "No chronological recap",
      "At least one risk with a mitigation",
      "Concrete next steps",
      "Finished within 60 seconds",
    ],
  },
};

/** The module that best addresses a journal mistake category (first match in case order). */
export function moduleForMistake(cat: string): CommModule | undefined {
  return MODULES.find((m) => (m.mistakes as string[]).includes(cat));
}
