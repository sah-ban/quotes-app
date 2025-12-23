import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "fid is required" }, { status: 400 });
  }

  try {
    const apiUrl = `https://api.farcaster.xyz/v2/user?fid=${fid}`;
    const response = await axios.get(apiUrl);

    const followers = response.data?.result?.user?.followerCount;

    return NextResponse.json({
      followers,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
