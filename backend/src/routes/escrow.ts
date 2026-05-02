import { Router, Request, Response } from "express";
import { analyseDispute } from "../ai/arbiter";
import { parseEscrowDescription } from "../ai/nlp";

const router = Router();

/**
 * POST /api/escrow/create-from-text
 * Parse a natural language description into escrow parameters.
 */
router.post("/escrow/create-from-text", async (req: Request, res: Response) => {
  const { description } = req.body as { description?: string };
  if (!description) {
    res.status(400).json({ error: "description is required" });
    return;
  }
  try {
    const params = await parseEscrowDescription(description);
    res.json({ params });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * POST /api/dispute/analyse
 * Analyse dispute evidence and return AI arbiter recommendation.
 */
router.post("/dispute/analyse", async (req: Request, res: Response) => {
  const { escrowId, evidence } = req.body as {
    escrowId?: string;
    evidence?: string;
  };
  if (!escrowId || !evidence) {
    res.status(400).json({ error: "escrowId and evidence are required" });
    return;
  }
  try {
    const result = await analyseDispute(escrowId, evidence);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /api/escrow/:id
 * Fetch escrow state from chain via SDK.
 * TODO: wire up EscrowClient once CONTRACT_ID and RPC_URL are configured.
 */
router.get("/escrow/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: const client = new EscrowClient({ contractId: process.env.CONTRACT_ID!, ... });
  // TODO: const data = await client.getEscrow(id);
  res.status(501).json({
    error: "not implemented",
    message: "Set CONTRACT_ID and RPC_URL in .env, then wire up EscrowClient here.",
    escrowId: id,
  });
});

export default router;
