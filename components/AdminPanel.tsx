
import React, { useRef, useState, useEffect } from 'react';
import { FamilyMember, SansthaSettings, CommitteeMember, Sponsor, DeceasedMember } from '../types';
import { extractFamilyFromDocument, extractFamilyFromRawText } from '../services/geminiService';
import { Check, X, Settings, Upload, Users, Plus, Trash2, Image as ImageIcon, Zap, Save, Loader2, Camera, Languages, ScrollText, Flower2, ClipboardList, AlertCircle, Building2, MapPin, Mail, Calendar, FileText, Phone, User as UserIcon, Heart, Megaphone } from 'lucide-react';
import { TRANSLATIONS } from '../utils/i18n';

interface Props {
  members: FamilyMember[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  settings: SansthaSettings;
  onUpdateSettings: (s: SansthaSettings) => void;
  onBulkAddMembers?: (members: FamilyMember[]) => void;
  language: string;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const normalizeName = (s?: string) => s?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
const normalizeMobile = (s?: string) => s?.replace(/\D/g, '') || '';

const AdminPanel: React.FC<Props> = ({ members, onApprove, onReject, settings, onUpdateSettings, onBulkAddMembers, language }) => {
  const pendingMembers = members.filter(m => m.status === 'Pending');
  const docImportRef = useRef<HTMLInputElement>(null);
  const logoUploadRef = useRef<HTMLInputElement>(null);
  const t = (key: string) => TRANSLATIONS[language]?.[key] || key;

  const [activeAdminTab, setActiveAdminTab] = useState<'approvals' | 'import' | 'settings' | 'committee' | 'sponsors' | 'memoriam' | 'ads'>('approvals');
  const [importing, setImporting] = useState(false);
  const [extractedMembers, setExtractedMembers] = useState<FamilyMember[]>([]);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [smartPasteText, setSmartPasteText] = useState('');
  const [activeImportMode, setActiveImportMode] = useState<'paste' | 'upload'>('paste');

  const [localSettings, setLocalSettings] = useState<SansthaSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    alert("Settings Saved Successfully!");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size too large. Max 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const rawData = await extractFamilyFromDocument(base64Data, file.type);
        processExtractedData(rawData);
      } catch (err: any) {
        console.error("File import failed:", err);
        alert(err.message || "Failed to extract data from the selected document.");
      } finally {
        setImporting(false);
        if (docImportRef.current) docImportRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const processExtractedData = (rawData: any[]) => {
    if (!Array.isArray(rawData)) return;
    const familyMap: Record<string, string> = {};
    let dupes = 0;
    
    const currentBatch: FamilyMember[] = [...extractedMembers];
    const newMembers: FamilyMember[] = [];

    rawData.forEach(item => {
      const idx = String(item.familyGroupIndex || '0');
      if (!familyMap[idx]) familyMap[idx] = generateId();

      const itemMobile = normalizeMobile(item.mobile);
      const itemName = normalizeName(item.fullName);
      const itemDob = item.dob;

      const isDuplicateInExisting = members.some(m => {
        const mMobile = normalizeMobile(m.mobile);
        const mName = normalizeName(m.fullName);
        return (itemMobile && mMobile === itemMobile) || (itemName === mName && itemDob === m.dob);
      });

      const isDuplicateInBatch = [...currentBatch, ...newMembers].some(em => {
        const emMobile = normalizeMobile(em.mobile);
        const emName = normalizeName(em.fullName);
        return (itemMobile && emMobile === itemMobile) || (itemName === emName && itemDob === em.dob);
      });

      if (isDuplicateInExisting || isDuplicateInBatch) {
        dupes++;
        return;
      }

      const newMember = {
        id: generateId(),
        familyId: familyMap[idx],
        fullName: item.fullName || 'Unknown Member',
        nativeName: item.nativeName || '',
        gender: (item.gender === 'Female' ? 'Female' : 'Male') as any,
        dob: item.dob || '1990-01-01',
        mobile: item.mobile || '',
        maritalStatus: (item.maritalStatus || 'Single') as any,
        education: item.education || '',
        nativeEducation: item.nativeEducation || '',
        occupation: item.occupation || '',
        nativeOccupation: item.nativeOccupation || '',
        nativePlace: item.nativePlace || '',
        nativeNativePlace: item.nativeNativePlace || '',
        gotra: item.gotra || '',
        nativeGotra: item.nativeGotra || '',
        isHeadOfFamily: !!item.isHeadOfFamily,
        relationToHead: item.relationToHead || (item.isHeadOfFamily ? 'Self' : 'Member'),
        currentAddress: { 
            street: item.currentAddress?.street || '', 
            city: item.currentAddress?.city || '', 
            state: item.currentAddress?.state || '', 
            pincode: item.currentAddress?.pincode || '', 
            country: 'India' 
        },
        nativeCurrentAddress: item.nativeCurrentAddress || '',
        status: 'Approved'
      } as FamilyMember;

      newMembers.push(newMember);
    });

    setExtractedMembers(prev => [...prev, ...newMembers]);
    setDuplicatesCount(prev => prev + dupes);
  };

  const handleSmartPaste = async () => {
    if (!smartPasteText.trim()) return;
    setImporting(true);
    try {
      const rawData = await extractFamilyFromRawText(smartPasteText);
      processExtractedData(rawData);
      setSmartPasteText('');
    } catch (err: any) {
      alert(err.message || "AI extraction failed.");
    } finally {
      setImporting(false);
    }
  };

  const handleCommitImport = () => {
    if (onBulkAddMembers && extractedMembers.length > 0) {
      onBulkAddMembers(extractedMembers);
      setExtractedMembers([]);
      setDuplicatesCount(0);
      alert(`${extractedMembers.length} members imported successfully!`);
    }
  };

  const handleAddCommitteeMember = (isOther: boolean = false) => {
    const newMember: CommitteeMember = { id: generateId(), name: '', role: isOther ? 'Member' : 'President', mobile: '' };
    if (isOther) {
      setLocalSettings({ ...localSettings, otherMembers: [...(localSettings.otherMembers || []), newMember] });
    } else {
      setLocalSettings({ ...localSettings, committeeMembers: [...localSettings.committeeMembers, newMember] });
    }
  };

  const handleRemoveCommitteeMember = (id: string, isOther: boolean) => {
    if (isOther) {
      setLocalSettings({ ...localSettings, otherMembers: (localSettings.otherMembers || []).filter(m => m.id !== id) });
    } else {
      setLocalSettings({ ...localSettings, committeeMembers: localSettings.committeeMembers.filter(m => m.id !== id) });
    }
  };

  const handleUpdateCommitteeMember = (id: string, updates: Partial<CommitteeMember>, isOther: boolean) => {
    if (isOther) {
      setLocalSettings({ 
        ...localSettings, 
        otherMembers: (localSettings.otherMembers || []).map(m => m.id === id ? { ...m, ...updates } : m) 
      });
    } else {
      setLocalSettings({ 
        ...localSettings, 
        committeeMembers: localSettings.committeeMembers.map(m => m.id === id ? { ...m, ...updates } : m) 
      });
    }
  };

  const handleAddSponsor = () => {
    const newSponsor: Sponsor = { id: generateId(), name: '', imageUrl: '' };
    setLocalSettings({ ...localSettings, sponsors: [...localSettings.sponsors, newSponsor] });
  };

  const handleRemoveSponsor = (id: string) => {
    setLocalSettings({ ...localSettings, sponsors: localSettings.sponsors.filter(s => s.id !== id) });
  };

  const handleUpdateSponsor = (id: string, updates: Partial<Sponsor>) => {
    setLocalSettings({ 
      ...localSettings, 
      sponsors: localSettings.sponsors.map(s => s.id === id ? { ...s, ...updates } : s) 
    });
  };

  const handleAddDeceased = () => {
    const newDeceased: DeceasedMember = { id: generateId(), name: '', passingDate: new Date().toISOString().split('T')[0] };
    setLocalSettings({ ...localSettings, deceasedMembers: [...(localSettings.deceasedMembers || []), newDeceased] });
  };

  const handleRemoveDeceased = (id: string) => {
    setLocalSettings({ ...localSettings, deceasedMembers: (localSettings.deceasedMembers || []).filter(m => m.id !== id) });
  };

  const handleUpdateDeceased = (id: string, updates: Partial<DeceasedMember>) => {
    setLocalSettings({ 
      ...localSettings, 
      deceasedMembers: (localSettings.deceasedMembers || []).map(m => m.id === id ? { ...m, ...updates } : m) 
    });
  };

  const handlePhotoUploadGeneric = (onResult: (res: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => onResult(re.target?.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-wrap gap-2 p-1 bg-gray-200 rounded-2xl w-fit print:hidden">
        {[
          { id: 'approvals', label: 'pendingApprovals', icon: Check },
          { id: 'import', label: 'importData', icon: Zap },
          { id: 'settings', label: 'samsthaSettings', icon: Settings },
          { id: 'committee', label: 'manageCommittee', icon: Users },
          { id: 'memoriam', label: 'manageMemoriam', icon: Flower2 },
          { id: 'sponsors', label: 'manageSponsors', icon: ImageIcon },
          { id: 'ads', label: 'Back Cover Ads', icon: Megaphone },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeAdminTab === tab.id ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon size={18} />
            {t(tab.label)}
            {tab.id === 'approvals' && pendingMembers.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{pendingMembers.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-4">
         <button onClick={handleSaveSettings} className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-orange-700 flex items-center gap-2 transition-transform active:scale-95">
           <Save size={20} /> Save All Panel Changes
         </button>
      </div>

      {activeAdminTab === 'ads' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase">Back Cover Advertisements</h2>
                <p className="text-sm text-gray-500 font-medium">Showcase premium sponsors on the final page of the booklet.</p>
              </div>
              <button 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (re) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          advertisements: [...(prev.advertisements || []), re.target?.result as string]
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
                className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700"
              >
                <Plus size={18} /> Add Advertisement
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {(localSettings.advertisements || []).map((ad, index) => (
                <div key={index} className="relative group rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm aspect-video bg-gray-50">
                  <img src={ad} className="w-full h-full object-contain" alt={`Ad ${index}`} />
                  <button 
                    onClick={() => {
                      setLocalSettings(prev => ({
                        ...prev,
                        advertisements: (prev.advertisements || []).filter((_, i) => i !== index)
                      }));
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(localSettings.advertisements || []).length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                  No back-cover advertisements added yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'settings' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h2 className="text-3xl font-black text-gray-950 uppercase tracking-tighter flex items-center gap-3">
                    <Settings className="text-orange-500" /> Samaj Sanstha Settings
                  </h2>
                  <p className="text-gray-500 font-medium">Manage organization identity, branding, and global configuration.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-50 p-8 rounded-[40px] border-2 border-dashed border-gray-200 text-center group transition-colors hover:border-orange-200">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Official Samaj Logo</h3>
                  <div className="relative w-48 h-48 mx-auto mb-8">
                     <div className="absolute inset-0 bg-orange-100 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                     {localSettings.logoUrl ? (
                       <img src={localSettings.logoUrl} alt="Samaj Logo" className="relative w-48 h-48 object-contain rounded-full border-4 border-white shadow-2xl bg-white p-2" />
                     ) : (
                       <div className="relative w-48 h-48 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center text-gray-300">
                          <ImageIcon size={64} />
                       </div>
                     )}
                     <button 
                       onClick={() => logoUploadRef.current?.click()}
                       className="absolute bottom-2 right-2 p-4 bg-orange-600 text-white rounded-full shadow-xl hover:bg-orange-700 transition-transform active:scale-90"
                       title="Upload New Logo"
                     >
                       <Camera size={24} />
                     </button>
                  </div>
                  <input type="file" ref={logoUploadRef} onChange={handleLogoUpload} accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Supports JPEG, PNG, SVG (Max 2MB)</p>
                </div>

                <div className="bg-stone-50 p-6 rounded-[32px] border border-stone-100">
                   <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">President Desk Details</h3>
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400">President Name (Eng)</label>
                        <input type="text" value={localSettings.presidentName || ''} onChange={e => setLocalSettings({...localSettings, presidentName: e.target.value})} className="w-full text-xs font-bold p-2 bg-white border rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400">President Name (Native)</label>
                        <input type="text" value={localSettings.nativePresidentName || ''} onChange={e => setLocalSettings({...localSettings, nativePresidentName: e.target.value})} className="w-full text-xs font-bold p-2 bg-white border rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400">President Message (Eng)</label>
                        <textarea value={localSettings.presidentMessage || ''} onChange={e => setLocalSettings({...localSettings, presidentMessage: e.target.value})} className="w-full text-[10px] p-2 bg-white border rounded-xl h-24 resize-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400">President Message (Native)</label>
                        <textarea value={localSettings.nativePresidentMessage || ''} onChange={e => setLocalSettings({...localSettings, nativePresidentMessage: e.target.value})} className="w-full text-[10px] p-2 bg-white border rounded-xl h-24 resize-none" />
                      </div>
                   </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Building2 size={14} /> Organization Name (English)</label>
                    <input type="text" value={localSettings.name} onChange={e => setLocalSettings({...localSettings, name: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black text-gray-900 focus:border-orange-200 outline-none transition-colors" placeholder="e.g. Shree Gujrati Mode Vanik Samaj" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Languages size={14} /> Organization Name (Native)</label>
                    <input type="text" value={localSettings.nativeName} onChange={e => setLocalSettings({...localSettings, nativeName: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-900 focus:border-orange-200 outline-none transition-colors" placeholder="श्री गुजराती मोઢ વણિક સમાજ" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><FileText size={14} /> Registration Number</label>
                    <input type="text" value={localSettings.registrationNumber} onChange={e => setLocalSettings({...localSettings, registrationNumber: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-mono font-bold text-gray-700 focus:border-orange-200 outline-none transition-colors" placeholder="REG/2023/1234" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Calendar size={14} /> Established Year</label>
                    <input type="text" value={localSettings.establishedYear} onChange={e => setLocalSettings({...localSettings, establishedYear: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black text-gray-700 focus:border-orange-200 outline-none transition-colors" placeholder="1985" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><MapPin size={14} /> Official Address (English)</label>
                    <textarea value={localSettings.address} onChange={e => setLocalSettings({...localSettings, address: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-medium text-gray-700 focus:border-orange-200 outline-none transition-colors h-20 resize-none" placeholder="Enter complete office address" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Languages size={14} /> Official Address (Native)</label>
                    <textarea value={localSettings.nativeAddress || ''} onChange={e => setLocalSettings({...localSettings, nativeAddress: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:border-orange-200 outline-none transition-colors h-20 resize-none" placeholder="कार्यालय का पूरा पता यहाँ लिखें" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><ScrollText size={14} /> Samaj History (English)</label>
                    <textarea value={localSettings.samajHistory || ''} onChange={e => setLocalSettings({...localSettings, samajHistory: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-medium text-gray-700 focus:border-orange-200 outline-none transition-colors h-32 resize-none" placeholder="Describe Samaj heritage and origin" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Languages size={14} /> Samaj History (Native)</label>
                    <textarea value={localSettings.nativeSamajHistory || ''} onChange={e => setLocalSettings({...localSettings, nativeSamajHistory: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:border-orange-200 outline-none transition-colors h-32 resize-none" placeholder="समाज का इतिहास यहाँ लिखें" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'committee' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase">Managing Committee</h2>
                    <p className="text-sm text-gray-500 font-medium">Core leadership roles (President, Secretary, etc.)</p>
                 </div>
                 <button onClick={() => handleAddCommitteeMember(false)} className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700">
                    <Plus size={18} /> Add Role
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {localSettings.committeeMembers.map((member) => (
                   <div key={member.id} className="p-6 border-2 border-gray-100 rounded-[32px] bg-gray-50/50 hover:border-orange-100 transition-colors relative group">
                      <button onClick={() => handleRemoveCommitteeMember(member.id, false)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
                      <div className="flex flex-col items-center gap-4">
                         <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-white border-2 border-orange-100 flex items-center justify-center overflow-hidden">
                               {member.photoUrl ? <img src={member.photoUrl} className="w-full h-full object-cover" /> : <UserIcon size={32} className="text-gray-200" />}
                            </div>
                            <button onClick={() => handlePhotoUploadGeneric(res => handleUpdateCommitteeMember(member.id, { photoUrl: res }, false))} className="absolute -bottom-1 -right-1 p-2 bg-white rounded-full shadow-md border text-orange-600"><Camera size={12} /></button>
                         </div>
                         <div className="w-full space-y-3">
                            <input type="text" value={member.name} onChange={e => handleUpdateCommitteeMember(member.id, { name: e.target.value }, false)} placeholder="Name (Eng)" className="w-full p-2 bg-white border rounded-xl text-xs font-black uppercase" />
                            <input type="text" value={member.nativeName} onChange={e => handleUpdateCommitteeMember(member.id, { nativeName: e.target.value }, false)} placeholder="Name (Native)" className="w-full p-2 bg-white border rounded-xl text-xs font-bold" />
                            <select value={member.role} onChange={e => handleUpdateCommitteeMember(member.id, { role: e.target.value }, false)} className="w-full p-2 bg-white border rounded-xl text-xs font-black uppercase">
                               {['President', 'Vice President', 'Secretary', 'Treasurer', 'Jt. Secretary', 'Member'].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <div className="flex items-center gap-2 p-2 bg-white border rounded-xl">
                               <Phone size={12} className="text-gray-400" />
                               <input type="tel" value={member.mobile} onChange={e => handleUpdateCommitteeMember(member.id, { mobile: e.target.value }, false)} placeholder="Mobile" className="w-full text-xs font-bold outline-none" />
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase">Other Executive Members</h2>
                    <p className="text-sm text-gray-500 font-medium">Volunteers and general executive body members</p>
                 </div>
                 <button onClick={() => handleAddCommitteeMember(true)} className="bg-gray-800 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-black">
                    <Plus size={18} /> Add Member
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {(localSettings.otherMembers || []).map((member) => (
                   <div key={member.id} className="p-4 border rounded-2xl bg-gray-50 flex items-center gap-3 relative group">
                      <div className="flex-1 min-w-0 space-y-2">
                         <input type="text" value={member.name} onChange={e => handleUpdateCommitteeMember(member.id, { name: e.target.value }, true)} placeholder="Name" className="w-full p-1 bg-transparent border-b text-xs font-black uppercase outline-none focus:border-orange-400" />
                         <input type="tel" value={member.mobile} onChange={e => handleUpdateCommitteeMember(member.id, { mobile: e.target.value }, true)} placeholder="Mobile" className="w-full p-1 bg-transparent text-[10px] font-bold outline-none" />
                      </div>
                      <button onClick={() => handleRemoveCommitteeMember(member.id, true)} className="text-red-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeAdminTab === 'sponsors' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-10 border-b pb-4">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase">Compliments & Sponsors</h2>
                    <p className="text-sm text-gray-500 font-medium">Entities supporting the directory publication</p>
                 </div>
                 <button onClick={handleAddSponsor} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-green-700 flex items-center gap-2 transition-transform active:scale-95">
                   <Plus size={20} /> Add New Sponsor
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {localSettings.sponsors.map((sponsor) => (
                   <div key={sponsor.id} className="bg-gray-50 rounded-[40px] p-6 border-2 border-transparent hover:border-orange-100 transition-all group relative">
                      <button onClick={() => handleRemoveSponsor(sponsor.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                      <div className="flex flex-col items-center gap-6">
                         <div className="w-full aspect-video bg-white rounded-[32px] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
                            {sponsor.imageUrl ? (
                              <img src={sponsor.imageUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center text-gray-300">
                                 <ImageIcon size={48} />
                                 <span className="text-[10px] font-black uppercase mt-2">No Advertisement Logo</span>
                              </div>
                            )}
                            <button onClick={() => handlePhotoUploadGeneric(res => handleUpdateSponsor(sponsor.id, { imageUrl: res }))} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-black uppercase text-xs gap-2">
                               <Camera size={18} /> Update Image
                            </button>
                         </div>
                         <div className="w-full">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-1 block">Sponsor Name / Firm Name</label>
                            <input type="text" value={sponsor.name} onChange={e => handleUpdateSponsor(sponsor.id, { name: e.target.value })} placeholder="e.g. Gandhi Textiles" className="w-full p-4 bg-white border-2 border-gray-100 rounded-3xl font-black uppercase text-center focus:border-orange-200 outline-none" />
                         </div>
                      </div>
                   </div>
                 ))}
                 {localSettings.sponsors.length === 0 && (
                   <div className="col-span-full py-20 text-center border-4 border-dashed border-gray-100 rounded-[40px] text-gray-300">
                      <ImageIcon size={64} className="mx-auto opacity-20 mb-4" />
                      <p className="font-black uppercase tracking-widest">No sponsors added yet</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeAdminTab === 'memoriam' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-10 border-b pb-4">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase">Shradhanjali (Memoriam)</h2>
                    <p className="text-sm text-gray-500 font-medium">Homage to members who have passed away</p>
                 </div>
                 <button onClick={handleAddDeceased} className="bg-stone-800 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-black flex items-center gap-2 transition-transform active:scale-95">
                   <Flower2 size={20} /> Add Record
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {(localSettings.deceasedMembers || []).map((member) => (
                   <div key={member.id} className="p-6 bg-stone-50 border-2 border-stone-100 rounded-[40px] flex gap-6 relative group">
                      <button onClick={() => handleRemoveDeceased(member.id)} className="absolute top-4 right-4 text-stone-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                      <div className="w-32 shrink-0">
                         <div className="aspect-[3/4] bg-white rounded-3xl border-4 border-white shadow-xl overflow-hidden flex items-center justify-center relative grayscale group-hover:grayscale-0 transition-all">
                            {member.photoUrl ? <img src={member.photoUrl} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-stone-200" />}
                            <button onClick={() => handlePhotoUploadGeneric(res => handleUpdateDeceased(member.id, { photoUrl: res }))} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><Camera size={24} /></button>
                         </div>
                      </div>
                      <div className="flex-1 space-y-3">
                         <input type="text" value={member.name} onChange={e => handleUpdateDeceased(member.id, { name: e.target.value })} placeholder="Name (Eng)" className="w-full p-2 bg-white border rounded-xl text-xs font-black uppercase" />
                         <input type="text" value={member.nativeName} onChange={e => handleUpdateDeceased(member.id, { nativeName: e.target.value })} placeholder="Name (Native)" className="w-full p-2 bg-white border rounded-xl text-sm font-bold" />
                         <div className="flex items-center gap-2 p-2 bg-white border rounded-xl">
                            <Calendar size={14} className="text-stone-400" />
                            <input type="date" value={member.passingDate} onChange={e => handleUpdateDeceased(member.id, { passingDate: e.target.value })} className="w-full text-xs font-bold outline-none" />
                         </div>
                         <div className="space-y-2">
                            <textarea value={member.tribute} onChange={e => handleUpdateDeceased(member.id, { tribute: e.target.value })} placeholder="Short Tribute Message (English)..." className="w-full p-3 bg-white border rounded-2xl text-[10px] font-medium h-16 resize-none" />
                            <textarea value={member.nativeTribute} onChange={e => handleUpdateDeceased(member.id, { nativeTribute: e.target.value })} placeholder="श्रद्धांजलि संदेश (Native Script)..." className="w-full p-3 bg-white border rounded-2xl text-[10px] font-bold h-16 resize-none" />
                         </div>
                      </div>
                   </div>
                 ))}
                 {(localSettings.deceasedMembers || []).length === 0 && (
                    <div className="col-span-full py-20 text-center border-4 border-dashed border-stone-100 rounded-[40px] text-stone-300">
                        <Flower2 size={64} className="mx-auto opacity-20 mb-4" />
                        <p className="font-black uppercase tracking-widest">No memoriam records added</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeAdminTab === 'approvals' && (
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3"><Check className="text-orange-500" /> Pending Approvals</h2>
          {pendingMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Check className="mx-auto mb-2 opacity-20" size={48} />
              <p className="font-medium">All clear! No pending approvals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-4">
                    <img src={m.photoUrl || 'https://picsum.photos/100'} className="w-12 h-12 rounded-full object-cover" />
                    <div><p className="font-bold text-gray-900">{m.fullName}</p><p className="text-xs text-gray-500">{m.mobile}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onReject(m.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><X size={20} /></button>
                    <button onClick={() => onApprove(m.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-full"><Check size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
            <h2 className="text-2xl font-black text-gray-950 mb-6 flex items-center gap-3"><Zap className="text-orange-500" /> AI-Powered Member Import</h2>
            <div className="flex gap-4 mb-8">
               <button onClick={() => setActiveImportMode('paste')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase text-sm border-2 transition-all ${activeImportMode === 'paste' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-gray-100 text-gray-400'}`}>
                  <ClipboardList size={18} /> Cut & Paste Text
               </button>
               <button onClick={() => setActiveImportMode('upload')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase text-sm border-2 transition-all ${activeImportMode === 'upload' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-gray-100 text-gray-400'}`}>
                  <Upload size={18} /> Upload Documents
               </button>
            </div>
            {activeImportMode === 'paste' ? (
              <div className="space-y-4">
                 <textarea value={smartPasteText} onChange={e => setSmartPasteText(e.target.value)} placeholder="Example: 1) Shri Tarun Gandhi (Burhanpur) - 7696903206..." className="w-full h-64 p-6 bg-gray-50 border-2 border-gray-100 rounded-[32px] font-medium text-gray-700 resize-none focus:border-orange-200 outline-none" />
                 <button onClick={handleSmartPaste} disabled={importing || !smartPasteText.trim()} className="w-full bg-gray-950 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                    {importing ? <Loader2 className="animate-spin" /> : <Zap size={20} />} Start Smart Import
                 </button>
              </div>
            ) : (
              <div className="p-12 border-4 border-dashed border-gray-100 rounded-[40px] text-center bg-gray-50/50">
                 <button onClick={() => docImportRef.current?.click()} disabled={importing} className="bg-gray-950 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center gap-3 mx-auto disabled:opacity-50">
                   {importing ? <Loader2 className="animate-spin" /> : <Upload size={20} />} Select File
                 </button>
                 <input type="file" ref={docImportRef} onChange={handleFileImport} className="hidden" accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,image/*" />
              </div>
            )}
          </div>
          {extractedMembers.length > 0 && (
            <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-xl font-black text-gray-900">Review {extractedMembers.length} Extracted Profiles</h3>
                   <p className="text-sm text-gray-500 font-bold">{duplicatesCount} duplicates ignored.</p>
                 </div>
                 <button onClick={handleCommitImport} className="bg-green-600 text-white px-8 py-2 rounded-xl font-black text-xs uppercase shadow-lg">Save All Members</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                 {extractedMembers.map((m, i) => (
                   <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div><p className="font-bold text-gray-900">{m.fullName}</p><p className="text-xs text-orange-600 font-black">{m.nativeName || 'No Native Name'}</p></div>
                      <button onClick={() => setExtractedMembers(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 size={16} /></button>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
