'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ethers } from 'ethers';
import { decryptAES } from '@/lib/aes';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import CertificateRegistryABI from '@/contracts/CertificateRegistryABI.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

function CertificateViewer() {
  const searchParams = useSearchParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRevoked, setIsRevoked] = useState<boolean | null>(null);

  const certId = searchParams.get('certId');
  const tx = searchParams.get('tx');
  const encfile = searchParams.get('encfile');
  const key = searchParams.get('key');

  useEffect(() => {
    async function checkRevocationStatus() {
      if (!certId) return;
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS!, CertificateRegistryABI.abi, provider);
        const cert = await contract.certificates(BigInt(certId));
        setIsRevoked(cert.revoked);
      } catch (err) {
        console.error('Failed to check revocation status:', err);
      }
    }
    
    checkRevocationStatus();
  }, [certId]);

  useEffect(() => {
    async function loadCertificate() {
      if (!encfile || !key) {
        setError('Missing parameters');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(encfile);
        if (!response.ok) {
          throw new Error('Failed to fetch encrypted file');
        }

        const encryptedData = await response.arrayBuffer();
        const decryptedData = await decryptAES(encryptedData, key);
        
        const pdfDoc = await PDFDocument.load(decryptedData);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const font = await pdfDoc.embedFont(StandardFonts.Courier);
        
        const currentUrl = window.location.href;
        const { height } = firstPage.getSize();
        
        firstPage.drawText('Verify: ' + currentUrl.slice(0, 80), {
          x: 50,
          y: 50,
          size: 6,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        
        if (currentUrl.length > 80) {
          firstPage.drawText(currentUrl.slice(80, 160), {
            x: 50,
            y: 42,
            size: 6,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        
        if (currentUrl.length > 160) {
          firstPage.drawText(currentUrl.slice(160), {
            x: 50,
            y: 34,
            size: 6,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err: any) {
        setError(err.message || 'Failed to decrypt certificate');
      } finally {
        setLoading(false);
      }
    }

    loadCertificate();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [encfile, key]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Decrypting certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {isRevoked !== null && (
          <div className={`mb-4 p-4 rounded-lg ${isRevoked ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800' : 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800'}`}>
            <div className="flex items-center gap-2">
              {isRevoked ? (
                <>
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-bold text-red-600 dark:text-red-400">CERTIFICATE REVOKED</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-green-600 dark:text-green-400">CERTIFICATE VALID</span>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Digital Certificate</h1>
            
            <div className="space-y-2 text-sm">
              {certId && (
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Certificate ID: </span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{certId}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Transaction Hash: </span>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-orange-500 hover:text-orange-600 break-all"
                >
                  {tx}
                </a>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Certificate Link: </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 break-all text-xs">{currentUrl}</span>
              </div>
            </div>
          </div>

          {pdfUrl && (
            <div className="p-4">
              <iframe
                src={pdfUrl}
                className="w-full h-200 border-0 rounded"
                title="Certificate PDF"
              />
            </div>
          )}

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            {pdfUrl && (
              <a
                href={pdfUrl}
                download="certificate.pdf"
                className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
              >
                Download PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IjazahPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    }>
      <CertificateViewer />
    </Suspense>
  );
}
