import { NextResponse, NextRequest } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    const fid = req.nextUrl.searchParams.get("fid");
    if (!fid) {
      return NextResponse.json(
        { error: "Missing fid parameter" },
        { status: 400 }
      );
    }

    const hubUrl = process.env.HUB_URL;
    if (!hubUrl) {
      return NextResponse.json(
        { error: "Missing HUB_URL environment variable" },
        { status: 500 }
      );
    }

    const apiResponse = await axios.get(
      `${hubUrl}/v1/storageLimitsByFid?fid=${fid}`,
    );

    const tierSubscriptions = apiResponse.data?.tier_subscriptions;
    if (
      !tierSubscriptions ||
      !Array.isArray(tierSubscriptions) ||
      tierSubscriptions.length === 0
    ) {
      return NextResponse.json(
        { error: "No tier subscriptions found" },
        { status: 404 }
      );
    }

    const { expires_at } = tierSubscriptions[0];

    return NextResponse.json({ expires_at });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
