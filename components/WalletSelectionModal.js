import { useEffect } from 'react';
import { X } from 'lucide-react';
import Spinner from './Spinner';

const WalletSelectionModal = ({ providers, onSelect, onClose }) => {
    // This effect handles the case where no wallets are found after a brief search period.
    useEffect(() => {
        const timer = setTimeout(() => {
            if (providers.length === 0) {
                toast.error("No EIP-6963 compatible wallet detected. Please install a wallet like MetaMask or Rabby.");
                onClose();
            }
        }, 2000); // Wait 2 seconds for providers to announce themselves.
        return () => clearTimeout(timer);
    }, [providers, onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Connect a Wallet</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    {providers.length > 0 ? (
                        providers.map(({ info, provider }) => (
                            <button key={info.uuid} onClick={() => onSelect(provider)} className="w-full flex items-center p-3 space-x-4 bg-gray-700 hover:bg-pink-600/50 rounded-lg transition-colors">
                                <img src={info.icon} alt={info.name} className="w-10 h-10 rounded-md" />
                                <span className="font-semibold text-lg">{info.name}</span>
                            </button>
                        ))
                    ) : (
                        <div className="text-center text-gray-400 py-4">
                            <Spinner />
                            <p className="mt-2">Searching for wallets...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletSelectionModal;