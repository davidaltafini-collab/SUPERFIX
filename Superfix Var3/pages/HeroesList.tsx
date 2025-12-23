import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Hero, JobCategory } from '../types';
import { getHeroes } from '../services/dataService';

export const HeroesList: React.FC = () => {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHeroes = async () => {
      setLoading(true);
      const data = await getHeroes();
      setHeroes(data);
      setLoading(false);
    };
    fetchHeroes();
  }, []);

  // === CALCUL LOGICĂ ===
  // 1. Calculăm media recenziilor pentru un erou
  const getAverageRating = (hero: Hero) => {
      if (!hero.reviews || hero.reviews.length === 0) return 0;
      const sum = hero.reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
      return sum / hero.reviews.length;
  };

  // 2. Generăm stelele vizual (ex: ★★★★☆)
  const renderStars = (rating: number) => {
      const rounded = Math.round(rating);
      return (
          <span className="text-yellow-400 text-lg tracking-tighter">
              {'★'.repeat(rounded)}
              <span className="text-gray-300">{'★'.repeat(5 - rounded)}</span>
          </span>
      );
  };

  // 3. Filtrăm și Sortăm
  const filteredHeroes = heroes.filter(hero => {
    const matchesCategory = filter === 'ALL' || hero.category.toUpperCase() === filter.toUpperCase();
    const matchesSearch = hero.alias.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (hero.realName && hero.realName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => b.trustFactor - a.trustFactor); // Cei mai de încredere primii

  // 4. Categorii Dinamice
  const dynamicCategories = useMemo(() => {
      const cats = new Set<string>();
      Object.values(JobCategory).forEach(c => cats.add(c.toUpperCase()));
      heroes.forEach(h => cats.add(h.category.toUpperCase()));
      return Array.from(cats).sort();
  }, [heroes]);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen relative">
      
      {/* Header */}
      <div className="mb-8 text-center relative z-10">
        <h1 className="font-heading text-4xl md:text-5xl text-super-blue mb-2 uppercase drop-shadow-[2px_2px_0_#000]">
          CARTIERUL GENERAL
        </h1>
        <p className="text-gray-600 font-comic text-lg">Alege specialistul potrivit pentru misiunea ta.</p>
      </div>

      {/* === ZONA SEARCH & FILTRE === */}
      <div className="relative z-30 mb-12 flex flex-col items-center">
        
        {/* Search Bar */}
        <div className="w-full max-w-xl mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                🔍
            </div>
            <input 
                type="text"
                placeholder="Caută erou (nume, alias)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-4 border-black font-comic text-lg shadow-[4px_4px_0_#000] focus:outline-none focus:translate-y-1 focus:shadow-none transition-all rounded-none"
            />
        </div>

        {/* Filtre (Wrap pe mobil) */}
        <div className="flex flex-wrap justify-center gap-3 w-full">
            <button 
              onClick={() => setFilter('ALL')}
              className={`px-5 py-2 font-heading text-sm border-2 border-black transition-all shadow-[2px_2px_0_#000] hover:-translate-y-1 hover:shadow-[4px_4px_0_#000]
                ${filter === 'ALL' ? 'bg-super-blue text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              TOȚI EROII
            </button>
            
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 font-heading text-sm border-2 border-black transition-all shadow-[2px_2px_0_#000] hover:-translate-y-1 hover:shadow-[4px_4px_0_#000] uppercase
                  ${filter === cat ? 'bg-super-red text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                {cat}
              </button>
            ))}
        </div>
      </div>

      {/* === GRID EROI === */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-super-red"></div>
        </div>
      ) : (
        <>
          {filteredHeroes.length === 0 ? (
            <div className="text-center py-20 bg-white border-4 border-black shadow-[8px_8px_0_#000] max-w-2xl mx-auto">
              <h3 className="text-2xl font-heading mb-2">NICIUN EROU GĂSIT</h3>
              <p className="text-gray-500 font-comic">Încearcă altă categorie sau șterge căutarea.</p>
              <button onClick={() => {setFilter('ALL'); setSearchTerm('');}} className="mt-4 text-super-red font-bold underline">Vezi toți eroii</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10">
              {filteredHeroes.map(hero => {
                const avgRating = getAverageRating(hero);
                return (
                  // === HERO CARD (Clickable Link) ===
                  <Link 
                    to={`/hero/${hero.id}`} 
                    key={hero.id} 
                    className="block bg-white border-4 border-black rounded-xl overflow-hidden shadow-[8px_8px_0_#000] hover:-translate-y-2 hover:shadow-[12px_12px_0_#000] transition-all duration-200 flex flex-col h-full group relative"
                  >
                    
                    {/* Categorie Badge (Fixat peste imagine) */}
                    <div className="absolute top-4 right-4 z-20">
                        <span className="bg-comic-yellow border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-sm transform rotate-3 inline-block">
                            {hero.category}
                        </span>
                    </div>

                    {/* Imagine Erou */}
                    <div className="h-64 bg-gray-200 border-b-4 border-black overflow-hidden relative">
                      {hero.avatarUrl ? (
                        <img 
                          src={hero.avatarUrl} 
                          alt={hero.alias} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl text-gray-400">🦸‍♂️</div>
                      )}
                      
                      {/* Gradient Overlay jos pentru lizibilitate */}
                      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    {/* Continut Card */}
                    <div className="p-5 flex-grow flex flex-col">
                      
                      <div className="flex justify-between items-start mb-1">
                          <h3 className="font-heading text-2xl truncate pr-2 text-gray-900 group-hover:text-super-red transition-colors">
                              {hero.alias}
                          </h3>
                      </div>

                      {/* STATS ROW: Trust + Missions + Rating (ACTUALIZAT) */}
                      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-100 pb-3">
                          
                          {/* Trust Factor */}
                          <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">TRUST</span>
                              <span className="font-heading text-lg text-green-600 flex items-center gap-1">
                                  🛡️ {hero.trustFactor}
                              </span>
                          </div>

                          {/* MISIUNI (NOU ADĂUGAT) */}
                          <div className="flex flex-col items-center px-2 border-l border-r border-gray-100">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">MISIUNI</span>
                              <span className="font-heading text-lg text-blue-600">
                                  {hero.missionsCompleted}
                              </span>
                          </div>

                          {/* Review Stars */}
                          <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">RECENZII</span>
                              <div className="flex items-center gap-1">
                                  {renderStars(avgRating)}
                                  <span className="text-xs font-bold text-gray-500 ml-1">({hero.reviews?.length || 0})</span>
                              </div>
                          </div>
                      </div>

                      {/* Descriere */}
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-4 flex-grow text-sm italic font-comic text-gray-600 relative">
                        <span className="absolute -top-3 -left-2 text-3xl text-gray-300 leading-none select-none">"</span>
                        {hero.description ? (hero.description.length > 70 ? hero.description.substring(0, 70) + "..." : hero.description) : "Gata de acțiune!"}
                      </div>

                      {/* Footer: Tarif */}
                      <div className="mt-auto flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">TARIF ORAR</p>
                          <p className="font-heading text-xl text-super-red">{hero.hourlyRate} RON</p>
                        </div>
                        <div className="bg-black text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider group-hover:bg-super-blue transition-colors">
                            VEZI PROFIL →
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};