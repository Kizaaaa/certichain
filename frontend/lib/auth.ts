import { getProvider } from "./ethers";

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = getProvider();
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

export async function getConnectedAddress(): Promise<string | null> {
  if (!window.ethereum) {
    return null;
  }

  const provider = getProvider();
  const accounts = await provider.send("eth_accounts", []);
  return accounts[0] || null;
}

export async function requestNonce(address: string): Promise<string> {
  const response = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    throw new Error("Failed to get nonce");
  }

  const data = await response.json();
  return data.nonce;
}

export async function signMessage(message: string): Promise<string> {
  const provider = getProvider();
  const signer = await provider.getSigner();
  return signer.signMessage(message);
}

export async function verifySignature(
  address: string,
  signature: string,
  nonce: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const response = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, signature, nonce }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error };
  }

  return { success: true, token: data.token };
}

export async function loginWithMetaMask(): Promise<{
  success: boolean;
  address?: string;
  token?: string;
  error?: string;
}> {
  try {
    const address = await connectWallet();
    const nonce = await requestNonce(address);
    const message = `Sign this message to authenticate.\n\nNonce: ${nonce}`;
    const signature = await signMessage(message);
    const result = await verifySignature(address, signature, nonce);

    if (result.success && result.token) {
      return { success: true, address, token: result.token };
    }

    return { success: false, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}
