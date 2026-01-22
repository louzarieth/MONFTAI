import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Wind, Image as ImageIcon, Zap, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { BrowserProvider, Contract } from 'ethers';
import { GoogleGenAI, Modality } from '@google/genai'; 

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


const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

    const categories = ['Normal', 'Funny', 'Surreal', 'Pixel Art', 'Cartoon', 'Minimalist', 'Horror', '3D Style',];

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
        let toastId = toast.loading("Step 1/2: Generating creative concept...");

        try {
            // Step 1: Generate a creative prompt using gemini-2.0-flash (text only)
            const userSpecificInstructions = prompt ? 
                `The user has provided specific instructions that MUST be followed: "${prompt}"` :
                '';

            const analysisPrompt = `You are a professional art director and AI prompt engineer.

You are given two character images and a scene category: "${category}".
${userSpecificInstructions}

Your task is to write a single, vivid, imaginative prompt that will be used directly in an AI image generator. The prompt must:

- Combine the two characters into a single, shared scene that reflects the selected category
- ${prompt ? `PRIMARY FOCUS: ${prompt}` : 'Invent a new, creative situation or action that logically fits the category'}
- Make sure the characters' appearances remain 90% visually similar to the originals — same face, clothes, colors, style — but their pose or body movement may change naturally to suit the scene
- Describe the environment, atmosphere, interaction, and setting in a way that is visually rich, logically consistent, and tailored to the category
- ${prompt ? 'Make sure to incorporate these specific details from the user' : 'Feel free to be creative with the scene and interaction'}
- Avoid adding random or out-of-context elements that don't support the story or mood

⚠️ Output ONLY the final prompt text — no explanation, no titles, no lists. Write a single descriptive paragraph that can be passed directly into an image generation model.
`;

            const analysisParts = [{ text: analysisPrompt }];
            analysisParts.push({ inlineData: { mimeType: "image/png", data: image1.split(',')[1] } });
            if (image2) analysisParts.push({ inlineData: { mimeType: "image/png", data: image2.split(',')[1] } });
            
            // Generate the creative prompt
            const analysisResponse = await genAI.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [{
                    role: "user",
                    parts: analysisParts
                }]
            });

            const generatedPrompt = analysisResponse.candidates?.[0]?.content?.parts[0]?.text;
            if (!generatedPrompt) {
                throw new Error("Failed to generate creative concept. Please try again.");
            }

            // Step 2: Use the generated prompt + original images to create the final image
            toast.loading("Step 2/2: Creating your image...", { id: toastId });
            
            const imageParts = [
                { text: generatedPrompt },
                { inlineData: { mimeType: "image/png", data: image1.split(',')[1] } }
            ];
            
            if (image2) {
                imageParts.push({ inlineData: { mimeType: "image/png", data: image2.split(',')[1] } });
            }
            
            // Generate the final image
            const response = await genAI.models.generateContent({
                model: "gemini-2.0-flash-preview-image-generation",
                contents: [{
                    role: "user",
                    parts: imageParts
                }],
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE]
                }
            });

            // Process the response
            const candidate = response.candidates?.[0];
            if (!candidate) {
                throw new Error("No valid response from the model");
            }

            // Find the image part in the response
            const imagePart = candidate.content.parts.find(part => part.inlineData);
            
            if (!imagePart?.inlineData) {
                const textPart = candidate.content.parts.find(part => part.text);
                console.error("No image data in response. Text response:", textPart?.text);
                throw new Error("The model did not generate an image. Please try again with different inputs.");
            }
            
            // Set the generated image
            setGeneratedImage(`data:image/png;base64,${imagePart.inlineData.data}`);
            toast.success("Image generated successfully!", { id: toastId });
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
                                <div className="space-y-1">
                                    <input type="text" id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Optional: add details, e.g., 'in a neon city'" className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 focus:ring-pink-500 focus:border-pink-500 transition"/>
                                    <p className="text-xs text-gray-400 mt-1">
                                        <span className="font-medium">Details Text Tips:</span>
                                        <br/>
                                        This field is optional — you don't need it to generate an image.
                                        <br/><br/>
                                        If you'd like to guide the AI more precisely, you can describe extra scene details like:
                                        place, time, mood, actions, character movement, background elements, or anything else you imagine.
                                        <br/><br/>
                                        For best results, follow this structure:
                                        <br/>
                                        "in a [place], during [time/mood], doing [action]"
                                    </p>
                                </div>
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
