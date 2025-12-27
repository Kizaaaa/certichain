"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import CertificateRegistryABI from "@/contracts/CertificateRegistryABI.json";

export default function ContractTest() {
  const [certCount, setCertCount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo("");
    
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      // Request account access - this will prompt MetaMask to connect
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      
      // Debug info
      const info = `Network: ${network.name} (chainId: ${network.chainId})\nContract Address: ${contractAddress}`;
      setDebugInfo(info);
      console.log(info);
      
      // Sepolia chainId is 11155111
      if (network.chainId !== BigInt(11155111)) {
        throw new Error(`Wrong network! Please switch MetaMask to Sepolia. Current: ${network.name} (${network.chainId})`);
      }

      const contract = new ethers.Contract(
        contractAddress!,
        CertificateRegistryABI.abi,
        provider
      );

      const count = await contract.certCount();
      setCertCount(count.toString());
      console.log("Certificate count:", count.toString());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Contract Connection Test</h2>
      <button
        onClick={testConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Connection"}
      </button>
      
      {debugInfo && (
        <pre className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm whitespace-pre-wrap">
          {debugInfo}
        </pre>
      )}
      
      {certCount !== null && (
        <p className="mt-4 text-green-600">
          ✅ Connected! Certificate count: {certCount}
        </p>
      )}
      
      {error && (
        <p className="mt-4 text-red-600">❌ Error: {error}</p>
      )}
    </div>
  );
}