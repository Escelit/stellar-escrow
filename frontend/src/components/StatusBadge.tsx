import React from "react";
import { EscrowStatus } from "../types";

const STATUS_COLORS: Record<EscrowStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Funded: "bg-blue-100 text-blue-800",
  Released: "bg-green-100 text-green-800",
  Refunded: "bg-gray-100 text-gray-800",
  Disputed: "bg-red-100 text-red-800",
  Resolved: "bg-purple-100 text-purple-800",
};

export function StatusBadge({ status }: { status: EscrowStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
}
