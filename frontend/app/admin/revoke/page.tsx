"use client";

import { useState } from "react";
import { ethers } from "ethers";
import CertificateRegistryABI from "@/contracts/CertificateRegistryABI.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function RevokeCertificatePage() {
  const [certificateId, setCertificateId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleRevoke = async () => {
    if (!certificateId || !reason) return;
    
    setLoading(true);
    setStatus('Revoking certificate...');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS!, CertificateRegistryABI.abi, signer);
      
      const tx = await contract.revokeCertificate(BigInt(certificateId), reason);
      const receipt = await tx.wait();
      
      setStatus(`Certificate #${certificateId} revoked successfully!\n\nTransaction: ${receipt.hash}`);
      setCertificateId('');
      setReason('');
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold">Revoke Certificate</h2>
      
      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="Certificate ID" 
          value={certificateId} 
          onChange={(e) => setCertificateId(e.target.value)} 
          className="w-full p-3 border rounded" 
        />
        <textarea 
          placeholder="Alasan Pencabutan" 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          rows={4}
          className="w-full p-3 border rounded resize-none" 
        />
      </div>

      <button 
        onClick={handleRevoke} 
        disabled={loading || !certificateId || !reason} 
        className="w-full bg-red-600 text-white p-4 rounded font-bold disabled:opacity-50 hover:bg-red-700"
      >
        {loading ? status : 'Revoke Certificate'}
      </button>
      
      {status && !loading && <p className="p-4 bg-gray-100 text-black rounded whitespace-pre-wrap break-all">{status}</p>}
    </div>
  );
}
