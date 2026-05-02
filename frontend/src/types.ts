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
