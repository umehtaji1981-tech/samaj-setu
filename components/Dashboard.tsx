
import React, { useMemo } from 'react';
import { FamilyMember, SansthaSettings } from '../types';
// Add Home to the imports from lucide-react
import { Users, UserCheck, Heart, Calendar, TrendingUp, Award, MapPin, Phone, ShieldCheck, Info, PlusCircle, BookOpen, Home } from 'lucide-react';
import { TRANSLATIONS } from '../utils/i18n';

interface Props {
  members: FamilyMember[];
  settings: SansthaSettings;
  onAddFamily: () => void;
  onViewDirectory: () => void;
  language: string;
}

const Dashboard: React.FC<Props> = ({ members, settings, onAddFamily, onViewDirectory, language }) => {
  const t = (key: string) => TRANSLATIONS[language]?.[key] || key;

  const stats = useMemo(() => {
    const families = new Set(members.map(m => m.familyId)).size;
    const total = members.length;
    const males = members.filter(m => m.gender === 'Male').length;
    const females = members.filter(m => m.gender === 'Female').length;
    
    // Calculate Age Distribution
    const ages = members.map(m => {
      if (!m.dob) return null;
      const age = new Date().getFullYear() - new Date(m.dob).getFullYear();
      return age;
    }).filter(a => a !== null) as number[];

    const children = ages.filter(a => a < 18).length;
    const youth = ages.filter(a => a >= 18 && a < 35).length;
    const adults = ages.filter(a => a >= 35 && a < 60).length;
    const seniors = ages.filter(a => a >= 60).length;

    const singleMarriageable = members.filter(m => 
      m.maritalStatus === 'Single' && 
      ((m.gender === 'Male' && (new Date().getFullYear() - new Date(m.dob).getFullYear()) >= 21) ||
       (m.gender === 'Female' && (new Date().getFullYear() - new Date(m.dob).getFullYear()) >= 18))
    ).length;

    return { families, total, males, females, children, youth, adults, seniors, singleMarriageable };
  }, [members]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden bg-orange-900 rounded-[40px] p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
          {settings.logoUrl && <img src={settings.logoUrl} className="w-full h-full object-contain rotate-12 scale-150" alt="Watermark" />}
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-orange-400 mb-2">Welcome to</h2>
            <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight tracking-tighter mb-4">
              {language === 'English' ? settings.name : settings.nativeName}
            </h1>
            <p className="text-orange-100/70 text-lg max-w-xl font-medium leading-relaxed mb-8">
              Connecting our global community through a digital bridge of heritage, unity, and progress.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button 
                onClick={onAddFamily}
                className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <PlusCircle size={20} /> Register Family
              </button>
              <button 
                onClick={onViewDirectory}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest backdrop-blur-md transition-all flex items-center gap-2"
              >
                <BookOpen size={20} /> Browse Directory
              </button>
            </div>
          </div>
          <div className="hidden lg:block w-72 h-72 rounded-[40px] bg-white p-4 shadow-2xl rotate-3">
             <img src={settings.logoUrl} className="w-full h-full object-contain" alt="Samaj Logo" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Families', value: stats.families, icon: Home, color: 'bg-blue-500', sub: 'Active households' },
          { label: 'Community Strength', value: stats.total, icon: Users, color: 'bg-orange-600', sub: 'Registered members' },
          { label: 'Gender Diversity', value: `${stats.males}M / ${stats.females}F`, icon: TrendingUp, color: 'bg-emerald-500', sub: 'Population spread' },
          { label: 'Marriage Profiles', value: stats.singleMarriageable, icon: Heart, color: 'bg-rose-500', sub: 'Eligible matches' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Committee Highlights */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-4">
                <h3 className="text-xl font-black text-gray-950 uppercase tracking-tight flex items-center gap-3">
                  <Award className="text-orange-500" /> Leadership Desk
                </h3>
             </div>
             <div className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center text-center bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden mb-4">
                    {settings.presidentPhotoUrl ? (
                      <img src={settings.presidentPhotoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <UserCheck size={48} />
                      </div>
                    )}
                  </div>
                  <h4 className="font-black text-gray-900 uppercase">{language === 'English' ? settings.presidentName : settings.nativePresidentName}</h4>
                  <p className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Samaj President</p>
                  <p className="text-xs text-gray-600 italic leading-relaxed line-clamp-3">
                    {language === 'English' ? settings.presidentMessage : settings.nativePresidentMessage}
                  </p>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Key Committee Members</h4>
                   {settings.committeeMembers.slice(1, 5).map(m => (
                     <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl hover:border-orange-100 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                             {m.photoUrl ? <img src={m.photoUrl} className="w-full h-full rounded-full object-cover" /> : <UserCheck size={14} />}
                           </div>
                           <div className="min-w-0">
                              <p className="text-xs font-black text-gray-900 truncate uppercase">{language === 'English' ? m.name : m.nativeName}</p>
                              <p className="text-[9px] text-orange-600 font-bold uppercase">{language === 'English' ? m.role : m.nativeRole}</p>
                           </div>
                        </div>
                        <span className="text-[9px] font-black text-gray-400">{m.mobile}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-4">
                <h3 className="text-xl font-black text-gray-950 uppercase tracking-tight flex items-center gap-3">
                  <Info className="text-orange-500" /> About Our Samaj
                </h3>
             </div>
             <p className="text-sm text-gray-700 leading-relaxed text-justify line-clamp-[6]">
                {language === 'English' ? settings.samajHistory : settings.nativeSamajHistory}
             </p>
             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-2xl">
                   <ShieldCheck className="text-orange-600 shrink-0" size={20} />
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Registration</p>
                      <p className="text-xs font-bold text-gray-800">{settings.registrationNumber || 'N/A'}</p>
                   </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-2xl">
                   <MapPin className="text-orange-600 shrink-0" size={20} />
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Headquarters</p>
                      <p className="text-xs font-bold text-gray-800">{language === 'English' ? settings.address : settings.nativeAddress}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Mini Directories & Birthday Highlights */}
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-950 uppercase tracking-tight mb-6 flex items-center gap-3">
                <Calendar className="text-orange-500" /> Age Distribution
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Children (0-17)', count: stats.children, color: 'bg-blue-400' },
                  // Fix: Removed duplicate 'count' property from the object below
                  { label: 'Youth (18-34)', count: stats.youth, color: 'bg-emerald-400' },
                  { label: 'Adults (35-59)', count: stats.adults, color: 'bg-orange-400' },
                  { label: 'Seniors (60+)', count: stats.seniors, color: 'bg-purple-400' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-1">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color}`} 
                        style={{ width: `${(item.count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-8 rounded-[40px] shadow-xl text-white">
              <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                <Phone /> Emergency Links
              </h3>
              <div className="space-y-3">
                 <a href={`mailto:${settings.contactEmail}`} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all">
                    <span className="text-xs font-bold">Email Desk</span>
                    <Info size={14} />
                 </a>
                 <div className="p-4 bg-white rounded-3xl mt-6">
                    <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Powered By</p>
                    <p className="text-orange-600 font-black text-sm italic">SamajSetu v1.2</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
