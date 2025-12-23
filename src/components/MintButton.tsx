import React from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address } from "viem";
import { mintABI } from "../contracts/mintAbi.js";
import { arbitrum } from "wagmi/chains";
import { parseEther } from "viem";
import { useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";

const CONTRACT_ADDRESS =
  "0x43E3DC41c5BEe20360dE17003aa08f9aEAcd64bC" as Address;

interface MintButtonProps {
  q: number | string;
}

const MintButton: React.FC<MintButtonProps> = ({ q }) => {

  // Write hook
  const {
    writeContract,
    data: hash,
    isPending,
  } = useWriteContract();

  // Track confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleMintNFT = async () => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: mintABI,
      functionName: "mint",
      args: [BigInt(q)],
      value: parseEther("0.00018"),
      chainId: arbitrum.id,
    });
  };
  
  useEffect(() => {
    if (isConfirmed) {
      sdk.haptics.notificationOccurred("success");
    }
  }, [isConfirmed]);

  return (
    <div className="">
      <button
        onClick={handleMintNFT}
        disabled={isPending || isConfirming}
        className="bg-[#10B981] hover:bg-[#059669] text-white py-2 rounded-lg transition-all duration-300 font-semibold w-[150px] shadow-md hover:shadow-lg"
      >
        {isPending
          ? "Processing..."
          : isConfirming
          ? "Minting..."
          : isConfirmed
          ? "Minted!"
          : "Mint Quote"}
      </button>
    </div>
  );
};

export default MintButton;
