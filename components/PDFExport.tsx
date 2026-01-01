import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FamilyMember, SansthaSettings, DeceasedMember } from '../types';
import { Printer, X, MapPin, User as UserIcon, Download, Loader2, ShieldCheck, Users, Languages, ImageIcon, ScrollText, Flower2, Heart, Phone, BookOpen, Calendar, Info, Home, Crown } from 'lucide-react';
import { TRANSLATIONS } from '../utils/i18n';

interface Props {
  mode: 'single' | 'booklet';
  familyHead?: FamilyMember;
  allMembers: FamilyMember[];
  settings: SansthaSettings;
  onClose: () => void;
  language: string;
}

declare var html2pdf: any;

const PDFExport: React.FC<Props> = ({ mode, familyHead, allMembers, settings, onClose, language }) => {
  const [lang, setLang] = useState<string>(language || 'English');
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setLang(language);
  }, [language]);

  const t = (key: string) => {
    const targetLang = TRANSLATIONS[lang] || TRANSLATIONS['English'];
    return targetLang[key] || TRANSLATIONS['English'][key] || key;
  };

  const isNative = lang !== 'English';
  const samajDisplayName = (isNative ? settings.nativeName : settings.name) || settings.name;
  const samajDisplayAddress = (isNative ? settings.nativeAddress : settings.address) || settings.address;

  const calculateAge = (dob: string) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(isNative ? 'hi-IN' : 'en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const familiesToPrint = useMemo(() => {
    if (mode === 'single' && familyHead) return [familyHead];
    
    const families: Record<string, FamilyMember[]> = {};
    allMembers.forEach(m => {
      if (!families[m.familyId]) families[m.familyId] = [];
      families[m.familyId].push(m);
    });

    return Object.values(families)
      .filter(members => members.some(m => m.status === 'Approved' || m.status === 'Draft'))
      .map(members => members.find(m => m.isHeadOfFamily) || members[0])
      .sort((a, b) => {
        const nameA = (isNative ? a.nativeName : a.fullName) || a.fullName;
        const nameB = (isNative ? b.nativeName : b.fullName) || b.fullName;
        return nameA.localeCompare(nameB);
      });
  }, [mode, familyHead, allMembers, isNative]);

  const layout = useMemo(() => {
    let current = 1;
    const p: Record<string, number> = {};
    if (mode === 'booklet') {
      p.cover = current++;
      p.intro = current++; 
      // Synchronize Memoriam page detection
      if (settings.deceasedMembers && settings.deceasedMembers.length > 0) {
        p.memoriam = current++;
      }
      p.committee = current++;
      if (settings.sponsors && settings.sponsors.length > 0) {
        p.sponsors = current++;
      }
      p.index = current++;
    }
    p.biodataStart = current;
    const familiesPerPage = mode === 'booklet' ? 2 : 1;
    current += Math.ceil(familiesToPrint.length / familiesPerPage);
    if (mode === 'booklet') {
      p.contactsStart = current;
      const contactPages = Math.ceil(familiesToPrint.length / 15);
      current += contactPages;
      p.backCover = current++;
    }
    return { pages: p, total: current - 1 };
  }, [mode, familiesToPrint, settings.committeeMembers, settings.sponsors, settings.deceasedMembers]);

  const handleDownloadPDF = async () => {
    if (!pdfContentRef.current) return;
    setIsGenerating(true);
    const element = pdfContentRef.current;
    const opt = {
      margin: 0,
      filename: `${samajDisplayName.replace(/\s+/g, '_')}_Booklet.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    try {
      if (typeof html2pdf !== 'undefined') {
        await html2pdf().set(opt).from(element).save();
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const PageBase: React.FC<{ children?: React.ReactNode; pageNum?: number; showWatermark?: boolean; noPadding?: boolean; variant?: 'normal' | 'dignified' | 'royal' }> = ({ children, pageNum, showWatermark = false, noPadding = false, variant = 'normal' }) => {
    const isOdd = (pageNum || 0) % 2 !== 0;
    const paddingLeft = noPadding ? "0" : (isOdd ? "25mm" : "15mm");
    const paddingRight = noPadding ? "0" : (isOdd ? "15mm" : "25mm");
    
    return (
      <div className={`pdf-page ${isNative ? 'lang-hindi' : ''} ${variant === 'dignified' ? 'bg-stone-50' : variant === 'royal' ? 'bg-orange-50/10' : 'bg-white'}`} style={{ paddingLeft, paddingRight, paddingTop: noPadding ? '0' : '10mm', paddingBottom: noPadding ? '0' : '10mm', height: '296.5mm', width: '210mm', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', pageBreakAfter: 'always', position: 'relative' }}>
        {showWatermark && settings.logoUrl && !noPadding && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
             <img src={settings.logoUrl} className={`w-[500px] h-[500px] object-contain rotate-[-15deg] ${variant === 'dignified' ? 'grayscale' : ''}`} crossOrigin="anonymous" />
          </div>
        )}
        <div className="relative z-10 flex flex-col h-full">{children}</div>
      </div>
    );
  };

  const PageHeader = ({ variant = 'normal' }: { variant?: 'normal' | 'dignified' }) => (
    <div className={`flex items-center justify-between border-b-2 ${variant === 'dignified' ? 'border-stone-200' : 'border-orange-200'} pb-3 mb-3 w-full shrink-0`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 ${variant === 'dignified' ? 'border-stone-300' : 'border-orange-100'} overflow-hidden shadow-sm`}>
          {settings.logoUrl ? <img src={settings.logoUrl} className={`w-full h-full object-contain ${variant === 'dignified' ? 'grayscale' : ''}`} alt="Logo" crossOrigin="anonymous" /> : <span className="text-orange-600 font-black text-lg">{samajDisplayName.charAt(0)}</span>}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm uppercase font-black tracking-tight ${variant === 'dignified' ? 'text-stone-800' : 'text-orange-950'}`}>{samajDisplayName}</span>
          <span className="text-[7px] text-gray-400 font-bold font-sans leading-none">{samajDisplayAddress}</span>
        </div>
      </div>
      <div className={`text-right text-[8px] font-black uppercase flex flex-col ${variant === 'dignified' ? 'text-stone-600' : 'text-orange-600'}`}>
         <span>{t('directory')} {new Date().getFullYear()}</span>
      </div>
    </div>
  );

  const PageFooter = ({ pageNum, customText, variant = 'normal' }: { pageNum?: number; customText?: string; variant?: 'normal' | 'dignified' }) => (
    <div className={`mt-auto w-full border-t border-gray-100 pt-2 flex justify-between items-end text-[8px] text-gray-400 shrink-0`}>
      <span className={`font-black uppercase tracking-widest text-[6px] ${variant === 'dignified' ? 'text-stone-700' : 'text-orange-800'}`}>{samajDisplayName}</span>
      {customText ? <div className="font-black text-gray-300 text-[7px] uppercase tracking-widest">{customText}</div> : <div className="font-bold text-gray-400">{t('page')} {pageNum}</div>}
    </div>
  );

  const FamilyBiodataBlock: React.FC<{ head: FamilyMember; isBottom?: boolean }> = ({ head, isBottom = false }) => {
    const familyMembers = allMembers.filter(m => m.familyId === head.familyId && m.id !== head.id);
    const hName = (isNative ? head.nativeName : head.fullName) || head.fullName;
    const hAddress = head.currentAddress;
    const hAddressStr = `${hAddress.street}, ${hAddress.city}, ${hAddress.state} - ${hAddress.pincode}`;
    const hAddressNative = head.nativeCurrentAddress || hAddressStr;

    return (
      <div className={`flex flex-col h-[132mm] w-full ${!isBottom ? 'border-b-4 border-double border-orange-5 pb-4 mb-4' : ''}`}>
        <div className="flex justify-between items-start border-b-2 border-orange-100 pb-2 mb-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-gray-900 leading-tight mb-1 uppercase tracking-tight truncate pr-4">{hName}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full font-black text-[7px] uppercase tracking-widest flex items-center gap-1 shadow-sm">
                <MapPin size={8} /> {(isNative ? head.nativeNativePlace : head.nativePlace) || head.nativePlace || '-'}
              </span>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full font-black text-[7px] uppercase tracking-widest flex items-center gap-1 shadow-sm">
                <Info size={8} /> {t('Head')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-3 shrink-0 items-start h-[45mm]">
          <div className="w-[20%]">
            <div className="aspect-[4/5] bg-white rounded-2xl border-2 border-orange-5 shadow-md overflow-hidden flex items-center justify-center">
              {head.photoUrl ? <img src={head.photoUrl} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <UserIcon size={32} className="text-orange-50" />}
            </div>
          </div>
          <div className="w-[80%] grid grid-cols-3 gap-2">
            <div className="col-span-1 p-2 bg-white border border-orange-5 rounded-xl shadow-sm flex flex-col justify-center">
              <p className="text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{t('dob')}</p>
              <p className="font-black text-[9px] text-gray-900 leading-tight">{formatDate(head.dob)}</p>
              <div className="h-px bg-orange-50 my-1"></div>
              <p className="text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{t('age')}</p>
              <p className="font-black text-[9px] text-gray-900 leading-tight">{calculateAge(head.dob)} {isNative ? 'वर्ष' : 'Y'}</p>
            </div>
            <div className="col-span-1 p-2 bg-white border border-blue-50 rounded-xl shadow-sm flex flex-col justify-center">
              <p className="text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{t('occupation')}</p>
              <p className="font-black text-[9px] text-gray-900 truncate leading-tight">{(isNative ? head.nativeOccupation : head.occupation) || head.occupation}</p>
              <div className="h-px bg-blue-50 my-1"></div>
              <p className="text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{t('education')}</p>
              <p className="font-black text-[9px] text-gray-700 truncate leading-tight">{(isNative ? head.nativeEducation : head.education) || head.education}</p>
            </div>
            <div className="col-span-1 p-2 bg-white border border-green-50 rounded-xl shadow-sm flex flex-col justify-center">
              <p className="text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{t('mobile')}</p>
              <p className="font-black text-[10px] text-gray-900 leading-tight">{head.mobile}</p>
              <div className="h-px bg-green-50 my-1"></div>
              <p className="text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{t('marital')}</p>
              <p className="font-black text-[9px] text-gray-900 leading-tight">{t(head.maritalStatus)}</p>
            </div>
            <div className="col-span-3 p-2 bg-stone-50 border border-stone-100 rounded-xl flex flex-col justify-center min-h-[12mm]">
              <p className="text-[7px] text-stone-400 font-black uppercase tracking-widest leading-none mb-1">{t('address')}</p>
              <p className="font-bold text-[8px] text-stone-900 leading-relaxed italic line-clamp-2">
                {isNative ? hAddressNative : hAddressStr}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-1 shrink-0">
             <Users size={12} className="text-orange-600" />
             <h3 className="text-[10px] font-black text-gray-950 uppercase tracking-tight">{t('familyMembers')}</h3>
             <div className="h-0.5 bg-orange-100 flex-1 rounded-full"></div>
          </div>
          <div className="flex-1 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-gray-50 border-b border-gray-100 shrink-0">
                 <tr>
                   <th className="px-3 py-2 text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none w-2/5">{t('name')}</th>
                   <th className="px-3 py-2 text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none w-1/5">{t('relation')}</th>
                   <th className="px-3 py-2 text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none w-1/5 text-center">{t('dob')}</th>
                   <th className="px-3 py-2 text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none w-1/5 text-right">{t('mobile')}</th>
                 </tr>
              </thead>
              <tbody className="flex-1">
                 {familyMembers.length > 0 ? familyMembers.map((m, i) => (
                   <tr key={m.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'} border-b border-gray-50/20`}>
                     <td className="px-3 py-2 text-[9px] font-black text-gray-900 uppercase leading-normal truncate">
                        {(isNative ? m.nativeName : m.fullName) || m.fullName}
                     </td>
                     <td className="px-3 py-2 text-[8px] font-bold text-orange-600 uppercase leading-normal">
                        {t(m.relationToHead || 'Member')}
                     </td>
                     <td className="px-3 py-2 text-[8px] font-bold text-gray-600 leading-normal text-center whitespace-nowrap">
                        {formatDate(m.dob)}
                     </td>
                     <td className="px-3 py-2 text-[9px] font-black text-gray-800 leading-normal text-right">
                        {m.mobile || '-'}
                     </td>
                   </tr>
                 )) : (
                    <tr>
                       <td colSpan={4} className="px-4 py-8 text-center text-gray-300 text-[9px] font-black uppercase tracking-widest italic">
                          No additional family members registered
                       </td>
                    </tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-950/95 z-[100] overflow-auto flex justify-center p-4 print:p-0 print:bg-white print:absolute print:top-0 print:left-0 print:w-full">
      <div className="bg-white w-fit shadow-2xl relative print:shadow-none print:w-full">
        <div className="print:hidden sticky top-0 z-50 bg-gray-900 text-white p-4 flex flex-wrap gap-4 justify-between items-center shadow-2xl">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center font-black">PDF</div>
             <h3 className="font-black text-lg text-orange-400 uppercase tracking-tighter">Directory Booklet Preview</h3>
           </div>
           <div className="flex items-center gap-3">
             <div className="flex items-center bg-gray-800 rounded-xl px-3 py-1.5 border border-gray-700">
               <Languages size={16} className="text-orange-400 mr-2" />
               <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-transparent text-white text-xs font-bold border-none focus:ring-0 cursor-pointer">
                 {['English', 'Hindi', 'Gujarati', 'Marathi'].map(l => <option key={l} value={l} className="text-gray-900">{l}</option>)}
               </select>
             </div>
             <button onClick={handleDownloadPDF} disabled={isGenerating} className="flex items-center gap-2 bg-green-600 px-6 py-2 rounded-xl font-black text-xs uppercase text-white shadow-lg hover:bg-green-700 transition-all disabled:opacity-50">
               {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />} {isGenerating ? "Processing..." : "Download Booklet"}
             </button>
             <button onClick={() => window.print()} className="flex items-center gap-2 bg-orange-600 px-6 py-2 rounded-xl font-black text-xs uppercase text-white shadow-lg"><Printer size={14} /> Print Now</button>
             <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X size={24} /></button>
           </div>
        </div>

        <div id="pdf-container" ref={pdfContentRef} className={`print:block ${isNative ? 'lang-hindi' : 'font-serif'} text-gray-900 bg-white`}>
          {mode === 'booklet' && (
            <>
              {/* 1. FRONT COVER */}
              <PageBase pageNum={layout.pages.cover} noPadding={true} variant="royal">
                  <div className="flex-1 flex flex-col items-center justify-between py-24 text-center border-[15mm] border-double border-orange-100 m-[10mm] bg-white shadow-sm relative">
                     <div className="space-y-4">
                        <p className="text-orange-600 font-black text-sm uppercase tracking-[0.5em]">।। श्री गणेशाय नमः ।।</p>
                        <div className="h-0.5 bg-orange-100 w-48 mx-auto"></div>
                     </div>
                     <div className="flex flex-col items-center space-y-10">
                        <div className="w-64 h-64 rounded-full border-8 border-orange-5 p-6 bg-white shadow-2xl flex items-center justify-center">
                           {settings.logoUrl ? <img src={settings.logoUrl} className="object-contain w-full h-full" crossOrigin="anonymous" /> : <div className="text-orange-600 font-black text-8xl">{samajDisplayName.charAt(0)}</div>}
                        </div>
                        <h1 className="text-5xl font-black text-orange-950 uppercase leading-snug px-12">{samajDisplayName}</h1>
                        <div className="bg-orange-600 text-white px-8 py-3 rounded-full font-black text-xl shadow-xl flex items-center gap-3">
                           <BookOpen size={24} /> {t('directory')} {new Date().getFullYear()}
                        </div>
                     </div>
                     <div className="space-y-6">
                        <p className="text-xs text-orange-900 font-black uppercase tracking-[0.3em] max-w-sm leading-relaxed">{samajDisplayAddress}</p>
                        <div className="h-0.5 bg-orange-100 w-48 mx-auto"></div>
                     </div>
                  </div>
                  <PageFooter pageNum={layout.pages.cover} customText="FRONT COVER" />
              </PageBase>

              {/* 2. PRESIDENT MESSAGE & HERITAGE */}
              <PageBase pageNum={layout.pages.intro} showWatermark={true}>
                  <PageHeader />
                  <div className="flex-1 flex flex-col justify-between">
                     <section className="h-[45%] flex flex-col border-b-4 border-dashed border-orange-100 pb-8 mb-4">
                        <div className="flex items-center gap-5 mb-6 shrink-0">
                           <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-md">
                              <UserIcon size={20} />
                           </div>
                           <h2 className="text-2xl font-black text-gray-950 uppercase tracking-widest leading-relaxed">
                              {t('presidentMessage')}
                           </h2>
                        </div>
                        <div className="flex gap-10 items-start flex-1 min-h-0 overflow-hidden px-4">
                           <div className="w-40 h-40 rounded-[3rem] border-4 border-orange-5 overflow-hidden shadow-xl bg-gray-50 flex items-center justify-center shrink-0">
                              {settings.presidentPhotoUrl ? <img src={settings.presidentPhotoUrl} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <UserIcon size={64} className="text-orange-100" />}
                           </div>
                           <div className="flex-1 flex flex-col h-full">
                              <h3 className="font-black text-xl text-gray-900 uppercase mb-2 border-b-2 border-orange-100 pb-1 leading-normal">
                                 {(isNative ? settings.nativePresidentName : settings.presidentName) || settings.presidentName}
                              </h3>
                              <div className="text-[12px] text-gray-700 leading-relaxed font-serif italic overflow-hidden">
                                 <p className="whitespace-pre-line line-clamp-[10]">
                                    {(isNative ? settings.nativePresidentMessage : settings.presidentMessage) || settings.presidentMessage}
                                 </p>
                              </div>
                           </div>
                        </div>
                     </section>
                     <section className="h-[45%] flex flex-col pt-4">
                        <div className="flex items-center gap-5 mb-4 shrink-0">
                           <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-md">
                              <ScrollText size={20} />
                           </div>
                           <h2 className="text-2xl font-black text-gray-950 uppercase tracking-widest leading-relaxed">
                              {t('heritageHistory')}
                           </h2>
                        </div>
                        <div className="bg-orange-50/20 p-8 rounded-[4rem] border-2 border-orange-50 flex-1 min-h-0 overflow-hidden flex items-center justify-center">
                           <p className="text-[13px] text-gray-800 leading-relaxed font-serif whitespace-pre-line text-justify overflow-hidden line-clamp-[12]">
                              {(isNative ? settings.nativeSamajHistory : settings.samajHistory) || settings.samajHistory}
                           </p>
                        </div>
                     </section>
                  </div>
                  <PageFooter pageNum={layout.pages.intro} />
              </PageBase>

              {/* 3. SHRADHANJALI (MEMORIAM) - Explicitly restored */}
              {layout.pages.memoriam && (
                <PageBase pageNum={layout.pages.memoriam} variant="dignified" showWatermark={true}>
                    <PageHeader variant="dignified" />
                    <div className="text-center mb-6 border-b-2 border-stone-200 pb-4 shrink-0">
                       <h2 className="text-2xl font-black text-stone-900 uppercase tracking-widest font-serif leading-snug">{t('shradhanjali')}</h2>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-x-10 gap-y-8 content-start px-4 overflow-hidden">
                       {(settings.deceasedMembers || []).map((member) => (
                         <div key={member.id} className="flex gap-4 items-center border-b border-stone-100 pb-4">
                            <div className="w-16 h-20 bg-stone-100 rounded-lg border-2 border-white shadow-md grayscale flex items-center justify-center shrink-0 overflow-hidden">
                               {member.photoUrl ? <img src={member.photoUrl} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <UserIcon size={24} className="text-stone-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="font-bold text-sm text-stone-950 leading-tight mb-1 font-sans">
                                 {(isNative ? member.nativeName : member.name) || member.name}
                               </h4>
                               <div className="flex flex-col">
                                  <span className="text-[7px] font-black text-stone-400 uppercase tracking-widest">{t('dateOfPassing')}</span>
                                  <span className="text-[10px] font-black text-stone-700 uppercase italic">
                                    {member.nativePassingDate || member.passingDate}
                                  </span>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                    <PageFooter pageNum={layout.pages.memoriam} variant="dignified" customText="SHRADHANJALI" />
                </PageBase>
              )}

              {/* 4. COMMITTEE */}
              <PageBase pageNum={layout.pages.committee} showWatermark={true}>
                  <PageHeader />
                  <div className="flex-1 flex flex-col space-y-8 overflow-hidden">
                      <section>
                         <div className="flex items-center gap-3 mb-4 border-b-2 border-orange-100 pb-1">
                             <ShieldCheck size={20} className="text-orange-600" />
                             <h2 className="text-xl font-black text-gray-950 uppercase tracking-tight">{t('manageCommittee')}</h2>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            {(settings.committeeMembers || []).map((member) => (
                                <div key={member.id} className="flex items-center gap-3 p-2 border rounded-2xl border-orange-50 bg-orange-50/10 h-16">
                                    <div className="w-12 h-12 rounded-full bg-white border border-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {member.photoUrl ? <img src={member.photoUrl} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <UserIcon size={18} className="text-orange-100" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-[11px] text-gray-950 truncate uppercase leading-none mb-1">{(isNative ? member.nativeName : member.name) || member.name}</h4>
                                        <p className="text-orange-600 font-bold uppercase text-[8px] tracking-widest mb-1">{(isNative ? member.nativeRole : t(member.role)) || t(member.role)}</p>
                                        <p className="text-gray-400 font-medium text-[9px] flex items-center gap-1"><Phone size={8} /> {member.mobile}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                      </section>
                      <section className="flex-1 overflow-hidden">
                         <div className="flex items-center gap-3 mb-3 border-b-2 border-orange-100 pb-1">
                             <Users size={20} className="text-orange-600" />
                             <h2 className="text-xl font-black text-gray-950 uppercase tracking-tight">{t('otherExecutiveMembers')}</h2>
                         </div>
                         <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-sans">
                            {(settings.otherMembers || []).map((member, i) => (
                                <div key={member.id} className="flex items-center justify-between border-b border-gray-50 py-1.5 px-3 bg-gray-50/30 rounded-lg">
                                    <span className="font-bold text-[10px] text-gray-800 truncate uppercase">
                                        {i + 1}) {(isNative ? member.nativeName : member.name) || member.name}
                                    </span>
                                    <span className="text-[9px] text-orange-600 font-black shrink-0">{member.mobile}</span>
                                </div>
                            ))}
                         </div>
                      </section>
                  </div>
                  <PageFooter pageNum={layout.pages.committee} />
              </PageBase>

              {/* 5. SPONSORS */}
              {layout.pages.sponsors && (
                <PageBase pageNum={layout.pages.sponsors} showWatermark={true}>
                    <PageHeader />
                    <div className="text-center mb-6 border-b-2 border-orange-100 pb-4 shrink-0">
                       <h2 className="text-2xl font-black text-gray-950 uppercase tracking-widest">{t('bestCompliments')}</h2>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-6 content-start px-4">
                       {(settings.sponsors || []).map((sponsor) => (
                         <div key={sponsor.id} className="bg-white border-4 border-orange-50 rounded-[2rem] overflow-hidden shadow-lg p-3 flex flex-col items-center justify-center">
                            <div className="w-full aspect-video bg-gray-50 rounded-[1.5rem] overflow-hidden mb-3 border border-orange-100/50 flex items-center justify-center p-2">
                               {sponsor.imageUrl ? (
                                 <img src={sponsor.imageUrl} className="w-full h-full object-contain" alt={sponsor.name} crossOrigin="anonymous" />
                               ) : (
                                 <ImageIcon size={32} className="text-gray-200" />
                               )}
                            </div>
                            <h4 className="font-black text-sm text-gray-900 uppercase text-center mb-1 leading-tight">{sponsor.name}</h4>
                         </div>
                       ))}
                    </div>
                    <PageFooter pageNum={layout.pages.sponsors} />
                </PageBase>
              )}

              {/* 6. INDEX */}
              <PageBase pageNum={layout.pages.index} showWatermark={true}>
                  <PageHeader />
                  <div className="text-center mb-8 border-b-2 border-orange-100 pb-6 shrink-0">
                     <h2 className="text-3xl font-black text-gray-950 uppercase tracking-widest">{t('tableOfContents')}</h2>
                  </div>
                  <div className="space-y-6 flex-1 px-12 pt-8">
                     {[
                       { label: 'presidentMessage', page: layout.pages.intro },
                       { label: 'heritageHistory', page: layout.pages.intro },
                       { label: 'manageCommittee', page: layout.pages.committee },
                       { label: 'shradhanjali', page: layout.pages.memoriam, hide: !layout.pages.memoriam },
                       { label: 'sponsors', page: layout.pages.sponsors, hide: !layout.pages.sponsors },
                       { label: 'indexOfFamilies', page: layout.pages.biodataStart },
                       { label: 'contactList', page: layout.pages.contactsStart }
                     ].filter(i => !i.hide).map((item, idx) => (
                       <div key={idx} className="flex items-end justify-between border-b-2 border-dotted border-gray-200 pb-3">
                          <span className="text-xl font-black text-gray-800 uppercase tracking-tight leading-snug">{t(item.label)}</span>
                          <span className="text-xl font-black text-orange-600">{item.page}</span>
                       </div>
                     ))}
                  </div>
                  <PageFooter pageNum={layout.pages.index} />
              </PageBase>
            </>
          )}

          {/* FAMILY BIODATA PAGES */}
          {Array.from({ length: Math.ceil(familiesToPrint.length / (mode === 'booklet' ? 2 : 1)) }).map((_, pageIdx) => {
            const start = pageIdx * (mode === 'booklet' ? 2 : 1);
            const heads = familiesToPrint.slice(start, start + (mode === 'booklet' ? 2 : 1));
            const currentPageNum = layout.pages.biodataStart + pageIdx;
            
            return (
              <PageBase key={`biodata-page-${pageIdx}`} pageNum={currentPageNum} showWatermark={true}>
                <PageHeader />
                <div className="flex-1 flex flex-col justify-start h-full">
                  {heads.map((head, i) => (
                    <FamilyBiodataBlock 
                      key={head.id} 
                      head={head} 
                      isBottom={mode === 'booklet' ? i === 1 || heads.length === 1 && i === 0 : true} 
                    />
                  ))}
                </div>
                <PageFooter pageNum={currentPageNum} />
              </PageBase>
            );
          })}

          {/* CONTACT LIST PAGES */}
          {mode === 'booklet' && familiesToPrint.length > 0 && (
            Array.from({ length: Math.ceil(familiesToPrint.length / 15) }).map((_, pageIdx) => {
              const start = pageIdx * 15;
              const pageHeads = familiesToPrint.slice(start, start + 15);
              const currentPageNum = layout.pages.contactsStart + pageIdx;

              return (
                <PageBase key={`contact-page-${pageIdx}`} pageNum={currentPageNum} showWatermark={true}>
                  <PageHeader />
                  <div className="mb-8 shrink-0 border-b-[4px] border-orange-100 pb-6">
                    <h2 className="text-3xl font-black text-gray-950 uppercase tracking-widest leading-normal">
                       {t('contactList')}
                    </h2>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <tr className="border-b-2 border-gray-100">
                          <th className="px-4 py-4 text-left w-[8%]">#</th>
                          <th className="px-4 py-4 text-left w-[35%]">{t('name')}</th>
                          <th className="px-4 py-4 text-left w-[20%]">{t('mobile')}</th>
                          <th className="px-4 py-4 text-left w-[37%]">{t('address')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageHeads.map((m, i) => {
                          const addr = m.currentAddress;
                          const addrStr = (isNative && m.nativeCurrentAddress) 
                            ? m.nativeCurrentAddress 
                            : `${addr.street}, ${addr.city}, ${addr.state}`;
                          
                          return (
                            <tr key={m.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} border-b border-gray-100`}>
                              <td className="px-4 py-5 text-[11px] font-bold text-gray-400">{start + i + 1}</td>
                              <td className="px-4 py-5 text-[14px] font-black text-gray-900 uppercase">
                                {(isNative && m.nativeName) ? m.nativeName : m.fullName}
                              </td>
                              <td className="px-4 py-5 text-[14px] font-black text-orange-600">
                                {m.mobile || '-'}
                              </td>
                              <td className="px-4 py-5 text-[10px] font-medium text-gray-700 italic truncate">
                                {addrStr}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <PageFooter pageNum={currentPageNum} />
                </PageBase>
              );
            })
          )}

          {/* BACK COVER */}
          {mode === 'booklet' && (
            <PageBase pageNum={layout.pages.backCover} noPadding={true} variant="royal">
                <div className="flex-1 flex flex-col items-center justify-between py-20 text-center relative border-[15mm] border-double border-orange-100 m-[10mm] bg-white shadow-2xl">
                   <div className="space-y-6">
                      <div className="h-1 bg-orange-100 w-64 mx-auto rounded-full"></div>
                      <p className="text-orange-900 font-black text-xl uppercase tracking-[0.2em] leading-relaxed px-12">{samajDisplayName}</p>
                   </div>
                   <div className="w-full px-20">
                      <h4 className="text-[16px] font-black text-orange-600 uppercase tracking-[0.4em] mb-10 leading-loose border-b-2 border-orange-50 pb-4">Our Distinguished Patrons</h4>
                      <div className="grid grid-cols-2 gap-8">
                         {(settings.advertisements || []).slice(0, 4).map((ad, idx) => (
                           <div key={idx} className="bg-white rounded-[2rem] border-2 border-orange-50 aspect-video overflow-hidden shadow-md flex items-center justify-center p-4">
                              <img src={ad} className="max-w-full max-h-full object-contain" alt={`Patron ${idx}`} crossOrigin="anonymous" />
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="flex flex-col items-center space-y-12">
                      <div className="space-y-4">
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-relaxed">Central Office & Administration</p>
                         <p className="text-[12px] text-gray-700 font-bold max-w-lg font-sans italic leading-relaxed px-12">{samajDisplayAddress}</p>
                      </div>
                   </div>
                   <div className="space-y-8">
                      <div className="bg-orange-600 text-white px-12 py-4 rounded-[1.5rem] font-black text-[12px] uppercase shadow-lg tracking-[0.3em] leading-loose">End of Official Directory {new Date().getFullYear()}</div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em] leading-relaxed">Powered by SamajSetu Ecosystem</p>
                      <div className="h-1 bg-orange-100 w-48 mx-auto rounded-full"></div>
                   </div>
                </div>
                <PageFooter pageNum={layout.pages.backCover} customText="BACK COVER" />
            </PageBase>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFExport;