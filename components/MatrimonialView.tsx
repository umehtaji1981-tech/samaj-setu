import React, { useState, useMemo } from 'react';
import { FamilyMember } from '../types';
import { Search, Heart, MapPin, GraduationCap, Briefcase, Filter, User, Ruler, Weight, Phone, Info } from 'lucide-react';
import { TRANSLATIONS } from '../utils/i18n';

interface Props {
  members: FamilyMember[];
  language: string;
}

const MatrimonialView: React.FC<Props> = ({ members, language }) => {
  const [genderFilter, setGenderFilter] = useState<'Male' | 'Female'>('Male');
  const [searchTerm, setSearchTerm] = useState('');
  const [educationFilter, setEducationFilter] = useState('');

  const t = (key: string) => TRANSLATIONS[language]?.[key] || key;

  const eligibleProfiles = useMemo(() => {
    return members.filter(m => {
      if (m.maritalStatus !== 'Single' || m.status !== 'Approved') return false;
      
      const birthYear = new Date(m.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      
      // Basic age eligibility
      if (m.gender === 'Male' && age < 21) return false;
      if (m.gender === 'Female' && age < 18) return false;

      const matchesGender = m.gender === genderFilter;
      const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (m.nativeName && m.nativeName.includes(searchTerm)) ||
                           (m.nativePlace && m.nativePlace.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesEducation = educationFilter ? m.education.toLowerCase().includes(educationFilter.toLowerCase()) : true;

      return matchesGender && matchesSearch && matchesEducation;
    }).sort((a, b) => new Date(b.dob).getTime() - new Date(a.dob).getTime());
  }, [members, genderFilter, searchTerm, educationFilter]);

  const calculateAge = (dob: string) => {
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    return age;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* View Header */}
      <div className="bg-rose-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{t('matrimonialSection')}</h1>
            <p className="text-rose-100 font-medium opacity-80 max-w-md">Find compatible matches within our community based on education, values, and family background.</p>
          </div>
          <div className="flex bg-rose-950/50 p-2 rounded-3xl border border-rose-800/50 backdrop-blur-md">
            <button 
              onClick={() => setGenderFilter('Male')}
              className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${genderFilter === 'Male' ? 'bg-white text-rose-900 shadow-xl' : 'text-rose-200 hover:bg-white/10'}`}
            >
              {t('eligibleGrooms')}
            </button>
            <button 
              onClick={() => setGenderFilter('Female')}
              className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${genderFilter === 'Female' ? 'bg-white text-rose-900 shadow-xl' : 'text-rose-200 hover:bg-white/10'}`}
            >
              {t('eligibleBrides')}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, village, or gotra..." 
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-50 rounded-2xl focus:border-rose-200 outline-none transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              className="pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-rose-200 outline-none transition-all font-bold text-gray-700 text-sm appearance-none"
            >
              <option value="">All Education</option>
              <option value="Graduate">Graduate</option>
              <option value="Post Graduate">Post Graduate</option>
              <option value="Engineer">Engineer</option>
              <option value="Doctor">Doctor</option>
              <option value="CA">CA / CS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {eligibleProfiles.map(profile => (
          <div key={profile.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl transition-all group flex flex-col">
            <div className="relative aspect-[4/5] overflow-hidden bg-rose-50">
               {profile.photoUrl ? (
                 <img src={profile.photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={profile.fullName} />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-rose-200">
                    <User size={64} />
                 </div>
               )}
               <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-rose-600 shadow-sm">
                  {calculateAge(profile.dob)} Years
               </div>
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <h3 className="font-black text-lg uppercase leading-tight truncate">{language === 'English' ? profile.fullName : profile.nativeName}</h3>
                  <p className="text-xs font-bold opacity-80 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {language === 'English' ? profile.nativePlace : profile.nativeNativePlace}
                  </p>
               </div>
            </div>
            <div className="p-6 flex-1 flex flex-col space-y-4">
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('education')}</p>
                     <p className="text-[11px] font-bold text-gray-800 truncate">{language === 'English' ? profile.education : profile.nativeEducation}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('occupation')}</p>
                     <p className="text-[11px] font-bold text-gray-800 truncate">{language === 'English' ? profile.occupation : profile.nativeOccupation}</p>
                  </div>
               </div>

               <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-1">
                    <Info size={10} /> Gotra: {language === 'English' ? profile.gotra : profile.nativeGotra}
                  </span>
                  {profile.height && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-1">
                      <Ruler size={10} /> {profile.height}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-1">
                    <Heart size={10} /> {profile.maritalStatus}
                  </span>
               </div>

               <div className="pt-4 mt-auto">
                  <button className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2">
                    <Phone size={14} /> Contact Family
                  </button>
               </div>
            </div>
          </div>
        ))}

        {eligibleProfiles.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
            <Heart size={64} className="mx-auto text-rose-100 mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest">No profiles found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatrimonialView;