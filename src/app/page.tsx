import { Metadata } from "next";
import App from "~/app/app";

const appUrl = process.env.NEXT_PUBLIC_URL;

export const revalidate = 300;

interface Props {
  searchParams: Promise<{
    q: number;
  }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams;

  const frame = {
    version: "next",
    imageUrl: q ? `${appUrl}/og?q=${q}` : `${appUrl}/og.png`,
    button: {
      title: "view Quotes",
      action: {
        type: "launch_frame",
        name: "Quotes App",
        url: `${appUrl}`,
        splashImageUrl: `${appUrl}/splash.png`,
        splashBackgroundColor: "#FEEBC8",
      },
    },
  };

  return {
    title: "Quotes App",
    openGraph: {
      title: "Quotes App",
      description: "Get inspired with random quotes",
            images: [
        {
          url: q ? `${appUrl}/og?q=${q}` : `${appUrl}/og.png`,
          width: 1200,
          height: 630,
          alt: "Quotes",
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
