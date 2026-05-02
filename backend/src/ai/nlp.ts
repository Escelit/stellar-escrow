/**
 * NLP Parser — converts natural language escrow descriptions into structured params.
 *
 * TODO: Replace stub with real OpenAI integration:
 *   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 *   Use function calling / structured output to extract escrow params from text.
 */

export interface ParsedEscrowParams {
  amount?: number;
  currency?: string;
  beneficiary?: string;
  condition?: string;
  expiryDays?: number;
  confidence: number;
}

export async function parseEscrowDescription(
  description: string
): Promise<ParsedEscrowParams> {
  // TODO: integrate OpenAI API — send description to GPT-4 with a structured
  // prompt and use function calling to extract escrow parameters.
  console.log(`[nlp stub] parsing: "${description}"`);

  // Stub: basic regex extraction for demonstration
  const amountMatch = description.match(/(\d+(?:\.\d+)?)\s*(xlm|usdc|usd)?/i);
  const daysMatch = description.match(/(\d+)\s*days?/i);

  return {
    amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
    currency: amountMatch?.[2]?.toUpperCase() ?? "XLM",
    condition: description,
    expiryDays: daysMatch ? parseInt(daysMatch[1]) : 30,
    confidence: 0.6,
    // stub — integrate OpenAI for production use
  };
}
