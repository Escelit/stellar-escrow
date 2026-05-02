import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { AddressDisplay } from "../components/AddressDisplay";
import type { EscrowData } from "../types";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";

export default function EscrowDetail() {
  const { id } = useParams<{ id: string }>();
  const [escrow, setEscrow] = useState<EscrowData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    // TODO: fetch via EscrowClient.getEscrow() once wallet is connected
    // For now show a placeholder
    setError("Connect a Stellar wallet to load escrow data.");
  }, [id]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Escrow: {id}</h1>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800 mb-4">
          {error}
        </div>
      )}

      {escrow && (
        <div className="bg-white rounded-lg border p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status</span>
            <StatusBadge status={escrow.status} />
          </div>
          <Row label="Depositor" value={<AddressDisplay address={escrow.depositor} />} />
          <Row label="Beneficiary" value={<AddressDisplay address={escrow.beneficiary} />} />
          <Row label="Arbiter" value={<AddressDisplay address={escrow.arbiter} />} />
          <Row label="Amount" value={`${(Number(escrow.amount) / 1e7).toFixed(7)} (scaled)`} />
          <Row
            label="Expires"
            value={new Date(escrow.expiryTs * 1000).toLocaleString()}
          />
        </div>
      )}

      {escrow?.status === "Funded" && (
        <Link
          to={`/escrow/${id}/dispute`}
          className="mt-4 inline-block px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
        >
          Raise Dispute
        </Link>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
