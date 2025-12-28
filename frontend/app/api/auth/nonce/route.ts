import { NextResponse } from "next/server";

const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

export async function POST(request: Request) {
  const { address } = await request.json();

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  nonceStore.set(address.toLowerCase(), {
    nonce,
    timestamp: Date.now(),
  });

  setTimeout(() => {
    nonceStore.delete(address.toLowerCase());
  }, 5 * 60 * 1000);

  return NextResponse.json({ nonce });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const stored = nonceStore.get(address.toLowerCase());
  
  if (!stored) {
    return NextResponse.json({ error: "No nonce found" }, { status: 404 });
  }

  return NextResponse.json({ nonce: stored.nonce });
}

export { nonceStore };
