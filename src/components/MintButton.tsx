import React from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address } from "viem";
import { contractABI } from "../contracts/abi.js";
import { arbitrum } from "wagmi/chains";
import { parseEther } from "viem";

const CONTRACT_ADDRESS =
  "0x9c713a2ADD0Bc8e676623C3300728A995Ac74eD8" as Address;

interface MintButtonProps {
  q: number | string;
}

const MintButton: React.FC<MintButtonProps> = ({ q }) => {
  const { isConnected } = useAccount();

  // Write hook
  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending,
  } = useWriteContract();

  // Track confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleMintNFT = async () => {
    const quantity = typeof q === "string" ? parseInt(q) : q;
    if (isNaN(quantity) || quantity < 0) return;
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "mint",
      args: [BigInt(quantity)],
      value: parseEther("0.00013"),
      chainId: arbitrum.id,
    });
  };

  if (!isConnected) {
    return (
      <div className="text-center text-gray-600 p-6">
        Please connect your wallet to claim tokens.
      </div>
    );
  }

  return (
    <div className="">
      <button
        onClick={handleMintNFT}
        disabled={isPending || isConfirming}
                className="bg-[#F59E0B] hover:bg-[#D97706] text-white py-2 rounded-lg transition-all duration-300 font-semibold w-[150px] shadow-md hover:shadow-lg"
      >
        {isPending
          ? "Processing..."
          : isConfirming
          ? "Minting..."
          : isConfirmed
          ? "Minted!"
          : "Mint Quote"}
      </button>

      {writeError && (
        <p className="text-red-500 text-sm mt-3">Error: {writeError.message}</p>
      )}
    </div>
  );
};

export default MintButton;
