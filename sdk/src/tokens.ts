export type EscrowTokenSymbol = "XLM" | "USDC";

export interface EscrowTokenMetadata {
  symbol: EscrowTokenSymbol;
  name: string;
  decimals: number;
}

export const STELLAR_TOKEN_DECIMALS = 7;

export const ESCROW_TOKENS: readonly EscrowTokenMetadata[] = [
  {
    symbol: "XLM",
    name: "Stellar Lumens",
    decimals: STELLAR_TOKEN_DECIMALS,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: STELLAR_TOKEN_DECIMALS,
  },
] as const;

export function getEscrowToken(symbol: string): EscrowTokenMetadata | undefined {
  return ESCROW_TOKENS.find((token) => token.symbol === symbol.toUpperCase());
}

export function parseTokenAmount(
  value: string | number,
  decimals = STELLAR_TOKEN_DECIMALS
): bigint {
  const raw = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error("amount must be a non-negative decimal number");
  }

  const [whole, fraction = ""] = raw.split(".");
  if (fraction.length > decimals) {
    throw new Error(`amount supports at most ${decimals} decimal places`);
  }

  return BigInt(`${whole}${fraction.padEnd(decimals, "0")}`);
}

export function formatTokenAmount(
  amount: bigint,
  decimals = STELLAR_TOKEN_DECIMALS
): string {
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const padded = absolute.toString().padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}
