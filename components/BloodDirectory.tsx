import React, { useState, useMemo } from 'react';
import { FamilyMember } from '../types';
import { Search, Heart, MapPin, Phone, Droplets, Info, Filter, ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from '../utils/i18n';

interface Props {
  members: FamilyMember[];
  language: string;
}

const BloodDirectory: React.FC<Props> = ({ members, language }) => {
  const [bloodFilter, setBloodFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const t = (key: string) => TRANSLATIONS[language]?.[key] || key;

  const donors = useMemo(() => {
    return members.filter(m => {
      if (!m.bloodGroup || m.status !== 'Approved') return false;
      const matchesBlood = bloodFilter ? m.bloodGroup === bloodFilter : true;
      const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           m.currentAddress.city.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesBlood && matchesSearch;
    }).sort((a, b) => (a.bloodGroup || '').localeCompare(b.bloodGroup || ''));
  }, [members, bloodFilter, searchTerm]);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-red-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 flex items-center justify-center md:justify-start gap-3">
              <Droplets className="text-red-400 animate-pulse" /> {t('bloodDirectory')}
            </h1>
            <p className="text-red-100 font-medium opacity-80 max-w-md">Community life-saving directory. Find voluntary donors within our Samaj in times of emergency.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {bloodGroups.map(group => (
              <button
                key={group}
                onClick={() => setBloodFilter(bloodFilter === group ? '' : group)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all border-2 ${bloodFilter === group ? 'bg-white text-red-900 border-white shadow-xl scale-110' : 'bg-red-950/30 text-white border-red-800/50 hover:bg-red-800/50'}`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by donor name or city..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-red-100 rounded-2xl outline-none transition-all font-bold text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Donor List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donors.map(donor => (
          <div key={donor.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all flex items-center gap-6 group">
            <div className="w-16 h-16 rounded-[20px] bg-red-50 flex items-center justify-center text-red-600 font-black text-xl border-2 border-red-100 group-hover:bg-red-600 group-hover:text-white transition-colors duration-500">
              {donor.bloodGroup}
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="font-black text-gray-900 uppercase truncate leading-tight mb-1">{language === 'English' ? donor.fullName : donor.nativeName}</h3>
               <div className="flex items-center gap-4">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={10} /> {donor.currentAddress.city}
                 </p>
                 <a href={`tel:${donor.mobile}`} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                    <Phone size={10} /> {donor.mobile}
                 </a>
               </div>
            </div>
            <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-red-50 transition-colors">
               <ArrowRight size={16} className="text-gray-300 group-hover:text-red-500" />
            </div>
          </div>
        ))}

        {donors.length === 0 && (
          <div className="col-span-full py-20 text-center border-4 border-dashed border-gray-100 rounded-[40px]">
             <Droplets size={64} className="mx-auto text-gray-100 mb-4" />
             <p className="text-gray-400 font-black uppercase tracking-widest">No donors listed for this group</p>
          </div>
        )}
      </div>

      {/* Emergency Disclaimer */}
      <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100 flex items-start gap-6">
         <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg">
            <Info size={24} />
         </div>
         <div>
            <h4 className="font-black text-emerald-900 uppercase tracking-tight mb-2">Emergency Information</h4>
            <p className="text-emerald-700/80 text-sm leading-relaxed max-w-2xl">
               This directory is a voluntary listing of community members. Please coordinate directly with the donors. The Samaj Sanstha provides this data only to facilitate connectivity during critical medical needs.
            </p>
         </div>
      </div>
    </div>
  );
};

export default BloodDirectory;