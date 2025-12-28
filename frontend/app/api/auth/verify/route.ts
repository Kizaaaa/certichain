import { NextResponse } from "next/server";
import { ethers } from "ethers";

const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

export async function POST(request: Request) {
  const { address, signature, nonce } = await request.json();

  if (!address || !signature || !nonce) {
    return NextResponse.json(
      { error: "Address, signature, and nonce are required" },
      { status: 400 }
    );
  }

  const adminAddress = process.env.ADMIN_PUBLIC_ADDRESS;
  
  if (!adminAddress) {
    return NextResponse.json(
      { error: "Admin address not configured" },
      { status: 500 }
    );
  }

  if (address.toLowerCase() !== adminAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Unauthorized address" },
      { status: 403 }
    );
  }

  const message = `Sign this message to authenticate.\n\nNonce: ${nonce}`;
  
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    nonceStore.delete(address.toLowerCase());

    const token = Buffer.from(
      JSON.stringify({
        address: address.toLowerCase(),
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })
    ).toString("base64");

    return NextResponse.json({
      success: true,
      token,
      address: address.toLowerCase(),
    });
  } catch {
    return NextResponse.json(
      { error: "Signature verification failed" },
      { status: 401 }
    );
  }
}
