# Quotes

A Farcaster Mini App for sharing inspirational quotes and minting them as NFTs.

## ✨ Features

- **Discover Quotes** – Browse a collection of inspirational quotes with a single tap.
- **Share to Farcaster** – Cast your favorite quotes directly to your Farcaster feed.
- **Mint as NFT** – Mint any quote as an on-chain NFT on Base for 0.00018 ETH.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) + [React 19](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Blockchain**: [wagmi](https://wagmi.sh/) + [viem](https://viem.sh/) on Base
- **Farcaster**: [@farcaster/miniapp-sdk](https://docs.farcaster.xyz/)

## 📦 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/sah-ban/quotes-app.git
cd quotes-app
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable             | Description                               |
| -------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_URL`    | Your deployed app URL                     |
| `KV_REST_API_URL`    | Upstash Redis REST API URL                |
| `KV_REST_API_TOKEN`  | Upstash Redis REST API token              |
| `KEY`                | Secret key for protecting API routes      |
| `NEYNAR_API_KEY`     | Neynar API key for webhook verification   |

````
### 4. Run Development Server

```bash
yarn dev
````

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Preview with Cloudflare tunnel

To test on a Farcaster client:

```bash
cloudflared tunnel run yourapp
```

Use the tunnel URL in the [Farcaster Developer Tools](https://farcaster.xyz/~/developers/mini-apps/preview).

## 📜 Smart Contracts

| Contract | Address                                      | Chain |
| -------- | -------------------------------------------- | ----- |
| Mint     | `0xb775FC32E4dE4B845A0284152EA76e8b7c46D9f4` | Base  |

## 🔌 API Routes

### `POST /api/webhook`

Handles Farcaster miniapp lifecycle events.

- **Events**:
  - `miniapp_added` – Stores notification token in Redis and sends a welcome notification.
  - `miniapp_removed` – Deletes notification token.
  - `notifications_enabled` – Stores token and sends confirmation.
  - `notifications_disabled` – Deletes token.
- **Verification**: Uses Neynar to verify app key signatures.

### `POST /api/send-notifications`

Broadcasts notifications to all subscribed users.

- **Query**: `?key=<your-KEY-env-var>` for authorization.
- **Body**: `{ title: string, body: string, targetUrl: string }`
- **Response**: `{ message: string, rateLimitedTokens: string[] }`

## 📁 Project Structure

```
src/
├── app/           # Next.js pages & API routes
├── components/    # React components (Main, MintButton, Connect)
├── contracts/     # Solidity contracts & ABIs
└── lib/           # Utilities (kv, notifs)
```

## 📄 License

MIT

---

Built by [@cashlessman.eth](https://farcaster.xyz/cashlessman.eth)
