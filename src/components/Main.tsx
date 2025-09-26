import { useState, useEffect } from "react";
import sdk, { type Context } from "@farcaster/miniapp-sdk";
import quotes from "./quotes.json";

export default function Main() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();

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

  const cast = async (q: number): Promise<string | undefined> => {
    try {
      const result = await sdk.actions.composeCast({
        text: "GM",
        embeds: [`${process.env.NEXT_PUBLIC_URL}/og?q=${q}`],
      });

      return result.cast?.hash;
    } catch (error) {
      console.error("Error composing cast:", error);
      return undefined;
    }
  };

  const handleCast = async () => {
    await cast(randomIndex);
  };

  const handleRandom = () => {
    let newIndex = Math.floor(Math.random() * quotes.length);
    while (newIndex === randomIndex && quotes.length > 1) {
      newIndex = Math.floor(Math.random() * quotes.length);
    }
    setRandomIndex(newIndex);
  };

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
      className="h-screen bg-slate-800 flex flex-col items-center justify-center"
    >
      <div className="flex flex-col items-center min-h-screen w-full justify-center bg-gradient-to-br from-[#FFF7ED] to-[#FEEBC8] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all hover:shadow-2xl">
          {/* Quote Display with Fade-in Animation and Key */}
          <div key={randomIndex} className="text-center animate-fadeIn">
            <p className="text-xl md:text-2xl font-serif text-gray-800 italic mb-4 leading-relaxed">
              &ldquo;{quoteText}&rdquo;
            </p>
            <p className="text-gray-500 text-lg font-light">
              {author || "Unknown"}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-8 gap-4">
            <button
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-6 py-2 rounded-lg transition-all duration-300 font-medium w-[150px] shadow-md hover:shadow-lg"
              onClick={handleRandom}
            >
              New Quote
            </button>
            <button
              className="bg-[#10B981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg transition-all duration-300 font-medium w-[150px] shadow-md hover:shadow-lg"
              onClick={handleCast}
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
