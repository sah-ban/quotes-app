import { NextRequest, NextResponse } from "next/server";
import { createClient, Errors } from "@farcaster/quick-auth";
import { privateKeyToAccount } from "viem/accounts";
import { blocked } from "../../../components/blocked";
// import axios from "axios";

const quickAuth = createClient();


const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY as `0x${string}`;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as `0x${string}`;

export async function POST(req: NextRequest) {
  // Validate environment configuration
  if (!PRIVATE_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: SIGNER_PRIVATE_KEY missing" },
      { status: 500 }
    );
  }
  if (!CONTRACT_ADDRESS) {
    return NextResponse.json(
      { error: "Server misconfigured: CONTRACT_ADDRESS missing" },
      { status: 500 }
    );
  }

  // Validate Authorization Header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }
  const token = authHeader.split(" ")[1];

  // Verify Quick Auth JWT and extract FID
  let fid: number;
  try {
    let domain = "localhost";
    if (process.env.NEXT_PUBLIC_URL) {
      try {
        domain = new URL(process.env.NEXT_PUBLIC_URL).hostname;
      } catch {
        domain = process.env.NEXT_PUBLIC_URL.replace(/^https?:\/\//, "").split(
          "/"
        )[0];
      }
    }

    const result = await quickAuth.verifyJwt({ token, domain });
    fid = result.sub;
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }

  // Check blocked list
  if (blocked.includes(fid)) {
    return NextResponse.json({ error: "User is blocked" }, { status: 403 });
  }

  // Fetch follower count and assign token amount

  const tokenAmount = 0.11; // Default amount in whole tokens

  // try {
  //   const apiUrl = `https://api.farcaster.xyz/v2/user?fid=${fid}`;
  //   const response = await axios.get(apiUrl);
  //   const followers = response.data?.result?.user?.followerCount || 0;

  //   // Assign token amount based on follower count
  //   if (followers >= 1000) {
  //     tokenAmount = 1;
  //   } else if (followers >= 900) {
  //     tokenAmount = 9;
  //   } else if (followers >= 800) {
  //     tokenAmount = 8;
  //   } else if (followers >= 700) {
  //     tokenAmount = 7;
  //   } else if (followers >= 600) {
  //     tokenAmount = 6;
  //   } else if (followers >= 500) {
  //     tokenAmount = 5;
  //   } else if (followers >= 400) {
  //     tokenAmount = 4;
  //   } else if (followers >= 300) {
  //     tokenAmount = 3;
  //   } else if (followers >= 200) {
  //     tokenAmount = 2;
  //   } else if (followers >= 100) {
  //     tokenAmount = 1;
  //   } else {
  //     tokenAmount = 1;
  //   }
  // } catch (error) {
  //   console.error("Error fetching follower count:", error);
  //   // Default to 1 token if API call fails
  //   tokenAmount = 1;
  // }

  // Convert to wei (18 decimals): amount * 10^18
  const amount = tokenAmount * 10 ** 18;

  // Parse request body
  const body = await req.json();
  const { address, nonce } = body;

  if (!address || nonce === undefined) {
    return NextResponse.json(
      { error: "Missing address or nonce in body" },
      { status: 400 }
    );
  }

  // Generate EIP-712 signature
  const account = privateKeyToAccount(PRIVATE_KEY);

  const domain = {
    name: "Quotes",
    version: "1",
    chainId: 42161,
    verifyingContract: CONTRACT_ADDRESS,
  } as const;

  const types = {
    Claim: [
      { name: "user", type: "address" },
      { name: "fid", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
  } as const;

  try {
    const message = {
      user: address,
      fid: BigInt(fid),
      nonce: BigInt(nonce),
      amount: BigInt(amount),
    };

    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: "Claim",
      message,
    });

    return NextResponse.json({
      signature,
      fid,
      nonce,
      amount,
      signer: account.address,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to sign message" },
      { status: 500 }
    );
  }
}
