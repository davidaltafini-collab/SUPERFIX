import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { JobCategory } from '../types';

export const RegisterHero: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        category: JobCategory.ELECTRICIAN
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3001/api/apply-hero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                alert("📩 DOSAR ÎNREGISTRAT! Verifică-ți emailul pentru confirmare.");
                navigate('/');
            } else {
                alert("Eroare: " + data.error);
            }
        } catch (err) {
            alert("Eroare de conexiune cu sediul central.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f0f0] bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] p-4 md:p-8 flex justify-center items-center">
            <div className="max-w-xl w-full bg-white border-4 border-black shadow-[10px_10px_0_#000] relative p-8 md:p-12 rotate-1">
                
                {/* Stampila CONFIDENTIAL */}
                <div className="absolute top-4 right-4 border-4 border-red-600 text-red-600 font-black text-xl px-4 py-1 transform rotate-12 opacity-80 pointer-events-none">
                    CONFIDENTIAL
                </div>

                <div className="text-center mb-10">
                    <h1 className="font-heading text-4xl md:text-5xl uppercase mb-2">APLICAȚIE EROU</h1>
                    <p className="font-comic text-gray-600">Completează datele pentru a fi contactat.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 font-comic">
                    
                    <div className="bg-yellow-50 p-4 border-2 border-dashed border-black relative">
                        <div className="absolute -top-3 -left-3 bg-black text-white px-2 font-bold text-xs">DATE CANDIDAT</div>
                        
                        <div className="mb-4">
                            <label className="block font-bold text-sm uppercase mb-1">Nume Complet</label>
                            <input required type="text" className="w-full border-2 border-black p-2" placeholder="ex: Popescu Ion" 
                                onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-sm uppercase mb-1">Telefon</label>
                                <input required type="tel" className="w-full border-2 border-black p-2" placeholder="07xx..." 
                                    onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block font-bold text-sm uppercase mb-1">Email</label>
                                <input required type="email" className="w-full border-2 border-black p-2" placeholder="email@..." 
                                    onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 border-2 border-dashed border-black relative mt-6">
                        <div className="absolute -top-3 -left-3 bg-black text-white px-2 font-bold text-xs">ABILITĂȚI</div>
                        <div>
                            <label className="block font-bold text-sm uppercase mb-1">Specializare</label>
                            <select className="w-full border-2 border-black p-2 bg-white"
                                onChange={e => setFormData({...formData, category: e.target.value as JobCategory})}>
                                {Object.values(JobCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>

                    <button disabled={loading} type="submit" className="w-full bg-super-red text-white font-heading text-2xl py-4 border-4 border-black shadow-[6px_6px_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all mt-8">
                        {loading ? 'SE TRIMITE...' : 'TRIMITE DOSARUL'}
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/hero-portal" className="text-blue-700 font-bold underline hover:text-blue-900 text-sm">
                            ← Înapoi la Portal
                        </Link>
                    </div>

                </form>
            </div>
        </div>
    );
};