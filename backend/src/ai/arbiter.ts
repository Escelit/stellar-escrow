/**
 * AI Arbiter — analyses dispute evidence and recommends release or refund.
 *
 * TODO: Replace stub with real OpenAI integration:
 *   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 *   const response = await openai.chat.completions.create({ ... });
 */

export interface ArbiterResult {
  recommendation: "release" | "refund" | "insufficient_evidence";
  confidence: number; // 0–1
  reasoning: string;
}

export async function analyseDispute(
  escrowId: string,
  evidenceText: string
): Promise<ArbiterResult> {
  // TODO: integrate OpenAI API — send evidenceText to GPT-4 with a structured
  // prompt asking it to evaluate the dispute and return a recommendation.
  console.log(`[arbiter stub] analysing dispute for escrow ${escrowId}`);

  // Stub: simple keyword heuristic for demonstration
  const lower = evidenceText.toLowerCase();
  if (lower.includes("delivered") || lower.includes("completed")) {
    return {
      recommendation: "release",
      confidence: 0.75,
      reasoning:
        "Evidence suggests work was delivered. Recommend releasing funds to beneficiary. (stub — integrate OpenAI for production)",
    };
  }
  if (lower.includes("fraud") || lower.includes("scam") || lower.includes("not delivered")) {
    return {
      recommendation: "refund",
      confidence: 0.7,
      reasoning:
        "Evidence suggests non-delivery or fraud. Recommend refunding depositor. (stub — integrate OpenAI for production)",
    };
  }
  return {
    recommendation: "insufficient_evidence",
    confidence: 0.5,
    reasoning:
      "Evidence is ambiguous. Human arbiter review required. (stub — integrate OpenAI for production)",
  };
}
