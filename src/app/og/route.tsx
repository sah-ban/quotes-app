import { ImageResponse } from "next/og";
import quotes from "../../components/quotes.json";

// Function to fetch font files
const fetchFont = async (fontName: string) => {
  const fontUrl = `${process.env.NEXT_PUBLIC_URL}/fonts/${fontName}`; 
  console.log(fontUrl)
  try {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${fontName}`);
    }
    return await response.arrayBuffer();
  } catch (err) {
    console.error(`Font fetch error for ${fontName}:`, err);
    throw err;
  }
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const index = parseInt(url.searchParams.get("q") || "0");
    const currentQuote = quotes[index] || quotes[0];

    if (!currentQuote?.quote) {
      throw new Error("Invalid quote data");
    }

    const [quoteText, author] = currentQuote.quote.split("\n");

    // Load both regular and italic font variants
    const georgiaRegular = await fetchFont("Georgia.TTF"); // Regular font file
    const georgiaItalic = await fetchFont("Georgia-Italic.ttf");   // Italic font file

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "600px",
            height: "400px",
            backgroundColor: "#FEEBC8",
            padding: "40px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "16px",
              boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: "500px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontSize: "24px",
                fontFamily: "'Georgia', serif",
                fontStyle: "italic",
                color: "#1F2937",
                marginBottom: "24px",
                lineHeight: "1.5",
                textAlign: "center",
              }}
            >
              &ldquo;{quoteText}&rdquo;
            </p>
            <p
              style={{
                fontSize: "18px",
                fontFamily: "'Georgia', serif",
                fontWeight: "300",
                color: "#6B7280",
                textAlign: "center",
              }}
            >
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
            data: georgiaRegular,
            style: "normal",
            weight: 400,
          },
          {
            name: "Georgia",
            data: georgiaItalic,
            style: "italic",
            weight: 400,
          },
        ],
      }
    );
  } catch (err) {
    console.error("OG Image Error:", err);
    return new Response("Error generating image", { status: 500 });
  }
}