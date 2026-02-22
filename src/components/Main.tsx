import { useState, useEffect } from "react";
import sdk, { type Context } from "@farcaster/miniapp-sdk";
import quotes from "./quotes.json";
import MintButton from "./MintButton";
import Admin from "./AdminPanel";
import Connect from "./Connect";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address } from "viem";
import { contractABI } from "../contracts/abi.js";
import { blocked } from "./blocked";

export default function Main() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();
  const { isConnected, chainId, address } = useAccount();

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
    sdk.haptics.impactOccurred("light");
    setRandomIndex(newIndex);
  };

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const CONTRACT_ADDRESS =
    "0xF161379Ad4900407C289b3033c7EA1AfB99F8926" as Address;

  const { data: nonce, refetch: refetchNonce } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "fidNonces",
    args: [context?.user.fid],
    query: { enabled: !!context?.user.fid },
  }) as { data: bigint | undefined; refetch: () => void };

  const { data: cooldownRemaining, refetch: refetchCooldown } = useReadContract(
    {
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "getCooldownRemaining",
      args: [context?.user.fid],
      query: { enabled: !!context?.user.fid },
    }
  ) as { data: bigint | undefined; refetch: () => void };

  const { data: cooldownHours } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "cooldownHours",
    query: { enabled: true },
  }) as { data: bigint | undefined };

  const [signature, setSignature] = useState<string | undefined>(undefined);
  const [amount, setAmount] = useState<bigint | undefined>(undefined);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);

  // Set target end time when cooldownRemaining is loaded
  useEffect(() => {
    if (cooldownRemaining !== undefined) {
      const remaining = Number(cooldownRemaining);
      const target = Math.floor(Date.now() / 1000) + remaining;

      // Only update if it's a significant change (more than 5s difference)
      // to avoid jumping on every RPC refetch
      if (!targetEndTime || Math.abs(target - targetEndTime) > 5) {
        setTargetEndTime(target);
        setSecondsLeft(remaining);
      }
    }
  }, [cooldownRemaining, targetEndTime]);

  // Smooth local countdown
  useEffect(() => {
    if (!targetEndTime) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, targetEndTime - now);
      setSecondsLeft(remaining);
    };

    const interval = setInterval(updateTimer, 1000);
    updateTimer(); // Initial call

    return () => clearInterval(interval);
  }, [targetEndTime]);

  // Pre-fetch signature when dependencies change
  useEffect(() => {
    const fetchSignature = async () => {
      if (!context?.user.fid || !address || nonce === undefined) return;

      try {
        const { token } = await sdk.quickAuth.getToken();
        const currentNonce = nonce.toString();

        const res = await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            address: address,
            nonce: currentNonce,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setSignature(data.signature);
          setAmount(BigInt(data.amount));
        }
      } catch (e) {
        console.error("Pre-fetch signature failed", e);
      }
    };

    fetchSignature();
  }, [context?.user.fid]);

  const handleClaim = async () => {
    if (!castHash) {
      handleCast();
    } else {
      if (!context?.user.fid || !address) return;

      let finalSignature = signature;
      let finalAmount = amount;

      if (!finalSignature || !finalAmount) {
        try {
          const { token } = await sdk.quickAuth.getToken();
          const currentNonce = nonce ? nonce.toString() : "0";
          const res = await fetch("/api/auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ address, nonce: currentNonce }),
          });
          if (!res.ok) throw new Error("Failed to fetch signature");
          const data = await res.json();
          finalSignature = data.signature;
          finalAmount = BigInt(data.amount);
        } catch (error) {
          console.error(error);
          alert("Failed to prepare transaction");
          return;
        }
      }

      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: contractABI,
          functionName: "claim",
          args: [BigInt(context.user.fid), finalAmount, finalSignature],
        });
      } catch (error) {
        console.error("Claim failed:", error);
        alert(
          "Failed to claim: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      }
    }
  };

  const canClaim =
    cooldownRemaining !== undefined ? cooldownRemaining === BigInt(0) : true;

  const formatTimeRemaining = (secondsRemaining: bigint | number) => {
    const seconds = Number(secondsRemaining);
    if (seconds <= 0) return "Ready!";

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.length > 0 ? parts.join(" ") : "Ready!";
  };

  useEffect(() => {
    if (isConfirmed) {
      sdk.haptics.notificationOccurred("success");
      refetchNonce();
      refetchCooldown();
    }
  }, [isConfirmed, refetchNonce, refetchCooldown]);

  useEffect(() => {
    if (!context?.client.added && isConfirmed) {
      sdk.actions.addMiniApp();
    }
  }, [context?.client.added, isConfirmed]);

  useEffect(() => {
    if (castHash && canClaim && !isPending && !isConfirming && !isConfirmed) {
      handleClaim();
    }
  }, [castHash]);

  useEffect(() => {
    if (blocked.includes(context?.user.fid || 0)) {
      sdk.actions.close();
    }
  }, [context?.user.fid]);

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
        <header className="flex-none fixed top-0 left-0 w-full z-50">
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
          {context?.client.clientFid === 9152 && (
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
          )}
          <MintButton q={randomIndex} />
        </div>
        {context?.client.clientFid === 9152 && (
          <p className="text-black mt-3">
            Next Claim:{" "}
            {secondsLeft > 0 ? formatTimeRemaining(secondsLeft) : "Ready!"}
          </p>
        )}
        {isConfirmed && (
          <p className="text-lime-600 mt-3">
            You can Claim again in {cooldownHours ? Number(cooldownHours) : 12}{" "}
            hours!
          </p>
        )}
      </div>
    </div>
  );
}
