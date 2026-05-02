import { Networks } from "@stellar/stellar-sdk";
import { EscrowClient } from "../src/client";
import { formatTokenAmount, parseTokenAmount } from "../src/tokens";

const CONFIG = {
  contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
  networkPassphrase: Networks.TESTNET,
  rpcUrl: "https://soroban-testnet.stellar.org",
};

const mockServer = {
  simulateTransaction: jest.fn(),
  getAccount: jest.fn(),
  prepareTransaction: jest.fn(),
  sendTransaction: jest.fn(),
};

function makeClient() {
  const client = new EscrowClient(CONFIG);
  (client as any).server = mockServer;
  return client;
}

beforeEach(() => jest.clearAllMocks());

describe("EscrowClient read operations", () => {
  test("getEscrow throws on simulation error", async () => {
    mockServer.simulateTransaction.mockResolvedValue({
      error: "escrow not found",
      latestLedger: 100,
    });
    await expect(makeClient().getEscrow("e1")).rejects.toThrow("Simulation failed");
  });

  test("getEscrowsByDepositor throws on simulation error", async () => {
    mockServer.simulateTransaction.mockResolvedValue({
      error: "rpc error",
      latestLedger: 100,
    });
    const { Keypair } = require("@stellar/stellar-sdk");
    const validAddress = Keypair.random().publicKey();
    await expect(
      makeClient().getEscrowsByDepositor(validAddress)
    ).rejects.toThrow("Simulation failed");
  });
});

describe("EscrowClient write operations", () => {
  test("invoke throws without keypair", async () => {
    await expect(makeClient().fundEscrow("e1")).rejects.toThrow(
      "keypair required"
    );
  });

  test("invoke throws on transaction error", async () => {
    const { Keypair } = require("@stellar/stellar-sdk");
    const keypair = Keypair.random();
    const client = new EscrowClient(CONFIG, keypair);
    (client as any).server = mockServer;

    mockServer.getAccount.mockResolvedValue({
      accountId: () => keypair.publicKey(),
      sequenceNumber: () => "0",
      incrementSequenceNumber: () => {},
    });
    mockServer.prepareTransaction.mockResolvedValue({ sign: jest.fn() });
    mockServer.sendTransaction.mockResolvedValue({
      status: "ERROR",
      errorResult: { message: "contract error" },
    });

    await expect(client.fundEscrow("e1")).rejects.toThrow("Transaction failed");
  });

  test("invoke succeeds and returns hash", async () => {
    const { Keypair } = require("@stellar/stellar-sdk");
    const keypair = Keypair.random();
    const client = new EscrowClient(CONFIG, keypair);
    (client as any).server = mockServer;

    mockServer.getAccount.mockResolvedValue({
      accountId: () => keypair.publicKey(),
      sequenceNumber: () => "0",
      incrementSequenceNumber: () => {},
    });
    mockServer.prepareTransaction.mockResolvedValue({ sign: jest.fn() });
    mockServer.sendTransaction.mockResolvedValue({
      status: "PENDING",
      hash: "txhash123",
    });

    const hash = await client.fundEscrow("e1");
    expect(hash).toBe("txhash123");
  });

  test("createEscrowWithTokenAmount converts USDC display amount", async () => {
    const client = makeClient();
    const createEscrow = jest
      .spyOn(client, "createEscrow")
      .mockResolvedValue("txhash123");

    const hash = await client.createEscrowWithTokenAmount({
      escrowId: "e1",
      depositor: "GDEPOSITOR",
      beneficiary: "GBENEFICIARY",
      arbiter: "GARBITER",
      amount: "12.3456789",
      tokenContractId: "CUSDC",
      tokenSymbol: "USDC",
      expiryTs: 1777743556,
    });

    expect(hash).toBe("txhash123");
    expect(createEscrow).toHaveBeenCalledWith({
      escrowId: "e1",
      depositor: "GDEPOSITOR",
      beneficiary: "GBENEFICIARY",
      arbiter: "GARBITER",
      amount: 123456789n,
      token: "CUSDC",
      expiryTs: 1777743556,
    });
  });
});

describe("token amount helpers", () => {
  test("parseTokenAmount converts XLM/USDC decimals to contract units", () => {
    expect(parseTokenAmount("1")).toBe(10000000n);
    expect(parseTokenAmount("1.23")).toBe(12300000n);
    expect(parseTokenAmount("0.0000001")).toBe(1n);
  });

  test("parseTokenAmount rejects values with too many decimals", () => {
    expect(() => parseTokenAmount("0.00000001")).toThrow(
      "at most 7 decimal places"
    );
  });

  test("formatTokenAmount converts contract units back to a display amount", () => {
    expect(formatTokenAmount(12300000n)).toBe("1.23");
    expect(formatTokenAmount(1n)).toBe("0.0000001");
  });
});
