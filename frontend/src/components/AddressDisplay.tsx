import React from "react";

export function AddressDisplay({ address }: { address: string }) {
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
  return (
    <span title={address} className="font-mono text-sm text-gray-700">
      {short}
    </span>
  );
}
