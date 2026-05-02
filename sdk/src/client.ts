import {
  Contract,
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Keypair,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import {
  EscrowConfig,
  EscrowData,
  CreateEscrowParams,
  CreateTokenEscrowParams,
} from "./types";
import {
  getEscrowToken,
  parseTokenAmount,
  STELLAR_TOKEN_DECIMALS,
} from "./tokens";

/**
 * EscrowClient — interact with the stellar-escrow contract.
 *
 * Usage:
 *   const client = new EscrowClient(config, keypair);
 *   await client.createEscrow({ escrowId: "e1", ... });
 */
export class EscrowClient {
  private contract: Contract;
  private server: rpc.Server;
  private readKeypair = Keypair.random();

  constructor(
    private config: EscrowConfig,
    private keypair?: Keypair
  ) {
    this.contract = new Contract(config.contractId);
    this.server = new rpc.Server(config.rpcUrl);
  }

  async createEscrow(params: CreateEscrowParams): Promise<string> {
    return this.invoke("create_escrow", [
      nativeToScVal(
        {
          escrow_id: params.escrowId,
          depositor: params.depositor,
          beneficiary: params.beneficiary,
          arbiter: params.arbiter,
          amount: params.amount,
          token: params.token,
          expiry_ts: params.expiryTs,
        },
        { type: "map" }
      ),
    ]);
  }

  async createEscrowWithTokenAmount(
    params: CreateTokenEscrowParams
  ): Promise<string> {
    const token = params.tokenSymbol
      ? getEscrowToken(params.tokenSymbol)
      : undefined;
    const decimals =
      params.tokenDecimals ?? token?.decimals ?? STELLAR_TOKEN_DECIMALS;

    return this.createEscrow({
      escrowId: params.escrowId,
      depositor: params.depositor,
      beneficiary: params.beneficiary,
      arbiter: params.arbiter,
      amount: parseTokenAmount(params.amount, decimals),
      token: params.tokenContractId,
      expiryTs: params.expiryTs,
    });
  }

  async fundEscrow(escrowId: string): Promise<string> {
    return this.invoke("fund_escrow", [
      nativeToScVal(escrowId, { type: "string" }),
    ]);
  }

  async release(escrowId: string, caller: string): Promise<string> {
    return this.invoke("release", [
      nativeToScVal(escrowId, { type: "string" }),
      nativeToScVal(caller, { type: "address" }),
    ]);
  }

  async refund(escrowId: string): Promise<string> {
    return this.invoke("refund", [
      nativeToScVal(escrowId, { type: "string" }),
    ]);
  }

  async dispute(
    escrowId: string,
    evidenceHash: Buffer,
    raisedBy: string
  ): Promise<string> {
    return this.invoke("dispute", [
      nativeToScVal(escrowId, { type: "string" }),
      nativeToScVal(evidenceHash, { type: "bytes" }),
      nativeToScVal(raisedBy, { type: "address" }),
    ]);
  }

  async resolveDispute(
    escrowId: string,
    releaseToBeneficiary: boolean
  ): Promise<string> {
    return this.invoke("resolve_dispute", [
      nativeToScVal(escrowId, { type: "string" }),
      nativeToScVal(releaseToBeneficiary, { type: "bool" }),
    ]);
  }

  async getEscrow(escrowId: string): Promise<EscrowData> {
    const result = await this.simulate("get_escrow", [
      nativeToScVal(escrowId, { type: "string" }),
    ]);
    return this.parseEscrow(result);
  }

  async getEscrowsByDepositor(depositor: string): Promise<string[]> {
    const result = await this.simulate("get_escrows_by_depositor", [
      nativeToScVal(depositor, { type: "address" }),
    ]);
    return scValToNative(result) as string[];
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private async simulate(method: string, args: any[]): Promise<any> {
    const fakeAccount = {
      accountId: () => this.readKeypair.publicKey(),
      sequenceNumber: () => "0",
      incrementSequenceNumber: () => {},
    } as any;

    const tx = new TransactionBuilder(fakeAccount, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      throw new Error(
        `Simulation failed: ${(sim as rpc.Api.SimulateTransactionErrorResponse).error}`
      );
    }
    return (sim as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  }

  private async invoke(method: string, args: any[]): Promise<string> {
    if (!this.keypair) throw new Error("keypair required for write operations");

    const account = await this.server.getAccount(this.keypair.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    prepared.sign(this.keypair);
    const result = await this.server.sendTransaction(prepared);
    if (result.status === "ERROR") {
      throw new Error(`Transaction failed: ${JSON.stringify(result.errorResult)}`);
    }
    return result.hash;
  }

  private parseEscrow(scVal: any): EscrowData {
    const n = scValToNative(scVal) as any;
    return {
      escrowId: n.escrow_id,
      depositor: n.depositor,
      beneficiary: n.beneficiary,
      arbiter: n.arbiter,
      amount: BigInt(n.amount),
      token: n.token,
      expiryTs: Number(n.expiry_ts),
      status: n.status,
      evidenceHash: n.evidence_hash ?? null,
    };
  }
}
