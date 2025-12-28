"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginWithMetaMask, connectWallet } from "@/lib/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [myAddress, setMyAddress] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await loginWithMetaMask();

      if (result.success && result.address && result.token) {
        login(result.address, result.token);
        router.push("/");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAddress = async () => {
    try {
      const address = await connectWallet();
      setMyAddress(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get address");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-8 text-zinc-900 dark:text-white">
          Admin Login
        </h1>

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Signing..." : "Login with MetaMask"}
          </button>

          <button
            onClick={handleCheckAddress}
            className="w-full py-3 px-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            Check My Address
          </button>

          {myAddress && (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Your Sepolia Address:
              </p>
              <p className="text-sm font-mono break-all text-zinc-900 dark:text-white">
                {myAddress}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
          Only authorized admin address can login
        </p>
      </div>
    </div>
  );
}
