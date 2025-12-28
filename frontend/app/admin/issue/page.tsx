'use client';
import { useState, useRef } from 'react';
import { ethers } from 'ethers';
import { sha256 } from '@/lib/hash';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import CertificateRegistryABI from "@/contracts/CertificateRegistryABI.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const pinata_api = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const pinata_key = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;

export default function IssueForm() {
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [gelar, setGelar] = useState('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [docHash, setDocHash] = useState('');
  const [storageURI, setStorageURI] = useState('');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const generatePDF = async () => {
    const template = document.createElement('div');
    template.innerHTML = `
        <div style="width: 800px; height: 600px; padding: 50px; font-family: serif; text-align: center; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 20px; position: relative;">
        <h1 style="font-size: 36px; color: #2c3e50; margin-bottom: 30px;">DIPLOMA</h1>
        <h2 style="font-size: 28px; color: #34495e; margin-bottom: 40px;">${gelar}</h2>
        <p style="font-size: 24px; color: #2c3e50; margin-bottom: 20px;">${name}</p>
        <p style="font-size: 20px; color: #7f8c8d;">NIM: ${nim}</p>
        <p style="font-size: 16px; color: #95a5a6; margin-top: 50px;">Issued on ${new Date().toLocaleDateString()}</p>
        </div>
    `;
    
    template.style.position = 'absolute';
    template.style.left = '-9999px';
    document.body.appendChild(template);
    
    const canvas = await html2canvas(template, { 
        scale: 2, 
        useCORS: false,
        allowTaint: true,
        logging: false
    });
    
    document.body.removeChild(template);
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    
    const pdfBlob = pdf.output('blob');
    setPdfBlob(pdfBlob);
    
    // Compute hash
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    setDocHash('0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
    };

  const uploadIPFS = async (blob: Blob) => {
        if (pdfBlob) {
            try {
                const formData = new FormData();
                formData.append("file", pdfBlob);

                const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                    method: "POST",
                    headers: {
                        "pinata_api_key": pinata_api!,
                        "pinata_secret_api_key": pinata_key!,
                    },
                    body: formData,
                }).then(response=>response.json()).then(data=>{ setStorageURI(`ipfs://${data.IpfsHash}`); });
            } catch (error) {
                console.log("Error sending File to IPFS: ")
                console.log(error)
            }
        }
    }

  const signDocument = async () => {
    // Use ethers signer to create EIP-712 signature
    setStatus('Digital signature: Implement signer.signMessage');
  };

  const handleIssue = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS!, CertificateRegistryABI.abi, signer);
      
      const tx = await contract.issueCertificate(docHash, storageURI, signature);
      await tx.wait();
      setStatus('Certificate issued!');
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold">Issue Diploma</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input type="text" placeholder="Nama Mahasiswa" value={name} onChange={(e) => setName(e.target.value)} className="p-3 border rounded" />
        <input type="text" placeholder="NIM" value={nim} onChange={(e) => setNim(e.target.value)} className="p-3 border rounded" />
        <input type="text" placeholder="Gelar" value={gelar} onChange={(e) => setGelar(e.target.value)} className="p-3 border rounded" />
      </div>

      <button onClick={generatePDF} className="bg-blue-500 text-white px-6 py-3 rounded">Generate PDF</button>

        {docHash && (
        <div className="p-3 bg-gray-100 rounded mb-4">
            <strong>PDF Generated - Hash:</strong> {docHash}
        </div>
        )}

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => uploadIPFS(pdfBlob!)} className="bg-green-500 text-white px-6 py-3 rounded">Upload IPFS</button>
        <button onClick={signDocument} className="bg-purple-500 text-white px-6 py-3 rounded">Sign</button>
      </div>

      <button onClick={handleIssue} disabled={loading || !docHash || !storageURI || !signature} 
              className="w-full bg-indigo-600 text-white p-4 rounded font-bold disabled:opacity-50">
        {loading ? 'Issuing...' : 'Issue Certificate'}
      </button>
      
      {status && <p className="p-4 bg-gray-100 rounded">{status}</p>}
    </div>
  );
}

