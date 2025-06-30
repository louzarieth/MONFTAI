import { Wind, Wallet, LogOut } from 'lucide-react';
import Spinner from './Spinner';

const Header = ({ walletAddress, onConnect, onDisconnect }) => {
    return (
        <header className="w-full max-w-5xl flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
                <Wind className="w-8 h-8 text-pink-500"/>
                <h1 className="text-2xl font-bold tracking-tighter">AI NFT Generator</h1>
            </div>
            {walletAddress ? (
                 <div className="flex items-center space-x-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full pl-4 pr-2 py-2">
                     <Wallet className="w-5 h-5 text-green-400" />
                     <span className="text-sm font-mono">{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
                     <button onClick={onDisconnect} className="bg-gray-700 hover:bg-red-600/50 p-1.5 rounded-full transition-colors"><LogOut size={16}/></button>
                 </div>
            ) : (
                <button onClick={onConnect} className="flex items-center justify-center space-x-2 bg-pink-600 hover:bg-pink-700 transition-colors px-4 py-2 rounded-full font-semibold">
                    <Wallet size={20}/>
                    <span>Connect Wallet</span>
                </button>
            )}
        </header>
    );
};

export default Header;
