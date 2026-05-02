import React, { useState } from "react";
import { useParams } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";

export default function DisputeForm() {
  const { id } = useParams<{ id: string }>();
  const [evidence, setEvidence] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/api/dispute/analyse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowId: id, evidence }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Failed to get AI analysis");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Raise Dispute — {id}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Evidence</label>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={6}
            placeholder="Describe the dispute. Include any relevant details about what was agreed, what was delivered, and why you are raising this dispute."
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {loading ? "Analysing…" : "Submit & Get AI Analysis"}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-white rounded-lg border p-6">
          <h2 className="font-semibold mb-3">AI Arbiter Recommendation</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Recommendation</span>
              <span
                className={
                  result.recommendation === "release"
                    ? "text-green-700 font-medium"
                    : result.recommendation === "refund"
                    ? "text-red-700 font-medium"
                    : "text-yellow-700 font-medium"
                }
              >
                {result.recommendation}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Confidence</span>
              <span>{(result.confidence * 100).toFixed(0)}%</span>
            </div>
            <p className="text-gray-600 mt-2">{result.reasoning}</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            This is an AI-generated recommendation. The arbiter makes the final decision on-chain.
          </p>
        </div>
      )}
    </div>
  );
}
