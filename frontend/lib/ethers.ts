import { ethers } from "ethers";

export function getProvider() {
  return new ethers.BrowserProvider(window.ethereum);
}
