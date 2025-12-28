export async function encryptAES(data: ArrayBuffer) {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return { encrypted, key, iv };
}

export async function decryptAES(encryptedData: ArrayBuffer, keyHex: string): Promise<ArrayBuffer> {
  const iv = new Uint8Array(encryptedData.slice(0, 12));
  const data = encryptedData.slice(12);
  
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  return decrypted;
}

export async function exportKeyToHex(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  const bytes = new Uint8Array(exported);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function ivToHex(iv: Uint8Array): string {
  return Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function combineIvAndEncrypted(iv: Uint8Array, encrypted: ArrayBuffer): Blob {
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return new Blob([combined], { type: 'application/octet-stream' });
}
