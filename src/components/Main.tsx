import { useState, useEffect } from "react";
import sdk, { type Context } from "@farcaster/miniapp-sdk";
import quotes from "./quotes.json";
import MintButton from "./MintButton";
import Admin from "./AdminPanel";
import Connect from "./Connect";
import { arbitrum } from "wagmi/chains";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { Address } from "viem";
import { contractABI } from "../contracts/abi.js"; 

export default function Main() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();
  const { isConnected, chainId, address } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const [randomIndex, setRandomIndex] = useState(
    Math.floor(Math.random() * quotes.length)
  );
  const currentQuote = quotes[randomIndex];
  const [quoteText, author] = currentQuote.quote.split("\n");

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      sdk.actions.ready({});
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  const [castHash, setCastHash] = useState<string | null>(null);

  const cast = async (q: number): Promise<string | undefined> => {
    await switchChainAsync({ chainId: arbitrum.id });
    try {
      const result = await sdk.actions.composeCast({
        embeds: [`${process.env.NEXT_PUBLIC_URL}?q=${q}`],
      });

      return result.cast?.hash;
    } catch (error) {
      console.error("Error composing cast:", error);
      return undefined;
    }
  };

  const handleCast = async () => {
    const hash = await cast(randomIndex);
    if (hash) {
      setCastHash(hash);
    }
  };
  const handleRandom = () => {
    let newIndex = Math.floor(Math.random() * quotes.length);
    while (newIndex === randomIndex && quotes.length > 1) {
      newIndex = Math.floor(Math.random() * quotes.length);
    }
    setRandomIndex(newIndex);
  };

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const CONTRACT_ADDRESS =
    "0x9c713a2ADD0Bc8e676623C3300728A995Ac74eD8" as Address;

  const { data: lastClaimed } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "getLastClaimed",
    args: address ? [address] : undefined,
    chainId: arbitrum.id,
  }) as { data: number | undefined };

  const handleClaim = async () => {
    if (!castHash) {
      handleCast();
    } else {
      if (chainId !== arbitrum.id) {
        try {
          await switchChainAsync({ chainId: arbitrum.id });
        } catch (switchError) {
          console.error("Failed to switch chain:", switchError);
          throw new Error(
            `Please manually switch to ${arbitrum.name} in your wallet.`
          );
        }
      }
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: "claim",
        chainId: arbitrum.id,
      });
    }
  };

  const canClaim = lastClaimed
    ? Date.now() / 1000 >= Number(lastClaimed) + 12 * 60 * 60
    : true;

  const formatTimeElapsed = (timestamp: string | number | undefined) => {
    if (!timestamp || timestamp === "never") return "Never";

    const numTimestamp = parseInt(timestamp.toString(), 10);
    if (isNaN(numTimestamp) || numTimestamp <= 0) return "Never";

    const now = Math.floor(Date.now() / 1000);
    const secondsElapsed = now - numTimestamp;

    if (secondsElapsed <= 0) return "Just now";

    const days = Math.floor(secondsElapsed / (24 * 60 * 60));
    const hours = Math.floor((secondsElapsed % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((secondsElapsed % (60 * 60)) / 60);
    const seconds = secondsElapsed % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && parts.length === 0)
      parts.push(`${seconds} sec${seconds !== 1 ? "s" : ""}`);

    return parts.length > 0 ? parts.join(" ") + " ago" : "Just now";
  };

  useEffect(() => {
    if (isConfirmed) {
      sdk.haptics.notificationOccurred("success");
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (!context?.client.added && isConfirmed) {
      sdk.actions.addMiniApp();
    }
  }, [context?.client.added, isConfirmed]);
  
  if (!context)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center justify-center text-white text-2xl p-4">
          <p className="flex items-center justify-center text-center">
            You need to access this mini app from inside a farcaster client
          </p>
          <div
            className="flex items-center justify-center text-center bg-indigo-800 p-3 rounded-lg mt-4 cursor-pointer"
            onClick={() =>
              window.open(
                "https://farcaster.xyz/miniapps/g55PQkYEJNJ5/quotes-app",
                "_blank"
              )
            }
          >
            Open in Farcaster
          </div>
        </div>
      </div>
    );

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gradient-to-br from-[#FFF7ED] to-[#FEEBC8]">
        <Connect />
      </div>
    );
  }

    return (
      <div
        style={{
          paddingTop: context?.client.safeAreaInsets?.top ?? 0,
          paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
          paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
          paddingRight: context?.client.safeAreaInsets?.right ?? 0,
        }}
      >
        <div className="flex flex-col items-center min-h-screen w-full justify-center bg-gradient-to-br from-[#FFF7ED] to-[#FEEBC8] px-4">
          <header className="flex-none fixed top-0 left-0 w-full">
            {context.user.fid === 268438 && (
              <div className="text-center text-black">
                {chainId} <Admin />
              </div>
            )}
          </header>
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all hover:shadow-2xl">
            <div key={randomIndex} className="text-center animate-fadeIn">
              <p className="text-xl md:text-2xl font-serif text-gray-800 italic mb-4 leading-relaxed">
                &ldquo;{quoteText}&rdquo;
              </p>
              <p className="text-gray-500 text-lg font-light">
                {author || "Unknown"}
              </p>
            </div>

            <div className="flex justify-between items-center mt-8 gap-4">
              <button
                className="bg-[#F59E0B] hover:bg-[#D97706] text-white py-2 rounded-lg transition-all duration-300 font-semibold w-[150px] shadow-md hover:shadow-lg"
                onClick={handleRandom}
              >
                New Quote
              </button>
              <button
                className="bg-[#10B981] hover:bg-[#059669] text-white py-2 rounded-lg transition-all duration-300 font-semibold w-[150px] shadow-md hover:shadow-lg"
                onClick={handleCast}
              >
                Share
              </button>
            </div>
          </div>
          <div className="flex flex-row items-center mt-8 gap-4">
            <button
              onClick={handleClaim}
              disabled={!canClaim || isPending || isConfirming || isConfirmed}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white py-2 rounded-lg transition-all duration-300 font-semibold w-[150px] shadow-md hover:shadow-lg"
            >
              {isPending
                ? "Processing..."
                : isConfirming
                ? "Claiming..."
                : isConfirmed
                ? "Claimed!"
                : canClaim
                ? castHash
                  ? "Claim"
                  : "Share to Claim"
                : "Cooldown Active"}
            </button>
            <MintButton q={randomIndex} />
          </div>
          <p className="text-black mt-3">
            Last Claimed: {formatTimeElapsed(lastClaimed)}
          </p>
          {isConfirmed && (
            <p className="text-lime-600 mt-3">
              You can Claim again in 12 hours!
            </p>
          )}
        </div>
      </div>
    );
  }

