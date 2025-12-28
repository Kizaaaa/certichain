"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useAuth } from "@/context/AuthContext";
import CertificateRegistryABI from "@/contracts/CertificateRegistryABI.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

interface RevokeFormData {
  certificateId: string;
  reason: string;
}

async function revokeCertificate(data: RevokeFormData): Promise<{ success: boolean; error?: string }> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS!, CertificateRegistryABI.abi, signer);
  
  const tx = await contract.revokeCertificate(BigInt(data.certificateId), data.reason);
  await tx.wait();
  
  return { success: true };
}

export default function RevokeCertificatePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<RevokeFormData>({
    certificateId: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">You must be logged in as admin to access this page.</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await revokeCertificate(formData);
      setResult(response);
      
      if (response.success) {
        setFormData({
          certificateId: "",
          reason: "",
        });
      }
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Failed to revoke certificate",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black py-8">
      <div className="w-full max-w-xl p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-8 text-zinc-900 dark:text-white">
          Revoke Certificate
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="certificateId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Certificate ID
            </label>
            <input
              type="text"
              id="certificateId"
              name="certificateId"
              value={formData.certificateId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="-"
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Alasan Pencabutan
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Masukkan alasan pencabutan sertifikat..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Revoking..." : "Revoke Certificate"}
          </button>
        </form>

        {result && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              result.success
                ? "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800"
                : "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800"
            }`}
          >
            {result.success ? (
              <p className="text-green-600 dark:text-green-400 font-medium">Certificate revoked successfully!</p>
            ) : (
              <p className="text-red-600 dark:text-red-400">{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
