import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";

export default function CreateEscrow() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    escrowId: "",
    depositor: "",
    beneficiary: "",
    arbiter: "",
    amount: "",
    token: "",
    expiryDays: "30",
    description: "",
  });
  const [nlpResult, setNlpResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function parseDescription() {
    if (!form.description) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/create-from-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: form.description }),
      });
      const data = await res.json();
      setNlpResult(data.params);
      if (data.params.amount) setForm((f) => ({ ...f, amount: String(data.params.amount) }));
    } catch {
      setError("Failed to parse description");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: call EscrowClient.createEscrow() with wallet integration
    alert("Wallet integration coming soon — connect a Stellar wallet to submit.");
    navigate(`/escrow/${form.escrowId}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Escrow</h1>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <label className="block text-sm font-medium mb-1">
          Describe your escrow (AI-assisted)
        </label>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={3}
          placeholder='e.g. "Pay 500 XLM to @alice when the logo design is delivered within 14 days"'
          value={form.description}
          onChange={set("description")}
        />
        <button
          type="button"
          onClick={parseDescription}
          disabled={loading}
          className="mt-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200"
        >
          {loading ? "Parsing…" : "Parse with AI"}
        </button>
        {nlpResult && (
          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded">
            {JSON.stringify(nlpResult, null, 2)}
          </pre>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        {[
          ["Escrow ID", "escrowId", "unique-escrow-id"],
          ["Depositor address", "depositor", "G..."],
          ["Beneficiary address", "beneficiary", "G..."],
          ["Arbiter address", "arbiter", "G..."],
          ["Amount (stroops)", "amount", "5000000000"],
          ["Token contract", "token", "C... (or native)"],
          ["Expiry (days)", "expiryDays", "30"],
        ].map(([label, key, placeholder]) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              className="w-full border rounded p-2 text-sm"
              placeholder={placeholder}
              value={(form as any)[key]}
              onChange={set(key)}
              required
            />
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Create Escrow
        </button>
      </form>
    </div>
  );
}
