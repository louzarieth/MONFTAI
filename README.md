## 🌟 Live Demo

🔗 [Visit the App on Vercel](https://monftai.vercel.app/)


# 🧠 AI NFT Challenge Generator

This project is a creative NFT minting dApp built on **Monad Testnet** that allows users to:

- Upload **two different images**
- Select a **category** (e.g. Funny, Realistic, Anime, Fantasy, etc.)
- Optionally add a **custom AI prompt**
- Generate a new AI-powered image
- **Mint the generated image as an NFT** stored on IPFS

---

## 🌟 Live Demo

🔗 [Visit the App on Vercel](https://monftai.vercel.app/)

---

## 🧩 How It Works

1. **User Uploads Two Images**
2. **Selects a Category**
3. (Optional) Adds a text prompt
4. The AI combines the inputs to generate a brand-new image
5. The image is uploaded to [nft.storage](https://nft.storage/) (IPFS)
6. The metadata is pinned and the image is minted on Monad Testnet

---

## 🔐 Tech Stack

- **Next.js** (Frontend Framework)
- **IPFS via nft.storage** (Metadata + Image storage)
- **AI Image Generator** (like Stability or Replicate API – plug your preferred provider)
- **Smart Contract** deployed on Monad Testnet using:
  - Solidity
  - Hardhat
  - OpenZeppelin's ERC721URIStorage

---

## 🧪 Smart Contract

- Deployed to: `0x763d26a1FAC91d289Bb648ccB5b31BB247bB7B8c`
- Network: [Monad Testnet](https://monad.xyz/)
- Contract: `AINFT.sol`
- Function: `mintNFT(address to, string tokenURI)`

---

## ⚙️ Environment Variables

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_NFT_STORAGE_KEY=your_nft_storage_api_key
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CONTRACT_ADDRESS=0x763d26a1FAC91d289Bb648ccB5b31BB247bB7B8c
