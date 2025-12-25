"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  ShieldCheck, AlertTriangle, Activity, MapPin, 
  BarChart3, RefreshCw, Sliders, Search, Navigation, Zap, Clock 
} from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';
import ConfusionMatrix from "@/components/ConfusionMatrix";

// Import dynamique de la carte
const MapComponent = dynamic(() => import("@/components/MapComponent"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse rounded-xl flex items-center justify-center text-slate-500 text-xs">Chargement Carte...</div>
});

// --- CONSTANTES ---
const CATEGORIES = ['grocery_pos', 'gas_transport', 'shopping_net', 'entertainment', 'food_dining', 'misc_pos'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  grocery_pos: "Épicerie", gas_transport: "Transport", shopping_net: "E-Commerce",
  entertainment: "Loisirs", food_dining: "Resto", misc_pos: "Divers"
};

const DEFAULT_CITIES = [
  // 🇲🇦 Maroc
  { name: "Casablanca", lat: 33.5731, lon: -7.5898 },
  { name: "Rabat", lat: 34.0209, lon: -6.8416 },
  { name: "Marrakech", lat: 31.6295, lon: -7.9811 },
  { name: "Tanger", lat: 35.7595, lon: -5.8340 },
  { name: "Agadir", lat: 30.4278, lon: -9.5981 },

  // 🇪🇺 Europe
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Madrid", lat: 40.4168, lon: -3.7038 },
  { name: "Berlin", lat: 52.5200, lon: 13.4050 },
  { name: "Rome", lat: 41.9028, lon: 12.4964 },
  { name: "Amsterdam", lat: 52.3676, lon: 4.9041 },

  // 🇺🇸 Amérique du Nord
  { name: "New York", lat: 40.7128, lon: -74.0060 },
  { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
  { name: "Chicago", lat: 41.8781, lon: -87.6298 },
  { name: "Toronto", lat: 43.6532, lon: -79.3832 },
  { name: "Mexico City", lat: 19.4326, lon: -99.1332 },

  // 🇯🇵 Asie
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Osaka", lat: 34.6937, lon: 135.5023 },
  { name: "Seoul", lat: 37.5665, lon: 126.9780 },
  { name: "Beijing", lat: 39.9042, lon: 116.4074 },
  { name: "Shanghai", lat: 31.2304, lon: 121.4737 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198 },

  // 🇦🇪 Moyen-Orient
  { name: "Dubai", lat: 25.2048, lon: 55.2708 },
  { name: "Doha", lat: 25.2854, lon: 51.5310 },
  { name: "Riyadh", lat: 24.7136, lon: 46.6753 },

  // 🌎 Amérique du Sud
  { name: "São Paulo", lat: -23.5505, lon: -46.6333 },
  { name: "Buenos Aires", lat: -34.6037, lon: -58.3816 },
  { name: "Santiago", lat: -33.4489, lon: -70.6693 },

  // 🌍 Afrique
  { name: "Cairo", lat: 30.0444, lon: 31.2357 },
  { name: "Lagos", lat: 6.5244, lon: 3.3792 },
  { name: "Johannesburg", lat: -26.2041, lon: 28.0473 },

  // 🇦🇺 Océanie
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
  { name: "Melbourne", lat: -37.8136, lon: 144.9631 }
];

const randomDayOfWeek = () => Math.floor(Math.random() * 7);
const randomMonth = () => Math.floor(Math.random() * 12) + 1;
const randomAge = () => Math.floor(Math.random() * 60) + 18;
const randomHour = () => Math.floor(Math.random() * 24);

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);

  // --- STATES ---
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  // 📊 NOUVEAU STATE POUR LE GRAPHIQUE LIVE
  const [chartData, setChartData] = useState<any[]>([]);

  const [filter, setFilter] = useState("all");
  const [homeCity, setHomeCity] = useState("Casablanca");
  const [merchCity, setMerchCity] = useState("Casablanca");

  const [formData, setFormData] = useState({
    amt: 150.0, category: "grocery_pos", gender: "M",
    lat: 33.5731, long: -7.5898, city_pop: 3360000,
    merch_lat: 33.5731, merch_long: -7.5898,
    age: 35, hour: 14, day_of_week: 2, month: 6
  });

  useEffect(() => { setIsMounted(true); }, []);

  // --- LOGIQUE ---

  const searchLocation = async (query: string, type: 'HOME' | 'MERCH') => {
    if (!query) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const place = data[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        const name = place.display_name.split(',')[0];
        if (type === 'HOME') {
          setHomeCity(name);
          setFormData(prev => ({ ...prev, lat: lat, long: lon }));
        } else {
          setMerchCity(name);
          setFormData(prev => ({ ...prev, merch_lat: lat, merch_long: lon }));
        }
      }
    } catch (e) { console.error(e); }
  };

  const analyze = async (autoData: any = null) => {
    const dataToSend = autoData || formData;
    if (!autoData) setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });
      const data = await res.json();
      
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' });

      const enrichedResult = {
        ...data, ...dataToSend,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: currentTime
      };

      setResult(enrichedResult);
      setHistory(prev => [enrichedResult, ...prev].slice(0, 50));

      // 📊 MISE À JOUR DU GRAPHIQUE LIVE
      setChartData(prev => {
        // On crée le nouveau point
        const newPoint = {
            time: currentTime,
            risk: Math.floor(data.risk_score * 100),
            is_fraud: data.is_fraud === 1
        };
        // On garde les 20 derniers points seulement (effet fenêtre glissante)
        const newData = [...prev, newPoint];
        if (newData.length > 20) return newData.slice(newData.length - 20);
        return newData;
      });

      if (autoData) {
        setFormData(autoData);
        setHomeCity(autoData.homeName);
        setMerchCity(autoData.merchName);
      }
    } catch (e) {
      console.error(e);
      if (autoData) setIsStreaming(false);
    }
    setLoading(false);
  };

  const generateRandomTx = () => {
    const isFraud = Math.random() > 0.6;
    const home = DEFAULT_CITIES[Math.floor(Math.random() * DEFAULT_CITIES.length)];
    let merch = home;
    if (isFraud && Math.random() > 0.3) {
       do { merch = DEFAULT_CITIES[Math.floor(Math.random() * DEFAULT_CITIES.length)]; } while (merch.name === home.name);
    }
    return {
      amt: isFraud ? Math.floor(Math.random() * 2000) + 800 : Math.floor(Math.random() * 150) + 10,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      gender: Math.random() > 0.5 ? "M" : "F",
      lat: home.lat, long: home.lon, city_pop: 50000,
      merch_lat: merch.lat, merch_long: merch.lon,
      age: randomAge(),
      hour: randomHour(),
    day_of_week: randomDayOfWeek(),
    month: randomMonth(),
      homeName: home.name, merchName: merch.name
    };
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming) {
      analyze(generateRandomTx());
      interval = setInterval(() => {
        analyze(generateRandomTx());
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  if (!isMounted) {
    return <div className="h-screen w-full bg-[#0B0F19] flex items-center justify-center text-slate-500 font-mono text-xs">Chargement du Système Nexus...</div>;
  }

  // --- RENDERING ---
  const filteredHistory = history.filter(h => filter === 'all' ? true : filter === 'fraud' ? h.is_fraud : !h.is_fraud);

  return (
    <main className="h-screen w-full bg-[#0B0F19] text-slate-200 font-sans p-4 overflow-hidden flex flex-col">
      
      {/* HEADER FIXE */}
      <header className="flex-none flex justify-between items-center mb-4 pb-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                <Activity className="text-blue-500" size={24}/>
            </div>
            <div>
                <h1 className="text-xl font-bold text-white tracking-wide">NEXUS ANALYTICS</h1>
                <p className="text-xs text-slate-500 font-mono">Real-time Fraud Intelligence</p>
            </div>
        </div>
        <div className="flex gap-4 text-sm font-mono text-slate-400">
            <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></span> 
                {isStreaming ? "LIVE FEED ACTIVE" : "SYSTEM READY"}
            </span>
        </div>
      </header>

      {/* GRID PRINCIPALE */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* --- COLONNE GAUCHE : CONTRÔLES --- */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-0">
            
            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                <button 
                    onClick={() => setIsStreaming(!isStreaming)}
                    className={`w-full py-4 rounded-xl font-bold border flex items-center justify-center gap-2 transition-all shadow-lg shrink-0
                    ${isStreaming ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'}`}
                >
                    {isStreaming ? <Zap className="animate-pulse" /> : <RefreshCw />}
                    {isStreaming ? "STOP LIVE" : "AUTO STREAM"}
                </button>

                {/* GEOLOCALISATION */}
                <div className="bg-[#131B2C] p-4 rounded-xl border border-slate-800 space-y-3 shrink-0">
                    <h2 className="text-xs font-bold text-blue-400 uppercase flex gap-2"><MapPin size={14}/> Localisation</h2>
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold">Domicile</label>
                        <div className="flex gap-2">
                            <input type="text" value={homeCity} onChange={e=>setHomeCity(e.target.value)} onBlur={()=>searchLocation(homeCity, 'HOME')}
                                className="w-full bg-[#0B0F19] border border-slate-700 rounded p-1.5 text-xs text-white"/>
                            <button onClick={()=>searchLocation(homeCity, 'HOME')} className="bg-slate-700 px-2 rounded"><Search size={12}/></button>
                        </div>
                    </div>
                    <div className="flex justify-center items-center gap-2">
                        <div className="h-px flex-1 bg-slate-700"></div><Navigation size={12} className="text-slate-500"/><div className="h-px flex-1 bg-slate-700"></div>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold">Transaction</label>
                        <div className="flex gap-2">
                            <input type="text" value={merchCity} onChange={e=>setMerchCity(e.target.value)} onBlur={()=>searchLocation(merchCity, 'MERCH')}
                                className="w-full bg-[#0B0F19] border border-slate-700 rounded p-1.5 text-xs text-white"/>
                            <button onClick={()=>searchLocation(merchCity, 'MERCH')} className="bg-slate-700 px-2 rounded"><Search size={12}/></button>
                        </div>
                    </div>
                </div>

                {/* PARAMETRES MANUELS */}
                <div className="bg-[#131B2C] p-4 rounded-xl border border-slate-800 space-y-4 shrink-0">
                    <h2 className="text-xs font-bold text-slate-400 uppercase flex gap-2"><Sliders size={14}/> Paramètres</h2>
                    
                    {/* Montant */}
                    <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Montant</span><span className="text-white font-mono">${formData.amt}</span></div>
                        <input type="range" min="0" max="5000" value={formData.amt} onChange={e=>setFormData({...formData, amt: +e.target.value})} className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer"/>
                    </div>

                    {/* Heure */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500 flex items-center gap-1"><Clock size={10}/> Heure</span>
                            <span className={`font-mono font-bold ${formData.hour < 6 || formData.hour > 22 ? 'text-purple-400' : 'text-white'}`}>{formData.hour}h00</span>
                        </div>
                        <input type="range" min="0" max="23" value={formData.hour} onChange={e=>setFormData({...formData, hour: +e.target.value})} 
                            className={`w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer ${formData.hour < 6 || formData.hour > 22 ? 'accent-purple-500' : 'accent-blue-500'}`}/>
                        {(formData.hour < 6 || formData.hour > 22) && <p className="text-[9px] text-purple-400 text-right mt-1">🌙 Horaire Nocturne</p>}
                    </div>

                    {/* Catégorie */}
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Catégorie</label>
                        <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-[#0B0F19] border border-slate-700 rounded p-2 text-xs text-white">
                            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                        </select>
                    </div>

                    <button onClick={()=>analyze()} disabled={loading||isStreaming} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs disabled:opacity-50 transition-all active:scale-95">
                        {loading ? "ANALYSE..." : "SCANNER (MANUEL)"}
                    </button>
                </div>
            </div>

            {/* MINIMAP */}
            <div className="h-48 bg-[#131B2C] rounded-xl border border-slate-800 overflow-hidden relative shrink-0">
                 <div className="absolute top-2 right-2 z-[400] bg-black/60 text-white text-[9px] px-2 py-1 rounded pointer-events-none">Interactive Map</div>
                 <MapComponent 
                    homeCoords={[formData.lat, formData.long]} 
                    txCoords={[formData.merch_lat, formData.merch_long]} 
                    setHomeCoords={()=>{}} setTxCoords={()=>{}} 
                    isMismatch={formData.lat !== formData.merch_lat} 
                />
            </div>
        </div>

        {/* --- COLONNE CENTRE : RESULTATS --- */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 min-h-0">
            
            {/* CARTE SCORE */}
            <div className="bg-[#131B2C] p-6 rounded-xl border border-slate-800 shadow-xl flex-1 flex flex-col relative overflow-hidden">
                {!result ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <Activity size={48} className="mb-4 opacity-20"/>
                        <p className="text-sm">En attente de données...</p>
                    </div>
                ) : (
                    <>
                        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${result.is_fraud ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500'}`}></div>
                        
                        <div className="text-center mb-4 shrink-0">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${result.is_fraud ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                {result.is_fraud ? <AlertTriangle size={12}/> : <ShieldCheck size={12}/>}
                                {result.is_fraud ? "MENACE DÉTECTÉE" : "TRANSACTION SÛRE"}
                            </div>
                            <div className="relative">
                                <span className={`text-6xl font-black tracking-tighter ${result.is_fraud ? 'text-red-500' : 'text-white'}`}>
                                    {(result.risk_score * 100).toFixed(0)}
                                </span>
                                <span className="text-lg text-slate-500 absolute top-2 ml-1">%</span>
                            </div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest">Probabilité de Fraude</p>
                        </div>

                        {/* LISTE FACTEURS SCROLLABLE */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 bg-[#0B0F19]/50 p-3 rounded-lg border border-slate-800/50">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 sticky top-0 bg-[#0B0F19] pb-1">Analyse Factorielle</p>
                            {result.factors && result.factors.length > 0 ? (
                                result.factors.map((factor: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-xs p-2 bg-[#131B2C] rounded border border-slate-800">
                                        <span className="text-slate-300">{factor.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono font-bold" style={{color: factor.color}}>+{factor.impact}%</span>
                                            <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${factor.impact}%`, backgroundColor: factor.color }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-[10px] text-slate-600 italic py-4">Aucun facteur critique détecté.</p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* GRAPHIQUE LIVE (REAL-TIME) */}
            <div className="bg-[#131B2C] p-4 rounded-xl border border-slate-800 h-48 shrink-0 flex flex-col">
                <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase flex items-center gap-2">
                    <BarChart3 size={12}/> Activité Temps Réel (Risque %)
                </h3>
                
                {chartData.length === 0 ? (
                     <div className="flex-1 flex items-center justify-center text-[10px] text-slate-600 italic border-2 border-dashed border-slate-800 rounded">
                        En attente de transactions...
                     </div>
                ) : (
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={chartData}>
                            {/* Axe X affiche le temps, interval 2 pour pas surcharger */}
                            <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} interval={4} />
                            
                            <Tooltip 
                                contentStyle={{backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px'}} 
                                itemStyle={{color: '#fff', fontSize: '10px'}} 
                                cursor={{fill: '#1E293B'}}
                            />
                            
                            <Bar dataKey="risk" radius={[2, 2, 0, 0]} animationDuration={500}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.is_fraud ? '#EF4444' : '#3B82F6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

        {/* --- COLONNE DROITE : DATA --- */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
            
            {/* HISTORIQUE */}
            <div className="bg-[#131B2C] rounded-xl border border-slate-800 flex flex-col overflow-hidden flex-1 min-h-0 shadow-lg">
                <div className="p-3 border-b border-slate-800 bg-[#162036] flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-white text-xs flex gap-2 items-center"><Activity size={12}/> Flux Transactions</h2>
                    <div className="flex gap-1">
                        <button onClick={() => setFilter('all')} className={`p-1 rounded ${filter==='all' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><Search size={12}/></button>
                        <button onClick={() => setFilter('fraud')} className={`p-1 rounded ${filter==='fraud' ? 'bg-red-600 text-white' : 'text-slate-500'}`}><AlertTriangle size={12}/></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {filteredHistory.map((tx, i) => (
                        <div key={i} className={`p-2 rounded border text-xs flex justify-between items-center animate-in fade-in slide-in-from-top-1 ${tx.is_fraud ? 'bg-red-900/10 border-red-900/30' : 'bg-[#0B0F19] border-slate-800'}`}>
                            <div>
                                <div className="font-bold text-slate-200">${tx.amt} <span className="text-[9px] text-slate-500 font-normal">({tx.homeName || 'Unk'} → {tx.merchName || 'Unk'})</span></div>
                                <div className="text-[9px] text-slate-500">{tx.timestamp}</div>
                            </div>
                            <div className={`font-mono font-bold ${(tx.risk_score*100) > 40 ? 'text-red-400' : 'text-green-400'}`}>
                                {(tx.risk_score * 100).toFixed(0)}%
                            </div>
                        </div>
                    ))}
                    {filteredHistory.length === 0 && <div className="text-center text-[10px] text-slate-600 mt-10 italic">En attente de flux...</div>}
                </div>
                <div className="p-1 bg-[#0B0F19] border-t border-slate-800 text-[9px] text-center text-slate-500">
                    {history.length} logs
                </div>
            </div>

            {/* MATRICE */}
            <div className="h-auto shrink-0">
                <ConfusionMatrix />
            </div>
        </div>
      </div>
    </main>
  );
}