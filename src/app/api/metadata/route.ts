import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing token ID" }, { status: 400 });
  }

  return NextResponse.json({
    name: "Quotes",
    description: "An NFT of Quotes",
    image: `https://quotes-miniapp.vercel.app/nft?q=${q}`,
    attributes: [],
  });
}
