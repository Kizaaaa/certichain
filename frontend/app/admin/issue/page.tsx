'use client';
import { useState, useRef } from 'react';
import { ethers } from 'ethers';
import { sha256 } from '@/lib/hash';
import { encryptAES, exportKeyToHex, combineIvAndEncrypted } from '@/lib/aes';
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
  const [aesKey, setAesKey] = useState('');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFullProcess = async () => {
    setLoading(true);
    
    try {
      // Step 1: Generate PDF
      setStatus('Step 1/4: Generating PDF...');
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        
        const issueDate = new Date().toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPos = 30;

        pdf.setFont('times', 'bold');
        pdf.setFontSize(12);
        pdf.text('Kementerian Pendidikan Tinggi, Sains, dan Teknologi', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        
        pdf.setFontSize(13);
        pdf.text('Institut Teknologi Grove', pageWidth / 2, yPos, { align: 'center' });
        yPos += 25;

        pdf.setFont('times', 'normal');
        pdf.setFontSize(11);
        pdf.text('dengan ini menyatakan bahwa', pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;

        pdf.setFont('times', 'bold');
        pdf.setFontSize(14);
        pdf.text(name, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        pdf.setFont('times', 'normal');
        pdf.setFontSize(11);
        pdf.text(`NIM ${nim}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 25;

        const bioText = `lahir di ${tempatLahir}, tanggal ${tanggalLahir}, telah menyelesaikan dengan baik dan sudah memenuhi semua persyaratan pada Program Studi ${prodi}`;
        const splitText = pdf.splitTextToSize(bioText, 150);
        pdf.text(splitText, pageWidth / 2, yPos, { align: 'center' });
        yPos += splitText.length * 5 + 20;

        pdf.text('Oleh sebab itu kepadanya diberikan gelar', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        pdf.setFont('times', 'bold');
        pdf.setFontSize(13);
        pdf.text(gelar, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        pdf.setFont('times', 'normal');
        pdf.setFontSize(11);
        pdf.text('beserta hak dan segala kewajiban yang melekat pada gelar tersebut.', pageWidth / 2, yPos, { align: 'center' });
        yPos = pageHeight - 80;

        pdf.text(`Diberikan di Amphoreus tanggal ${issueDate}`, pageWidth - 30, yPos, { align: 'right' });
        yPos += 25;

        pdf.setFont('times', 'bold');
        pdf.text('Rektor', pageWidth - 30, yPos, { align: 'right' });
        yPos += 30;

        pdf.text('Prof. Dr. Ir. Anaxagoras, M.T.', pageWidth - 30, yPos, { align: 'right' });
        yPos += 6;
        pdf.text('NIP: 33550336', pageWidth - 30, yPos, { align: 'right' });
      
      const generatedPdfBlob = pdf.output('blob');
      setPdfBlob(generatedPdfBlob);
      
      const arrayBuffer = await generatedPdfBlob.arrayBuffer();
      const hash = await sha256(arrayBuffer);
      setDocHash(hash);
      
      // Step 2: Upload to IPFS
      setStatus('Step 2/4: Encrypting and uploading to IPFS...');
      const { encrypted, key, iv } = await encryptAES(arrayBuffer);
      const encryptedBlob = combineIvAndEncrypted(iv, encrypted);
      const keyHex = await exportKeyToHex(key);
      setAesKey(keyHex);
      
      const formData = new FormData();
      formData.append("file", encryptedBlob, `${name}_${nim}_ijazah.enc`);

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          "pinata_api_key": pinata_api!,
          "pinata_secret_api_key": pinata_key!,
        },
        body: formData,
      });
      
      const data = await response.json();
      const ipfsUri = `ipfs://${data.IpfsHash}`;
      setStorageURI(ipfsUri);
      
      // Step 3: Sign document
      setStatus('Step 3/4: Signing document...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const sig = await signer.signMessage(hash);
      setSignature(sig);
      
      // Step 4: Issue certificate on blockchain
      setStatus('Step 4/4: Issuing certificate on blockchain...');
      const contract = new ethers.Contract(CONTRACT_ADDRESS!, CertificateRegistryABI.abi, signer);
      
      const hashBytes32 = '0x' + hash;
      const tx = await contract.issueCertificate(hashBytes32, ipfsUri);
      const receipt = await tx.wait();
      
      const certIssuedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'CertificateIssued';
        } catch {
          return false;
        }
      });
      
      let certId = '';
      if (certIssuedEvent) {
        const parsed = contract.interface.parseLog(certIssuedEvent);
        certId = parsed?.args[0].toString() || '';
      }
      
      const ipfsHash = ipfsUri.replace('ipfs://', '');
      const encFileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      const link = `http://localhost:3000/ijazah?certId=${certId}&tx=${receipt.hash}&encfile=${encodeURIComponent(encFileUrl)}&key=${keyHex}`;
      
      setStatus(`✅ Certificate issued successfully!\n\nCert ID: ${certId}\nTransaction: ${receipt.hash}\n\nLink: ${link}`);
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
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

      <button 
        onClick={handleFullProcess} 
        disabled={loading || !name || !nim || !gelar} 
        className="w-full bg-indigo-600 text-white p-4 rounded font-bold disabled:opacity-50 hover:bg-indigo-700"
      >
        {loading ? status : 'Issue Certificate'}
      </button>
      
      {status && !loading && <p className="p-4 bg-gray-100 text-black rounded whitespace-pre-wrap break-all">{status}</p>}
    </div>
  );
}

