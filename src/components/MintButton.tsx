import React, { useEffect, useState } from "react";
import {
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address, parseEther } from "viem";
import { mintABI } from "../contracts/mintAbi.js";
import { base, arbitrum } from "wagmi/chains";
import sdk from "@farcaster/miniapp-sdk";

const CONTRACTS: Record<number, Address> = {
  [base.id]: "0xb775FC32E4dE4B845A0284152EA76e8b7c46D9f4",
  [arbitrum.id]: "0x43E3DC41c5BEe20360dE17003aa08f9aEAcd64bC",
};

interface MintButtonProps {
  q: number | string;
}

const MintButton: React.FC<MintButtonProps> = ({ q }) => {
  const [selectedChainId, setSelectedChainId] = useState<number>(base.id);

  const currentChainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const busy = isPending || isConfirming || isSwitching;

  const handleMintNFT = async () => {
    try {
      if (currentChainId !== selectedChainId) {
        await switchChainAsync({ chainId: selectedChainId });
      }
      await writeContract({
        address: CONTRACTS[selectedChainId],
        abi: mintABI,
        functionName: "mint",
        args: [BigInt(q)],
        value: parseEther("0.00018"),
        chainId: selectedChainId,
      });
    } catch (error) {
      console.error("Mint failed:", error);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      sdk.haptics.notificationOccurred("success");
    }
  }, [isConfirmed]);

  const pillClass = (active: boolean) =>
    `flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-md ${
      active
        ? "bg-[#10B981] text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    } disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="flex flex-col items-stretch w-[150px] gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSelectedChainId(base.id)}
          disabled={busy}
          className={pillClass(selectedChainId === base.id)}
        >
          Base
        </button>
        <button
          type="button"
          onClick={() => setSelectedChainId(arbitrum.id)}
          disabled={busy}
          className={pillClass(selectedChainId === arbitrum.id)}
        >
          Arbitrum
        </button>
      </div>
      <button
        onClick={handleMintNFT}
        disabled={busy}
        className="bg-[#10B981] hover:bg-[#059669] text-white py-2 rounded-lg transition-all duration-300 font-semibold w-full shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSwitching
          ? "Switching..."
          : isPending
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
