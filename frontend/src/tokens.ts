export type TokenSymbol = "XLM" | "USDC";

export interface TokenOption {
  symbol: TokenSymbol;
  name: string;
  decimals: number;
  contractId: string;
}

export const TOKEN_DECIMALS = 7;

export const TOKEN_OPTIONS: TokenOption[] = [
  {
    symbol: "XLM",
    name: "Stellar Lumens",
    decimals: TOKEN_DECIMALS,
    contractId: import.meta.env.VITE_XLM_TOKEN_CONTRACT_ID ?? "native",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: TOKEN_DECIMALS,
    contractId: import.meta.env.VITE_USDC_TOKEN_CONTRACT_ID ?? "",
  },
];

export function tokenOptionFor(symbol: string): TokenOption {
  const token = TOKEN_OPTIONS.find((option) => option.symbol === symbol);
  if (!token) throw new Error(`Unsupported token: ${symbol}`);
  return token;
}

export function parseTokenAmount(
  value: string,
  decimals = TOKEN_DECIMALS
): bigint {
  const raw = value.trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error("Enter a valid non-negative amount.");
  }

  const [whole, fraction = ""] = raw.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Use ${decimals} decimal places or fewer.`);
  }

  return BigInt(`${whole}${fraction.padEnd(decimals, "0")}`);
}
