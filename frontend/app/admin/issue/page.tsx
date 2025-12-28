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
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [prodi, setProdi] = useState('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [docHash, setDocHash] = useState('');
  const [storageURI, setStorageURI] = useState('');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const generatePDF = async () => {
    const template = document.createElement('div');
        template.innerHTML = `
            <div style="width: 800px; height: 1000px; padding: 60px; font-family: 'Times New Roman', serif; background: white; position: relative;">
            <!-- Header & Content -->
            <div style="text-align: center; margin-bottom: 60px;">
                <p style="font-size: 14px; margin: 0 0 5px 0; font-weight: bold;">Kementerian Pendidikan Tinggi, Sains, dan Teknologi</p>
                <p style="font-size: 16px; margin: 0 0 30px 0; font-weight: bold;">Institut Teknologi Grove</p>
            </div>

            <div style="text-align: center; margin-bottom: 40px;">
                <p style="font-size: 13px; margin: 0 0 20px 0;">dengan ini menyatakan bahwa</p>
            </div>

            <div style="text-align: center; margin-bottom: 40px;">
                <p style="font-size: 20px; margin: 0 0 10px 0; font-weight: bold;">${name}</p>
                <p style="font-size: 13px; margin: 0;">NIM ${nim}</p>
            </div>

            <div style="text-align: center; margin-bottom: 40px; line-height: 1.8;">
                <p style="font-size: 13px; margin: 0;">lahir di ${tempatLahir || '___________'}, tanggal ${tanggalLahir || '___________'}, telah menyelesaikan dengan baik dan sudah memenuhi semua persyaratan pada Program Studi ${prodi || '___________'}</p>
            </div>

            <div style="text-align: center; margin-bottom: 40px;">
                <p style="font-size: 13px; margin: 0 0 15px 0;">Oleh sebab itu kepadanya diberikan gelar</p>
                <p style="font-size: 18px; margin: 0; font-weight: bold;">${gelar}</p>
                <p style="font-size: 13px; margin: 15px 0 0 0;">beserta hak dan segala kewajiban yang melekat pada gelar tersebut.</p>
                <p style="font-size: 13px; margin: 0 0 60px 0;">Diberikan di Amphoreus tanggal ${new Date().toLocaleDateString()}</p>
            </div>

            <!-- Right Aligned Section -->
            <div style="text-align: right; margin-top: 80px; margin-right: 40px;">
                <p style="font-size: 13px; margin: 0 0 80px 0; font-weight: bold;">Rektor</p>
                
                <p style="font-size: 13px; margin: 0 0 5px 0; font-weight: bold;">Prof. Dr. Ir. Anaxagoras, M.T.</p>
                <p style="font-size: 13px; margin: 0;">NIP: 33550336</p>
            </div>
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
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    
    const pdfBlob = pdf.output('blob');
    setPdfBlob(pdfBlob);
    
    // Compute hash
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const hash = await sha256(arrayBuffer)
    setDocHash(hash);
    };

  const uploadIPFS = async (blob: Blob) => {
        if (pdfBlob) {
            try {
                const formData = new FormData();
                formData.append("file", pdfBlob, `${name}_${nim}_ijazah`);

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
        <input type="text" placeholder="Tempat Lahir Mahasiswa" value={tempatLahir} onChange={(e) => setTempatLahir(e.target.value)} className="p-3 border rounded" />
        <input type="text" placeholder="Tanggal Lahir Mahasiswa" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} className="p-3 border rounded" />
        <input type="text" placeholder="Program Studi" value={prodi} onChange={(e) => setProdi(e.target.value)} className="p-3 border rounded" />
        <input type="text" placeholder="Gelar" value={gelar} onChange={(e) => setGelar(e.target.value)} className="p-3 border rounded" />
      </div>

      <button onClick={generatePDF} className="bg-blue-500 text-white px-6 py-3 rounded">Generate PDF</button>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => uploadIPFS(pdfBlob!)} className="bg-blue-500 text-white px-6 py-3 rounded">Upload IPFS</button>
        <button onClick={signDocument} className="bg-blue-500 text-white px-6 py-3 rounded">Sign</button>
      </div>

      <button onClick={handleIssue} disabled={loading || !docHash || !storageURI || !signature} 
              className="w-full bg-indigo-600 text-white p-4 rounded font-bold disabled:opacity-50">
        {loading ? 'Issuing...' : 'Issue Certificate'}
      </button>
      
      {status && <p className="p-4 bg-gray-100 rounded">{status}</p>}
    </div>
  );
}

