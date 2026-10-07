import "server-only";

// The in-app AI interviewer is OFF unless BOTH an API key and a positive monthly cap are set.
export function llmEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY && Number(process.env.MONTHLY_SPEND_CAP_USD) > 0;
}
export function monthlyCapUsd(): number {
  return Math.max(0, Number(process.env.MONTHLY_SPEND_CAP_USD) || 0);
}
