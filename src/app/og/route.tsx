import { ImageResponse } from "next/og";
import quotes from "../../components/quotes.json";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(req: Request) {
  try {
    const fontPath = join(process.cwd(), "public", "fonts");
    const font = await readFile(join(fontPath, "Georgia.ttf"));

    const url = new URL(req.url);
    const index = parseInt(url.searchParams.get("q") || "0");
    const currentQuote = quotes[index] || quotes[0];
    if (!currentQuote?.quote) {
      throw new Error("Invalid quote data");
    }
    const [quoteText, author] = currentQuote.quote.split("\n");

    return new ImageResponse(
      (
        <div tw="flex flex-col w-[600px] h-[400px] bg-[#FEEBC8] p-10 justify-center items-center">
          <div tw="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col justify-center items-center">
            <p tw="text-3xl font-['Georgia'] text-gray-800 italic mb-6 leading-relaxed text-center">
            &ldquo;{quoteText}&rdquo;
            </p>
            <p tw="text-xl font-['Georgia'] font-light text-gray-500 text-center">
              {author || "Unknown"}
            </p>
          </div>
        </div>
      ),
      {
        width: 600,
        height: 400,
        fonts: [
          {
            name: "Georgia",
            data: font,
            style: "normal",
          },
        ],
      }
    );
  } catch {
    console.error("OG Image Error:");
    return new Response(`Error generating image`, {
      status: 500,
    });
  }
}
