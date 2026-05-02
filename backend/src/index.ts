import "dotenv/config";
import express from "express";
import cors from "cors";
import escrowRouter from "./routes/escrow";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", escrowRouter);

app.listen(PORT, () => {
  console.log(`stellar-escrow backend running on port ${PORT}`);
});

export default app;
