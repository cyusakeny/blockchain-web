import { ethers } from "ethers";
import contractABI from "../contractABI.json";

const contractAddress = "0x39e9C1a2d8C5Ae92B98f4250a7679BDAFF4345dC";

export const getContract = async () => {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  // ✅ Ensure Sepolia connection
  if (network.chainId !== 11155111) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }], // Sepolia chain ID in hex
    });
  }

  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};
