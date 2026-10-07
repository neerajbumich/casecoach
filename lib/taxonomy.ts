import taxonomy from "@/data/taxonomy.json";

export const TAXONOMY = taxonomy as Record<string, string[]>;

const SPECIAL: Record<string, string> = {
  "tech-saas": "Tech / SaaS",
  "ai-cloud": "AI / Cloud",
  cpg: "CPG",
  "food-delivery-quick-commerce": "Food delivery / Q-commerce",
  "automotive-ev": "Automotive / EV",
  "oil-gas": "Oil & gas",
  "payments-fintech": "Payments / Fintech",
  "asset-management-pe": "Asset mgmt / PE",
  "logistics-3pl": "Logistics / 3PL",
  "rail-trucking": "Rail / Trucking",
  "industrials-manufacturing": "Industrials",
  "aerospace-defense": "Aerospace & defense",
  "real-estate": "Real estate",
  "public-sector": "Public sector",
  "telecom-infra": "Telecom infra",
  "media-streaming": "Media / Streaming",
  "healthcare-providers": "Healthcare providers",
  "health-insurance": "Health insurance",
  "professional-services": "Professional services",
  ecommerce: "E-commerce",
  medtech: "Medtech",
  qsr: "QSR",
  "3pl-warehousing": "3PL / Warehousing",
  d2c: "D2C",
  k12: "K-12",
  reits: "REITs",
  pbm: "PBM",
};

export function label(slug: string | null | undefined): string {
  if (!slug) return "";
  if (SPECIAL[slug]) return SPECIAL[slug];
  const s = slug.replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const CASE_TYPES = [
  "Profitability",
  "Market Entry",
  "Growth/Revenue",
  "M&A/Acquisition",
  "Pricing",
  "New Product/GTM",
  "Cost Reduction/Operations",
  "Market Sizing/Guesstimate",
  "Investment/PE due diligence",
  "Turnaround",
  "Competitive Response",
  "Capacity/Supply Chain",
  "Public Sector/Social Impact",
  "Other",
] as const;

export const QUANT_LABEL: Record<string, string> = { L: "Low", M: "Medium", H: "High" };
