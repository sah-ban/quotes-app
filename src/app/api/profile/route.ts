import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");
  console.log(`Requested fid: ${fid}`);

  if (!fid) {
    return NextResponse.json({ error: "fid is required" }, { status: 400 });
  }

  try {
    const apiUrl =`https://api.farcaster.xyz/v2/user?fid=${fid}`;
    const response = await axios.get(apiUrl);

    const user = response.data?.result?.user;

    return NextResponse.json({
      fid: user?.fid,
      username: user?.username,
      displayName: user?.displayName,
      bio: user?.profile?.bio?.text,
      location: user?.profile?.location?.description,
      followerCount: user?.followerCount,
      followingCount: user?.followingCount,
      pfp: user?.pfp,
      accountLevel: user?.profile?.accountLevel,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
