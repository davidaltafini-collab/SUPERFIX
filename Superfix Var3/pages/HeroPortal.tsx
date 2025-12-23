import React, { useEffect, useState } from 'react';
import { loginHero, getMyMissions, updateMissionStatus, logout } from '../services/dataService';
import { ServiceRequest } from '../types';
import CameraCapture from '../components/CameraCapture';
import { useNavigate } from 'react-router-dom';

const HeroPortal: React.FC = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [missions, setMissions] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('superfix_token');
        const role = localStorage.getItem('superfix_role');
        if (token && role === 'HERO') {
            setIsLoggedIn(true);
            loadMissions();
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await loginHero(username, password);
        if (success) {
            setIsLoggedIn(true);
            loadMissions();
        } else {
            alert("ACCES REFUZAT! Credențiale invalide.");
        }
    };

    const loadMissions = async () => {
        setLoading(true);
        const data = await getMyMissions();
        setMissions(data);
        setLoading(false);
    };

    const handleMissionAction = async (id: string, action: 'ACCEPT' | 'START_WORK' | 'COMPLETE' | 'REJECT', photo: string | null = null) => {
        if (action === 'REJECT') {
            if(!confirm("Ești sigur? Refuzul scade Trust Factor cu 1 punct.")) return;
            await updateMissionStatus(id, 'REJECTED', null);
        } else if (action === 'ACCEPT') {
            await updateMissionStatus(id, 'ACCEPTED', null);
        } else if (action === 'START_WORK') {
            if (!photo) return alert("Trebuie să faci o poză BEFORE!");
            await updateMissionStatus(id, 'IN_PROGRESS', photo);
        } else if (action === 'COMPLETE') {
            if (!photo) return alert("Trebuie să faci o poză AFTER!");
            await updateMissionStatus(id, 'COMPLETED', photo);
        }
        loadMissions();
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dots bg-gray-900 p-4">
                <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0_#000] max-w-md w-full relative animate-pop-in">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-super-red text-white font-heading text-xl px-6 py-2 border-4 border-black rotate-2 shadow-[4px_4px_0_#000]">
                        TOP SECRET
                    </div>
                    <h2 className="text-4xl font-heading text-center mb-8 mt-4 uppercase">Acces Eroi</h2>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block font-bold text-sm mb-1 uppercase tracking-widest">Nume de Cod</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border-4 border-black p-3 font-mono text-lg outline-none focus:bg-yellow-50" placeholder="ex: Speedster" />
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-1 uppercase tracking-widest">Parolă Secretă</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-4 border-black p-3 font-mono text-lg outline-none focus:bg-yellow-50" placeholder="••••••••" />
                        </div>
                        <button type="submit" className="w-full bg-super-blue text-white font-heading text-2xl py-4 border-4 border-black hover:bg-blue-800 shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase transform hover:-rotate-1">
                            LOGARE
                        </button>

                        {/* === AICI AM ADĂUGAT SECȚIUNEA DE ÎNSCRIERE === */}
                        <div className="mt-8 pt-6 border-t-4 border-black border-dashed text-center">
                            <p className="font-comic font-bold text-gray-600 mb-2">Nu ai încă cont?</p>
                            <button 
                                type="button"
                                onClick={() => navigate('/register')}
                                className="text-super-red font-heading text-xl uppercase tracking-wider hover:underline hover:scale-105 transition-transform"
                            >
                                ALĂTURĂ-TE ECHIPEI SUPERFIX
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dots bg-gray-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b-4 border-black pb-6 gap-4 bg-white p-6 shadow-[8px_8px_0_#000] border-4 border-black">
                    <div>
                        <h1 className="text-4xl font-heading uppercase tracking-tighter">Centrul de Comandă</h1>
                        <p className="font-comic text-gray-500">Gestionează misiunile active</p>
                    </div>
                    <button onClick={() => { logout(); setIsLoggedIn(false); navigate('/'); }} className="bg-red-600 text-white px-6 py-3 font-heading border-4 border-black hover:bg-red-700 shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase">
                        Deconectare
                    </button>
                </div>

                {loading ? <div className="text-center text-2xl font-heading animate-pulse">Se scanează frecvențele...</div> : (
                    <div className="space-y-8">
                        {missions.length === 0 && (
                            <div className="bg-white border-4 border-black p-12 text-center shadow-[8px_8px_0_#000]">
                                <div className="text-6xl mb-4">☕</div>
                                <h3 className="text-2xl font-heading mb-2">NICIO MISIUNE ACTIVĂ</h3>
                                <p className="font-comic text-gray-500">Relaxează-te eroule, orașul e în siguranță momentan.</p>
                            </div>
                        )}
                        
                        {missions.map(mission => (
                            <div key={mission.id} className="bg-white border-4 border-black shadow-[8px_8px_0_#000] overflow-hidden relative group hover:translate-x-1 transition-transform">
                                {/* Status Badge */}
                                <div className={`absolute top-0 right-0 px-6 py-2 font-heading text-lg border-l-4 border-b-4 border-black z-10 
                                    ${mission.status === 'PENDING' ? 'bg-yellow-400' : 
                                      mission.status === 'ACCEPTED' ? 'bg-blue-400 text-white' : 
                                      mission.status === 'IN_PROGRESS' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                                    {mission.status.replace('_', ' ')}
                                </div>
                                
                                <div className="p-8">
                                    <h3 className="text-3xl font-heading mb-2 uppercase drop-shadow-[2px_2px_0_#rgba(0,0,0,0.2)]">{mission.clientName}</h3>
                                    
                                    <div className="bg-gray-100 border-2 border-dashed border-gray-400 p-4 mb-6 font-comic text-lg italic relative">
                                        <div className="absolute -top-3 -left-3 text-4xl text-gray-300">"</div>
                                        {mission.description}
                                        <div className="absolute -bottom-6 -right-3 text-4xl text-gray-300 transform rotate-180">"</div>
                                    </div>

                                    <div className="flex items-center gap-2 font-mono text-sm bg-black text-white px-3 py-1 inline-block border-2 border-black transform -rotate-1 mb-6">
                                        📞 {mission.clientPhone}
                                    </div>
                                    
                                    <div className="mt-4 border-t-4 border-black pt-6">
                                        {mission.status === 'PENDING' && (
                                            <div className="space-y-4">
                                                <div className="flex gap-4">
                                                    <button onClick={() => handleMissionAction(mission.id, 'ACCEPT')} className="flex-1 bg-green-500 text-white font-heading text-xl py-4 border-4 border-black shadow-[4px_4px_0_#000] hover:bg-green-600 active:translate-y-1 active:shadow-none transition-all uppercase">
                                                        ACCEPTĂ MISIUNEA
                                                    </button>
                                                    <button onClick={() => handleMissionAction(mission.id, 'REJECT')} className="bg-gray-200 text-gray-600 px-6 font-heading border-4 border-black hover:bg-red-100 hover:text-red-600 uppercase">
                                                        REFUZĂ
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {mission.status === 'ACCEPTED' && (
                                            <div className="animate-slide-up bg-blue-50 p-6 border-4 border-black">
                                                <h4 className="font-heading text-xl mb-4 text-blue-900 uppercase">PASUL 1: DOVADA INIȚIALĂ</h4>
                                                <p className="font-comic mb-4">Fă o poză la fața locului (BEFORE) pentru a începe cronometrul.</p>
                                                <CameraCapture label="FĂ POZA BEFORE" onCapture={(photo) => handleMissionAction(mission.id, 'START_WORK', photo)} />
                                            </div>
                                        )}

                                        {mission.status === 'IN_PROGRESS' && (
                                            <div className="animate-slide-up bg-orange-50 p-6 border-4 border-black">
                                                <h4 className="font-heading text-xl mb-4 text-orange-900 uppercase">PASUL 2: FINALIZARE</h4>
                                                <p className="font-comic mb-4">Lucrarea e gata? Fă o poză cu rezultatul (AFTER) pentru a închide misiunea.</p>
                                                <CameraCapture label="FĂ POZA AFTER" onCapture={(photo) => handleMissionAction(mission.id, 'COMPLETE', photo)} />
                                            </div>
                                        )}

                                        {mission.status === 'COMPLETED' && (
                                            <div className="bg-green-100 border-4 border-green-600 p-6 text-center transform rotate-1">
                                                <h3 className="text-4xl font-heading text-green-700 uppercase mb-2">MISIUNE ÎNDEPLINITĂ!</h3>
                                                <p className="font-comic font-bold">Ai câștigat +5 puncte Trust Factor.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeroPortal;