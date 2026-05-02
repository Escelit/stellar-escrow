import type { EscrowTokenSymbol } from "./tokens";

export interface EscrowConfig {
  contractId: string;
  networkPassphrase: string;
  rpcUrl: string;
}

export type EscrowStatus =
  | "Pending"
  | "Funded"
  | "Released"
  | "Refunded"
  | "Disputed"
  | "Resolved";

export interface EscrowData {
  escrowId: string;
  depositor: string;
  beneficiary: string;
  arbiter: string;
  amount: bigint;
  token: string;
  expiryTs: number;
  status: EscrowStatus;
  evidenceHash: string | null;
}

export interface CreateEscrowParams {
  escrowId: string;
  depositor: string;
  beneficiary: string;
  arbiter: string;
  amount: bigint;
  token: string;
  expiryTs: number;
}

export interface CreateTokenEscrowParams
  extends Omit<CreateEscrowParams, "amount" | "token"> {
  amount: string | number;
  tokenContractId: string;
  tokenSymbol?: EscrowTokenSymbol;
  tokenDecimals?: number;
}
