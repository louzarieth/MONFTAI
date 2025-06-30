import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Wind, Image as ImageIcon, Zap, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { BrowserProvider, Contract } from 'ethers';

// Add your Pinata API credentials here
// Pinata API keys from environment variables
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;

import Header from '../components/Header';
import ImageUploader from '../components/ImageUploader';
import WalletSelectionModal from '../components/WalletSelectionModal';
import Spinner from '../components/Spinner';

// Main Configuration
// Gemini API key from environment variable
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
// Contract address from environment variable
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const CONTRACT_ABI = [{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"string","name":"tokenURI","type":"string"}],"name":"mintNFT","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const MONAD_TESTNET_CONFIG = {
    chainId: '0x279f',
    chainName: "Monad Testnet",
    rpcUrls: ["https://testnet-rpc.monad.xyz"],
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
};

export default function Home() {
    
    
    const [walletProviders, setWalletProviders] = useState([]);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [walletAddress, setWalletAddress] = useState(null);
    const [signer, setSigner] = useState(null);

    const [image1, setImage1] = useState(null);
    const [image2, setImage2] = useState(null);
    const [category, setCategory] = useState('Normal');
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [isMinting, setIsMinting] = useState(false);
    const [mintedTx, setMintedTx] = useState(null);

    const categories = ['Normal', 'Funny', 'Surreal', 'Pixel Art', 'Cartoon', 'Minimalist', 'Horror'];

    useEffect(() => {
        const handleAnnounceProvider = (event) => {
            setWalletProviders(prev => [...prev, event.detail]);
        };
        window.addEventListener('eip6963:announceProvider', handleAnnounceProvider);
        window.dispatchEvent(new Event('eip6963:requestProvider'));
        return () => window.removeEventListener('eip6963:announceProvider', handleAnnounceProvider);
    }, []);

    const connectWallet = async () => {
    setShowWalletModal(false);
    if (!window.ethereum) {
        return toast.error("MetaMask not detected. Please install MetaMask and try again.");
    }
    // Ensure user is on Monad Testnet
    const monadChainId = '0x279f'; // 10143
    try {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== monadChainId) {
            try {
                await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: monadChainId }] });
                toast.info('Switched to Monad Testnet.');
            } catch (switchError) {
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: monadChainId,
                                chainName: 'Monad Testnet',
                                rpcUrls: ['https://testnet-rpc.monad.xyz'],
                                nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
                                blockExplorerUrls: ['https://explorer.testnet.monad.xyz']
                            }]
                        });
                        toast.info('Monad Testnet added. Please switch and connect again.');
                        return;
                    } catch (addError) {
                        toast.error('Failed to add Monad Testnet to your wallet.');
                        return;
                    }
                } else {
                    toast.error('Please switch to Monad Testnet in your wallet and try again.');
                    return;
                }
            }
        }
        // Request wallet connection
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Connect to MetaMask
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = accounts[0] || (await signer.getAddress());
        setSigner(signer);
        setWalletAddress(address);
        toast.success("Wallet connected!");
    } catch (error) {
        console.error("Failed to connect wallet:", error);
        toast.error(error.message?.split('(')[0] || "Failed to connect.");
    }
};
    
    const disconnectWallet = () => {
        setWalletAddress(null);
        setSigner(null);
        toast.info("Wallet disconnected.");
    };
    
    const handleGenerate = async () => {
        if (!image1) return toast.error("Please upload at least the first image.");
        setIsGenerating(true);
        setGeneratedImage(null);
        const toastId = toast.loading("AI is analyzing your images...");

        try {
            let visionPromptText = `As a creative art director, analyze the provided image(s) and invent a single, unified scene that artistically blends their core elements. Do NOT just place them side-by-side. Based on the category "${category}", describe this new scene.`;
            const parts = [{ text: visionPromptText }];
            parts.push({ inlineData: { mimeType: "image/png", data: image1.split(',')[1] } });
            if (image2) parts.push({ inlineData: { mimeType: "image/png", data: image2.split(',')[1] } });
            
            const geminiPayload = { contents: [{ role: "user", parts }] };
            const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`;
            const geminiResponse = await fetch(geminiApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiPayload) });
            if (!geminiResponse.ok) throw new Error("AI analysis failed.");
            const geminiResult = await geminiResponse.json();
            const imageDescription = geminiResult.candidates[0].content.parts[0].text;
            
            toast.loading("Generating your new image...", { id: toastId });
            
            const styleDescriptions = {
                Normal: 'photorealistic, high detail', Funny: 'hilarious meme style, witty, cartoonish', 'Pixel Art': '16-bit pixel art, retro',
                Surreal: 'dreamy, surreal, abstract', Cartoon: 'modern animated cartoon style', Minimalist: 'bold minimalist style, clean lines',
                Horror: 'spooky horror style, dark atmosphere'
            };
            const finalPrompt = `Concept: ${imageDescription}. User prompt: ${prompt || 'none'}. Style: ${styleDescriptions[category]}.`;
            
            const imagenPayload = { instances: [{ prompt: finalPrompt }], parameters: { "sampleCount": 1 } };
            const imagenApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`;
            const imagenResponse = await fetch(imagenApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(imagenPayload) });
            if (!imagenResponse.ok) throw new Error("AI image generation failed.");
            const imagenResult = await imagenResponse.json();

            if (imagenResult.predictions?.[0]) {
                setGeneratedImage(`data:image/png;base64,${imagenResult.predictions[0].bytesBase64Encoded}`);
                toast.success("Image generated successfully!", { id: toastId });
            } else { throw new Error("No image data received."); }
        } catch (error) {
            console.error("Generation failed:", error);
            toast.error(error.message || "An unknown error occurred.", { id: toastId });
        } finally { setIsGenerating(false); }
    };

    const handleMint = async () => {
    if (!signer) return toast.error("Wallet not connected.");
    if (!generatedImage) return toast.error("Please generate an image first.");

    // Ensure user is on Monad Testnet
    if (window.ethereum) {
        const monadChainId = '0x279f'; // 10143
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== monadChainId) {
            try {
                await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: monadChainId }] });
                toast.info('Switched to Monad Testnet. Please confirm transaction in your wallet.');
            } catch (switchError) {
                // If the chain is not added, add it
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: monadChainId,
                                chainName: 'Monad Testnet',
                                rpcUrls: ['https://testnet-rpc.monad.xyz'],
                                nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
                                blockExplorerUrls: ['https://explorer.testnet.monad.xyz']
                            }]
                        });
                        toast.info('Monad Testnet added. Please switch and confirm transaction in your wallet.');
                        return;
                    } catch (addError) {
                        toast.error('Failed to add Monad Testnet to your wallet.');
                        setIsMinting(false);
                        return;
                    }
                } else {
                    toast.error('Please switch to Monad Testnet in your wallet and try again.');
                    setIsMinting(false);
                    return;
                }
            }
        }
    }

    setIsMinting(true);
    const toastId = toast.loading("Preparing to mint NFT...");
    try {
        const imageBlob = await fetch(generatedImage).then(r => r.blob());
        const imageFile = new File([imageBlob], "nft.png", { type: "image/png" });
        toast.loading("Uploading to IPFS (Pinata)...", { id: toastId });
        const formData = new FormData();
        formData.append("file", imageFile);
        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_API_KEY
            },
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error("Pinata upload failed: " + (data.error?.message || response.statusText));
        }
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
        toast.loading("Awaiting transaction confirmation...", { id: toastId });
        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const transaction = await contract.mintNFT(walletAddress, ipfsUrl);
        toast.loading("Minting NFT on the blockchain...", { id: toastId });
        await transaction.wait();
        setMintedTx(transaction.hash);
        toast.success("NFT minted successfully!", { id: toastId });
    } catch (error) {
        console.error("Minting failed:", error);
        toast.error(error.message?.split('(')[0] || "Minting failed.", { id: toastId });
    } finally { setIsMinting(false); }
}

    return (
        <>
            <Toaster position="top-center" richColors />
            {showWalletModal && (
                <WalletSelectionModal providers={walletProviders} onSelect={connectWallet} onClose={() => setShowWalletModal(false)} />
            )}
            <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
                <Header 
                    walletAddress={walletAddress} 
                    onConnect={() => setShowWalletModal(true)} 
                    onDisconnect={disconnectWallet}
                />

                <main className="w-full max-w-5xl mt-10 flex-grow">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Generation Section */}
                        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700">
                            <div className="flex items-center space-x-3 mb-6"><div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center font-bold text-xl">1</div><h2 className="text-2xl font-bold">Create Your Image</h2></div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ImageUploader onImageUpload={setImage1} id="img1" text="Upload Image 1" />
                                    <ImageUploader onImageUpload={setImage2} id="img2" text="Upload Image 2" />
                                </div>
                                <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500 transition">
                                    {categories.map(cat => <option key={cat}>{cat}</option>)}
                                </select>
                                <input type="text" id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Optional: add details, e.g., 'in a neon city'" className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500 transition"/>
                                <button onClick={handleGenerate} disabled={isGenerating} className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isGenerating ? <Spinner /> : <Zap size={20}/>}
                                    <span>{isGenerating ? 'Generating...' : 'Generate Image'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Minting Section */}
                        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700">
                            <div className="flex items-center space-x-3 mb-6"><div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center font-bold text-xl">2</div><h2 className="text-2xl font-bold">Mint Your NFT</h2></div>
                            <div className="flex flex-col items-center justify-center h-full space-y-6">
                                <div className="w-full aspect-square rounded-xl bg-white/5 flex items-center justify-center flex-col text-gray-400 border-2 border-dashed border-gray-600">
                                    {generatedImage ? <img src={generatedImage} alt="Generated NFT" className="w-full h-full object-cover" /> :
                                        isGenerating ? (<><Spinner /><p className="mt-2 text-sm">AI is thinking...</p></>) :
                                        (<><ImageIcon className="w-12 h-12 mb-2" /><p>Your generated image will appear here</p></>)
                                    }
                                </div>
                                 <button onClick={handleMint} disabled={isMinting || !walletAddress || !generatedImage} className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 transition-colors text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isMinting ? <Spinner /> : <ImageIcon size={20} />}
                                    <span>{isMinting ? 'Minting...' : 'Mint NFT'}</span>
                                 </button>
                                {mintedTx && (
                                    <div className="w-full p-4 bg-green-900/50 border border-green-500 rounded-lg text-center">
                                        <div className="flex items-center justify-center space-x-2 text-green-300"><CheckCircle size={20} /><h3 className="font-semibold">Minting Successful!</h3></div>
                                        <a href={`${MONAD_TESTNET_CONFIG.blockExplorerUrls[0]}/tx/${mintedTx}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center space-x-1 text-sm text-pink-400 hover:text-pink-300 underline">
                                            <span>View on Monad Explorer</span><LinkIcon size={16}/>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="w-full max-w-5xl text-center py-6 text-gray-500 text-sm"><p>Powered by Monad, NFT.Storage, and Google AI</p></footer>
            </div>
        </>
    );
}