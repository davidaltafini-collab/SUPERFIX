import React, { useState, useEffect, useMemo } from 'react';
import { JobCategory, Hero, ServiceRequest } from '../types';
import { 
    createHero, getAllRequests, loginUser, logoutUser, 
    getApplications, deleteApplication, getHeroes, 
    updateHero, deleteHero 
} from '../services/dataService';

const CLOUD_NAME = "dnsmgqllf";
const UPLOAD_PRESET = "superfix_upload";

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('');
  
  const [activeTab, setActiveTab] = useState<'HEROES' | 'REQUESTS' | 'APPLICATIONS'>('HEROES');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'VIEW' | 'EDIT' | 'ADD'>('VIEW');
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [viewEvidence, setViewEvidence] = useState<ServiceRequest | null>(null);

  // Formular
  const [formData, setFormData] = useState<any>({
      alias: '', realName: '', username: '', password: '', 
      category: JobCategory.ELECTRICIAN, description: '', 
      hourlyRate: 100, avatarUrl: '', videoUrl: '', 
      email: '', phone: '', location: 'București', powers: '', trustFactor: 50
  });
  
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('superfix_token');
    if (token) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if(!isAuthenticated) return;
    refreshAllData();
  }, [isAuthenticated, activeTab]);

  const refreshAllData = () => {
      getHeroes().then(setHeroes);
      getAllRequests().then(setRequests);
      getApplications().then(setApplications);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await loginUser(usernameInput, passwordInput)) setIsAuthenticated(true);
    else alert('Date incorecte');
  };

  // === CALCUL LISTE ===
  const availableCategories = useMemo(() => {
      const cats = new Set<string>();
      Object.values(JobCategory).forEach(c => cats.add(c));
      heroes.forEach(h => cats.add(h.category));
      return Array.from(cats).sort();
  }, [heroes]);

  const filteredHeroes = heroes.filter(h => {
      const matchSearch = (h.alias + h.realName + h.category).toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategory === 'ALL' || h.category === filterCategory;
      return matchSearch && matchCat;
  });

  // === ACTIONS ===
  const openAddModal = () => {
      setFormData({
        alias: '', realName: '', username: '', password: '', 
        category: JobCategory.ELECTRICIAN, description: '', 
        hourlyRate: 100, avatarUrl: '', videoUrl: '', 
        email: '', phone: '', location: 'București', powers: '', 
        trustFactor: 50 // Default 50
      });
      setModalMode('ADD');
      setShowModal(true);
  };

  // === AICI AM REPARAT PROBLEMA DATELOR LIPSĂ ===
  const openHeroFile = (hero: Hero) => {
      setSelectedHero(hero);
      setFormData({
          ...hero,
          // Folosim || '' pentru a ne asigura că nu avem null (ceea ce face input-ul să pară gol/blocat)
          realName: hero.realName || '',
          email: hero.email || '',
          phone: hero.phone || '',
          description: hero.description || '',
          location: hero.location || 'București',
          avatarUrl: hero.avatarUrl || '',
          videoUrl: hero.videoUrl || '',
          powers: hero.powers || '',
          // Parola o resetăm mereu la gol pe frontend pentru securitate
          password: '' 
      }); 
      setModalMode('VIEW');
      setShowModal(true);
  };

  // === RECRUITMENT ===
  const handleRecruit = (app: any) => {
      setFormData({
          alias: '', 
          realName: app.name || '', 
          username: app.email.split('@')[0], 
          password: 'Hero' + Math.floor(Math.random() * 1000), 
          category: app.category, 
          description: '', 
          hourlyRate: 100, 
          avatarUrl: '', videoUrl: '', 
          email: app.email || '', 
          phone: app.phone || '', 
          location: 'București', powers: '', 
          trustFactor: 50 // Start Corect
      });
      deleteApplication(app.id).then(() => {
          setApplications(prev => prev.filter(a => a.id !== app.id));
          setActiveTab('HEROES');
          setModalMode('ADD');
          setShowModal(true);
      });
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      const payload = { ...formData };
      
      // Gestionare Categorie
      if(isCustomCat) payload.category = customCategory;
      
      // Curățare payload
      if(!payload.password) delete payload.password;
      delete payload.id;
      delete payload.reviews;
      delete payload.requests;
      delete payload.createdAt;
      delete payload.updatedAt;

      let success = false;
      if(modalMode === 'EDIT' && selectedHero) {
          success = await updateHero(selectedHero.id, payload);
      } else {
          success = await createHero(payload);
      }

      if(success) {
          alert(modalMode === 'EDIT' ? 'Profil actualizat!' : 'Erou recrutat!');
          setShowModal(false);
          refreshAllData();
      } else {
          alert('Eroare la salvare.');
      }
  };

  const handleDeleteHero = async () => {
      if(!selectedHero) return;
      if(confirm("Ești sigur? Această acțiune este ireversibilă!")) {
          await deleteHero(selectedHero.id);
          setShowModal(false);
          refreshAllData();
      }
  };

  const handleFileUpload = async (file: File, field: 'avatarUrl' | 'videoUrl') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      setUploading(true);
      const type = field === 'videoUrl' ? 'video' : 'image';
      try {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`, { method: 'POST', body: formData });
          const data = await res.json();
          if(data.secure_url) setFormData((prev: any) => ({ ...prev, [field]: data.secure_url }));
      } finally { setUploading(false); }
  };

  const heroMissions = selectedHero ? requests.filter(r => r.heroId === selectedHero.id) : [];

  if (!isAuthenticated) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <form onSubmit={handleLogin} className="bg-white p-8 border-4 border-black shadow-[8px_8px_0_#000] w-full max-w-sm">
              <h1 className="font-heading text-3xl mb-6 text-center">ADMIN HQ</h1>
              <input className="w-full border-4 border-black p-3 mb-4 font-mono" placeholder="Username" value={usernameInput} onChange={e=>setUsernameInput(e.target.value)}/>
              <input className="w-full border-4 border-black p-3 mb-6 font-mono" type="password" placeholder="Password" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)}/>
              <button className="w-full bg-red-600 text-white font-heading py-4 border-4 border-black hover:bg-red-700 shadow-[4px_4px_0_#000]">ACCESARE</button>
          </form>
      </div>
  );

  return (
    <div className="container mx-auto px-2 md:px-4 py-8 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-4 border-black pb-4 bg-white p-4 shadow-comic gap-4">
        <h1 className="font-heading text-3xl md:text-4xl italic text-center md:text-left">SUPERFIX <span className="text-super-red">ADMIN</span></h1>
        <div className="flex flex-wrap justify-center gap-2">
            {['HEROES', 'REQUESTS', 'APPLICATIONS'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} 
                    className={`font-heading text-sm md:text-xl px-3 py-1 border-2 border-transparent ${activeTab === tab ? 'bg-comic-yellow border-black shadow-comic' : 'hover:underline'}`}>
                    {tab === 'HEROES' ? 'EROI' : tab === 'REQUESTS' ? 'MISIUNI' : 'RECRUTARE'}
                </button>
            ))}
            <button onClick={() => logoutUser() || setIsAuthenticated(false)} className="text-gray-500 font-bold ml-2 border-l-2 border-gray-300 pl-2 text-sm md:text-base">IEȘIRE</button>
        </div>
      </div>

      {/* === TAB: EROI === */}
      {activeTab === 'HEROES' && (
          <div>
              <div className="bg-white border-4 border-black p-4 mb-6 flex flex-col md:flex-row gap-4">
                  <input placeholder="🔍 Caută..." className="flex-grow border-2 border-black p-2 font-comic" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  <select className="border-2 border-black p-2 font-comic" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                      <option value="ALL">Toate Categoriile</option>
                      {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={openAddModal} className="bg-black text-white font-heading px-6 py-3 hover:bg-gray-800 border-2 border-white shadow-comic whitespace-nowrap">+ EROU</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredHeroes.map(hero => (
                      <div key={hero.id} onClick={() => openHeroFile(hero)} className="bg-white border-4 border-black p-4 cursor-pointer hover:-translate-y-1 hover:shadow-comic transition-all relative group">
                          <div className="absolute top-2 right-2 bg-yellow-400 border-2 border-black px-2 text-xs font-bold z-10">★ {hero.trustFactor}</div>
                          <div className="aspect-square w-full mb-4 border-2 border-black overflow-hidden bg-gray-200">
                              {hero.avatarUrl ? <img src={hero.avatarUrl} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl">🦸‍♂️</div>}
                          </div>
                          <h3 className="font-heading text-xl truncate">{hero.alias}</h3>
                          <span className="text-xs bg-black text-white px-2 py-1 uppercase font-bold">{hero.category}</span>
                          <div className="mt-4 text-center bg-gray-100 border-2 border-dashed border-gray-400 py-1 text-sm font-bold text-gray-500 group-hover:bg-yellow-100 group-hover:text-black group-hover:border-black transition-colors">
                              DESCHIDE DOSAR
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* === TAB: MISIUNI === */}
      {activeTab === 'REQUESTS' && (
          <div className="bg-white border-4 border-black p-2 md:p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="bg-black text-white font-heading text-sm">
                      <tr><th className="p-3">Data</th><th className="p-3">Client</th><th className="p-3">Erou</th><th className="p-3">Status</th><th className="p-3 text-center">Dosar</th></tr>
                  </thead>
                  <tbody className="font-comic text-sm">
                      {requests.map(req => (
                          <tr key={req.id} className="border-b border-gray-300 hover:bg-yellow-50">
                              <td className="p-3">{new Date(req.date).toLocaleDateString()}</td>
                              <td className="p-3 font-bold">{req.clientName}<br/><span className="text-xs font-normal">{req.clientPhone}</span></td>
                              <td className="p-3">{req.hero?.alias || '?'}</td>
                              <td className="p-3"><span className={`px-2 py-1 border border-black text-xs font-bold ${req.status==='COMPLETED'?'bg-green-300':req.status==='PENDING'?'bg-yellow-300':'bg-blue-300'}`}>{req.status}</span></td>
                              <td className="p-3 text-center">{req.status === 'COMPLETED' && <button onClick={() => setViewEvidence(req)} className="text-blue-600 hover:underline font-bold text-xs">📷 FOTO</button>}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {/* === TAB: RECRUTARE === */}
      {activeTab === 'APPLICATIONS' && (
          <div className="grid gap-6 md:grid-cols-2">
              {applications.length === 0 && <p className="text-gray-500 p-4">Nicio aplicație nouă.</p>}
              {applications.map(app => (
                  <div key={app.id} className="bg-yellow-50 border-4 border-black p-6 shadow-comic relative">
                      <div className="absolute -top-3 -right-3 bg-red-600 text-white font-bold px-3 border-2 border-black rotate-3">NOU</div>
                      <h3 className="font-heading text-xl">{app.name}</h3>
                      <p className="font-bold text-sm bg-white inline-block px-2 border border-black mb-4">{app.category}</p>
                      <div className="font-mono text-sm mb-4">📞 {app.phone} <br/> ✉️ {app.email}</div>
                      <div className="flex gap-2 flex-wrap">
                          <button onClick={() => handleRecruit(app)} className="flex-1 bg-green-500 text-white font-heading py-2 border-2 border-black hover:bg-green-600 shadow-[2px_2px_0_#000]">RECRUTEAZĂ</button>
                          <button onClick={() => { deleteApplication(app.id); refreshAllData(); }} className="px-4 bg-red-500 text-white font-bold border-2 border-black hover:bg-red-600">X</button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* === MODAL PRINCIPAL === */}
      {showModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 md:p-4">
              <div className="bg-white w-full max-w-5xl border-4 border-white shadow-2xl flex flex-col md:flex-row max-h-[95vh] overflow-y-auto md:overflow-hidden relative rounded-sm">
                  <button onClick={() => setShowModal(false)} className="absolute top-2 right-2 z-50 bg-red-600 text-white w-8 h-8 font-black border-2 border-black hover:scale-110 shadow-[2px_2px_0_#000]">X</button>
                  
                  {/* COLOANA STÂNGA: MEDIA & STATS */}
                  <div className="md:w-1/3 bg-gray-100 p-6 border-b-4 md:border-b-0 md:border-r-4 border-black overflow-y-auto">
                      <h3 className="font-heading text-xl mb-2 text-center uppercase">Aspect Vizual</h3>
                      
                      {/* PREVIEW POZĂ FIXAT */}
                      <div className="relative mb-6 group mx-auto w-full">
                          <div className="w-full aspect-square bg-gray-300 border-4 border-black overflow-hidden flex items-center justify-center shadow-[4px_4px_0_#000]">
                              {formData.avatarUrl ? (
                                  <img src={formData.avatarUrl} className="w-full h-full object-cover" alt="Preview" />
                              ) : <span className="text-4xl">?</span>}
                          </div>
                          {modalMode !== 'VIEW' && (
                              <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 border-2 border-black cursor-pointer hover:bg-blue-700 shadow-md transform hover:scale-110 transition-transform">
                                  📷 <input type="file" hidden onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'avatarUrl')} />
                              </label>
                          )}
                      </div>

                      {/* Video */}
                      <div className="mb-6">
                          <label className="block font-bold text-xs mb-1">VIDEO PREZENTARE</label>
                          {formData.videoUrl ? (
                              <video src={formData.videoUrl} controls className="w-full border-2 border-black mb-2" />
                          ) : <div className="bg-gray-200 p-4 text-center border-2 border-black text-xs">Lipsă Video</div>}
                          {modalMode !== 'VIEW' && (
                              <label className="block w-full text-center bg-black text-white py-2 cursor-pointer hover:bg-gray-800 text-xs font-bold border-2 border-black shadow-[2px_2px_0_#fff]">
                                  {uploading ? '...' : 'UPLOAD VIDEO'} <input type="file" hidden accept="video/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'videoUrl')} />
                              </label>
                          )}
                      </div>

                      {/* STATS & TRUST CONTROL */}
                      <div className="bg-yellow-200 p-4 border-2 border-black text-center shadow-[4px_4px_0_#000]">
                          <p className="font-heading text-lg">TRUST FACTOR</p>
                          
                          {modalMode !== 'VIEW' ? (
                              <div className="flex items-center justify-center gap-4 my-2">
                                  <button type="button" onClick={() => setFormData({...formData, trustFactor: formData.trustFactor - 1})} className="w-8 h-8 bg-red-500 text-white font-black border-2 border-black hover:scale-110">-</button>
                                  <span className="text-3xl font-black">{formData.trustFactor}</span>
                                  <button type="button" onClick={() => setFormData({...formData, trustFactor: formData.trustFactor + 1})} className="w-8 h-8 bg-green-500 text-white font-black border-2 border-black hover:scale-110">+</button>
                              </div>
                          ) : (
                              <div className="text-4xl font-black mb-2">{formData.trustFactor}</div>
                          )}
                      </div>
                  </div>

                  {/* COLOANA DREAPTA: DETALII */}
                  <div className="md:w-2/3 p-6 overflow-y-auto bg-dots">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-4 border-black pb-4">
                          <h2 className="font-heading text-2xl md:text-3xl uppercase mb-2 md:mb-0">
                              {modalMode === 'ADD' ? 'RECRUTARE' : modalMode === 'EDIT' ? 'EDITARE' : formData.alias}
                          </h2>
                          {modalMode === 'VIEW' && (
                              <button onClick={() => setModalMode('EDIT')} className="bg-comic-yellow px-4 py-2 font-heading border-2 border-black shadow-[2px_2px_0_#000] hover:translate-y-1 hover:shadow-none transition-all">
                                  ✏️ EDITEAZĂ DATELE
                              </button>
                          )}
                      </div>

                      {/* VIEW MODE */}
                      {modalMode === 'VIEW' && (
                          <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono bg-white p-4 border-2 border-black">
                                  <div><span className="font-bold block text-xs text-gray-500">NUME REAL</span> {formData.realName}</div>
                                  <div><span className="font-bold block text-xs text-gray-500">CATEGORIE</span> {formData.category}</div>
                                  <div><span className="font-bold block text-xs text-gray-500">TELEFON</span> {formData.phone}</div>
                                  <div><span className="font-bold block text-xs text-gray-500">EMAIL</span> {formData.email}</div>
                                  <div className="md:col-span-2 border-t-2 border-dashed border-gray-300 pt-2 mt-2">
                                      <span className="font-bold block text-xs text-gray-500 mb-1">DESCRIERE</span>
                                      <p className="italic text-gray-700">{formData.description || "Nu există descriere."}</p>
                                  </div>
                              </div>

                              <div>
                                  <h3 className="font-heading text-xl mb-2 bg-black text-white px-2 inline-block">ISTORIC MISIUNI</h3>
                                  <div className="border-4 border-black max-h-60 overflow-y-auto bg-white">
                                      {heroMissions.length === 0 ? <p className="p-4 italic text-gray-500">Nicio misiune la activ.</p> : (
                                          <table className="w-full text-left text-sm">
                                              <thead className="bg-gray-200 font-bold sticky top-0">
                                                  <tr><th className="p-2">Client</th><th className="p-2">Status</th><th className="p-2">Dovadă</th></tr>
                                              </thead>
                                              <tbody>
                                                  {heroMissions.map(m => (
                                                      <tr key={m.id} className="border-b border-gray-200">
                                                          <td className="p-2">{m.clientName}</td>
                                                          <td className="p-2"><span className={`px-1 text-xs font-bold border border-black ${m.status==='COMPLETED'?'bg-green-200':'bg-yellow-100'}`}>{m.status}</span></td>
                                                          <td className="p-2">{m.status === 'COMPLETED' && <button onClick={() => setViewEvidence(m)} className="text-blue-600 underline font-bold text-xs">VEZI POZE</button>}</td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      )}
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* EDIT/ADD MODE */}
                      {(modalMode === 'EDIT' || modalMode === 'ADD') && (
                          <form onSubmit={handleSave} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                      <label className="font-bold text-xs">ALIAS</label>
                                      <input required className="w-full border-2 border-black p-2 font-bold" value={formData.alias} onChange={e => setFormData({...formData, alias: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="font-bold text-xs">CATEGORIE</label>
                                      <div className="flex gap-2">
                                          {!isCustomCat ? (
                                              <select className="w-full border-2 border-black p-2" value={formData.category} onChange={e => {
                                                  if(e.target.value === 'NEW') setIsCustomCat(true);
                                                  else setFormData({...formData, category: e.target.value});
                                              }}>
                                                  {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                  <option value="NEW" className="font-bold text-red-600">+ Categorie Nouă</option>
                                              </select>
                                          ) : (
                                              <div className="flex w-full">
                                                  <input autoFocus placeholder="Nume nou..." className="w-full border-2 border-black p-2 bg-yellow-50" value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
                                                  <button type="button" onClick={() => setIsCustomCat(false)} className="bg-red-500 text-white px-2 border-2 border-black">X</button>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <input placeholder="Nume Real" className="border-2 border-black p-2" value={formData.realName} onChange={e => setFormData({...formData, realName: e.target.value})} />
                                  <input type="number" placeholder="Tarif (RON)" className="border-2 border-black p-2" value={formData.hourlyRate} onChange={e => setFormData({...formData, hourlyRate: e.target.value})} />
                              </div>

                              <textarea rows={3} placeholder="Descriere abilități..." className="w-full border-2 border-black p-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />

                              <div className="bg-blue-50 p-4 border-2 border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <input placeholder="Username Login" className="border-2 border-black p-2" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                                  <input placeholder={modalMode==='EDIT' ? "Parola nouă (lasă gol pt neschimbat)" : "Parolă"} className="border-2 border-black p-2" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                  <input placeholder="Email" className="border-2 border-black p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                  <input placeholder="Telefon" className="border-2 border-black p-2" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                              </div>

                              <div className="flex flex-col md:flex-row gap-4 pt-4 border-t-4 border-black mt-4">
                                  <button disabled={uploading} className="flex-1 bg-green-500 text-white font-heading text-xl py-3 border-4 border-black hover:bg-green-600 shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none">
                                      {uploading ? 'SE ÎNCARCĂ...' : '💾 SALVEAZĂ'}
                                  </button>
                                  {modalMode === 'EDIT' && (
                                      <button type="button" onClick={handleDeleteHero} className="bg-red-600 text-white font-bold px-4 py-3 border-4 border-black hover:bg-red-800">
                                          ȘTERGE EROU
                                      </button>
                                  )}
                              </div>
                          </form>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* === MODAL EVIDENCE === */}
      {viewEvidence && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setViewEvidence(null)}>
              <div className="bg-white p-4 max-w-4xl w-full border-4 border-white overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                  <h2 className="text-center font-heading text-2xl mb-4">DOSAR FOTO: {viewEvidence.clientName}</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                      <div className="text-center">
                          <span className="bg-red-600 text-white font-bold px-3 py-1 mb-2 inline-block border-2 border-black transform -rotate-2">BEFORE</span>
                          {viewEvidence.photoBefore ? <img src={viewEvidence.photoBefore} className="w-full h-64 object-contain bg-black border-4 border-black" /> : <div className="h-64 bg-gray-200 flex items-center justify-center border-4 border-black">LIPSĂ</div>}
                      </div>
                      <div className="text-center">
                          <span className="bg-green-600 text-white font-bold px-3 py-1 mb-2 inline-block border-2 border-black transform rotate-2">AFTER</span>
                          {viewEvidence.photoAfter ? <img src={viewEvidence.photoAfter} className="w-full h-64 object-contain bg-black border-4 border-black" /> : <div className="h-64 bg-gray-200 flex items-center justify-center border-4 border-black">LIPSĂ</div>}
                      </div>
                  </div>
                  <button onClick={() => setViewEvidence(null)} className="mt-4 w-full bg-black text-white py-3 font-heading border-2 border-gray-500">ÎNCHIDE</button>
              </div>
          </div>
      )}
    </div>
  );
};