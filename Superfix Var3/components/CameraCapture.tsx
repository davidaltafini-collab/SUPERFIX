import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
    onCapture: (base64Image: string) => void;
    label?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, label = "Fă o poză" }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    const startCamera = async () => {
        setCapturedImage(null);
        setError('');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }, 
                audio: false 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setIsCameraActive(true);
            }
        } catch (err) {
            setError("Acces refuzat la cameră. Verifică permisiunile.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsCameraActive(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(base64);
                onCapture(base64);
                stopCamera();
            }
        }
    };

    useEffect(() => { return () => { stopCamera(); }; }, []);

    return (
        <div className="flex flex-col items-center gap-4 border-4 border-black p-4 bg-white shadow-[8px_8px_0_#000] relative">
            {/* Eticheta "GADGET" */}
            <div className="absolute -top-4 left-4 bg-comic-yellow px-3 py-1 border-2 border-black font-bold text-xs uppercase tracking-widest transform -rotate-2">
                SUPER-GADGET V1.0
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 w-full text-center font-bold font-comic">
                    ⚠️ {error}
                </div>
            )}

            {/* ZONA VIDEO (VIZOR) */}
            <div className="relative w-full max-w-md aspect-video bg-black border-4 border-black group overflow-hidden">
                {/* HUD Overlay (Liniile de vizor) */}
                <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-white opacity-50 z-10"></div>
                <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-white opacity-50 z-10"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-white opacity-50 z-10"></div>
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-white opacity-50 z-10"></div>

                {!isCameraActive && !capturedImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-0">
                        <div className="w-16 h-16 border-4 border-dashed border-gray-600 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl">📷</span>
                        </div>
                        <p className="font-heading text-xl uppercase tracking-widest text-gray-500">Standby Mode</p>
                    </div>
                )}
                
                {/* REC INDICATOR */}
                {isCameraActive && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 px-2 rounded z-20">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="text-white text-xs font-mono font-bold">LIVE FEED</span>
                    </div>
                )}

                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`} />
                {capturedImage && <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />}
            </div>

            <canvas ref={canvasRef} className="hidden"></canvas>

            {/* BUTOANE */}
            <div className="flex gap-4 w-full">
                {!isCameraActive && !capturedImage && (
                    <button onClick={startCamera} className="w-full bg-super-blue text-white font-heading text-xl py-3 border-4 border-black hover:bg-blue-800 shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase">
                        Activează Camera
                    </button>
                )}

                {isCameraActive && (
                    <button onClick={capturePhoto} className="w-full bg-super-red text-white font-heading text-xl py-3 border-4 border-black hover:bg-red-700 shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase animate-pulse">
                        ⚡ CAPTUREAZĂ DOVADA
                    </button>
                )}

                {capturedImage && (
                    <button onClick={startCamera} className="w-full bg-comic-yellow text-black font-heading text-xl py-3 border-4 border-black hover:bg-yellow-400 shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase">
                        🔄 Altă Poză
                    </button>
                )}
            </div>
        </div>
    );
};

export default CameraCapture;