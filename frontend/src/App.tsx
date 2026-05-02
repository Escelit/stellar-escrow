import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import CreateEscrow from "./pages/CreateEscrow";
import EscrowDetail from "./pages/EscrowDetail";
import DisputeForm from "./pages/DisputeForm";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b px-6 py-4 flex gap-6 items-center">
          <span className="font-bold text-lg text-indigo-600">Stellar Escrow</span>
          <Link to="/" className="text-gray-600 hover:text-indigo-600">
            Create
          </Link>
          <Link to="/escrow/lookup" className="text-gray-600 hover:text-indigo-600">
            Lookup
          </Link>
        </nav>
        <main className="max-w-2xl mx-auto py-10 px-4">
          <Routes>
            <Route path="/" element={<CreateEscrow />} />
            <Route path="/escrow/:id" element={<EscrowDetail />} />
            <Route path="/escrow/:id/dispute" element={<DisputeForm />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
