export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    frame: {
      version: "1",
      name: "Quotes App",
      iconUrl: `${appUrl}/logo.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og.png`,
      buttonTitle: "view Quotes",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#FEEBC8",
      castShareUrl: appUrl,
      webhookUrl: `${appUrl}/api/webhook`,
      subtitle: "Get inspired with random quotes",
      description:
        "Get inspired with random quotes. Share them on Farcaster with a single tap.",
      primaryCategory: "utility",
      ogImageUrl: `${appUrl}/og.png`,
      tags: ["quotes", "inspiration", "farcaster"],
      heroImageUrl: `${appUrl}/og.png`,
      tagline: "Daily Dose of Inspiration",
      ogTitle: "Quotes App",
      ogDescription:
        "Get inspired with random quotes. Share them on Farcaster with a single tap.",
      requiredChains: ["eip155:8453"],
      baseBuilder: {
        allowedAddresses: ["0x06e5B0fd556e8dF43BC45f8343945Fb12C6C3E90"],
      },
    },
  };

  return Response.json(config);
}
