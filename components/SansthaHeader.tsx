
import React from 'react';
import { SansthaSettings } from '../types';
import { Menu, Settings, Languages, ShieldCheck } from 'lucide-react';

interface Props {
  settings: SansthaSettings;
  toggleSidebar: () => void;
  onOpenSettings: () => void;
  isAdmin: boolean;
  language: string;
  setLanguage: (lang: string) => void;
}

const SansthaHeader: React.FC<Props> = ({ settings, toggleSidebar, onOpenSettings, isAdmin, language, setLanguage }) => {
  return (
    <header className="bg-orange-600 text-white shadow-2xl sticky top-0 z-50 print:hidden border-b-4 border-orange-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-orange-700 rounded-xl transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-white rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="Official Logo" 
                  className="relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white object-cover shadow-lg bg-white p-0.5" 
                />
              ) : (
                <div className="relative w-12 h-12 rounded-full bg-white text-orange-600 flex items-center justify-center font-black text-2xl shadow-lg">
                  {settings.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black leading-none tracking-tighter uppercase">{settings.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black bg-orange-700 px-2 py-0.5 rounded text-orange-100 tracking-widest flex items-center gap-1">
                  <ShieldCheck size={10} /> OFFICIAL
                </span>
                <p className="text-xs text-orange-100 font-bold opacity-80 uppercase tracking-widest">Kawadiya Gotra • Burhanpur</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center bg-orange-700/60 rounded-xl px-3 py-1.5 border border-orange-500/50 shadow-inner">
             <Languages size={18} className="text-orange-200 mr-2" />
             <select 
               value={language}
               onChange={(e) => setLanguage(e.target.value)}
               className="bg-transparent text-white text-sm font-bold border-none focus:ring-0 cursor-pointer py-1"
             >
               <option value="English" className="text-gray-900">English</option>
               <option value="Hindi" className="text-gray-900">Hindi</option>
               <option value="Gujarati" className="text-gray-900">Gujarati</option>
               <option value="Marathi" className="text-gray-900">Marathi</option>
             </select>
          </div>

          {isAdmin && (
            <button 
              onClick={onOpenSettings}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center space-x-2 border border-white/20 shadow-lg"
              title="Sanstha Settings"
            >
              <Settings size={20} />
              <span className="hidden md:inline text-sm font-black uppercase tracking-widest">Settings</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default SansthaHeader;
