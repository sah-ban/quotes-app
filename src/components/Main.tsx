import { useState, useEffect } from "react";
import sdk, { type Context } from "@farcaster/miniapp-sdk";
import quotes from "./quotes.json";
import MintButton from "./MintButton";
import Connect from "./Connect";
import { useAccount } from "wagmi";

export default function Main() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();
  const { isConnected } = useAccount();

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

  const handleCast = async () => {
    try {
      await sdk.actions.composeCast({
        embeds: [`${process.env.NEXT_PUBLIC_URL}?q=${randomIndex}`],
      });
    } catch (error) {
      console.error("Error composing cast:", error);
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
          <MintButton q={randomIndex} />
        </div>
      </div>
    </div>
  );
}
