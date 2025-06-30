import { useState } from 'react';
import { Upload } from 'lucide-react';

const ImageUploader = ({ onImageUpload, id, text, disabled }) => {
    const [preview, setPreview] = useState(null);
    
    const handleFileChange = (e) => {
        if(disabled) return;
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                onImageUpload(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="w-full">
            <label htmlFor={id} className={`cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
                <div className="w-full h-40 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-pink-500 hover:text-pink-500 transition-all duration-300 bg-white/5">
                    {preview ? (
                        <img src={preview} alt="upload preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <>
                            <Upload className="w-8 h-8 mb-2" />
                            <span className="text-sm font-semibold">{text}</span>
                        </>
                    )}
                </div>
            </label>
            <input id={id} type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={disabled} />
        </div>
    );
};

export default ImageUploader;