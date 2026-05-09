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
import Image from "next/image";

const CONTRACTS: Record<number, Address> = {
  [base.id]: "0xb775FC32E4dE4B845A0284152EA76e8b7c46D9f4",
  [arbitrum.id]: "0x43E3DC41c5BEe20360dE17003aa08f9aEAcd64bC",
};

const CHAIN_META: Record<
  number,
  { name: string; color: string; logo: string }
> = {
  [base.id]: { name: "Base", color: "#0052FF", logo: "/base.png" },
  [arbitrum.id]: { name: "Arbitrum", color: "#28A0F0", logo: "/arbitrum.svg" },
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

  return (
    <div className="flex flex-col items-stretch w-[220px] gap-2">
      <div className="flex gap-2">
        {Object.entries(CHAIN_META).map(([chainIdStr, meta]) => {
          const chainId = Number(chainIdStr);
          const active = selectedChainId === chainId;
          return (
            <button
              key={chainId}
              type="button"
              onClick={() => setSelectedChainId(chainId)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={
                active
                  ? { backgroundColor: meta.color, color: "#fff" }
                  : {
                      backgroundColor: "#fff",
                      color: meta.color,
                      border: `2px solid ${meta.color}`,
                    }
              }
            >
              <Image
                src={meta.logo}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4"
              />
              <span>{meta.name}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={handleMintNFT}
        disabled={busy}
        className="bg-[#10B981] hover:bg-[#059669] text-white py-2 rounded-lg transition-all duration-300 font-semibold w-full shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span>
          {isSwitching
            ? "Switching..."
            : isPending
              ? "Processing..."
              : isConfirming
                ? "Minting..."
                : isConfirmed
                  ? "Minted!"
                  : "Mint Quote"}
        </span>
        <Image
          src={CHAIN_META[selectedChainId].logo}
          alt=""
          width={16}
          height={16}
          className="w-4 h-4"
        />
      </button>
    </div>
  );
};

export default MintButton;
