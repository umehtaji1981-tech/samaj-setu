
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FamilyMember, Language, User } from '../types';
import { autoFillNativeDetails } from '../services/geminiService';
// Fix: Added missing MapPin and ShieldCheck icons
import { Loader2, Upload, Sparkles, X, Languages, Save, Info, FileText, Trash2, Paperclip, CheckCircle, AlertCircle, Camera, User as UserIcon, AlertTriangle, Users, Plus, Edit2, Crown, MapPin, ShieldCheck } from 'lucide-react';

interface Props {
  initialData?: Partial<FamilyMember>;
  allMembers: FamilyMember[];
  onSubmit: (mainMember: FamilyMember, otherMembers?: FamilyMember[]) => void;
  onCancel: () => void;
  existingFamilies: string[];
  currentUser: User | null;
  currentFamilyMembers?: FamilyMember[];
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const normalizeName = (s?: string) => s?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
const normalizeMobile = (s?: string) => s?.replace(/\D/g, '') || '';

const RELATIONS = ['Wife', 'Husband', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Grandson', 'Granddaughter', 'Daughter-in-law', 'Son-in-law', 'Other'];

const BiodataForm: React.FC<Props> = ({ initialData, allMembers, onSubmit, onCancel, currentUser, currentFamilyMembers = [] }) => {
  const isAdmin = currentUser?.role === 'Admin';
  
  const [formData, setFormData] = useState<Partial<FamilyMember>>(() => {
    const baseId = initialData?.id || generateId();
    const baseFamilyId = initialData?.familyId || generateId();
    
    return {
      id: baseId,
      status: isAdmin ? 'Approved' : 'Pending',
      currentAddress: { street: '', city: '', state: '', pincode: '', country: 'India', ...initialData?.currentAddress },
      education: '',
      occupation: '',
      familyId: baseFamilyId,
      isHeadOfFamily: initialData?.isHeadOfFamily ?? (currentFamilyMembers.length === 0),
      mobile: initialData?.mobile || '', 
      gender: 'Male',
      maritalStatus: 'Single',
      documents: [],
      ...initialData
    };
  });

  // Household members (excluding the current member being edited)
  const [subMembers, setSubMembers] = useState<FamilyMember[]>(() => {
    if (formData.isHeadOfFamily) {
      return currentFamilyMembers.filter(m => m.id !== formData.id);
    }
    return [];
  });

  const [activeSubMemberIndex, setActiveSubMemberIndex] = useState<number | null>(null);

  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [targetLang, setTargetLang] = useState<Language>('Hindi');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const duplicateInfo = useMemo(() => {
    const currentName = normalizeName(formData.fullName);
    const currentMobile = normalizeMobile(formData.mobile);
    const currentDob = formData.dob;

    if (!currentName && !currentMobile) return { entry: null, isNameDup: false, isMobileDup: false, isPotentialDup: false };

    const strictEntry = allMembers.find(m => {
        if (m.id === formData.id) return false;
        const mMobile = normalizeMobile(m.mobile);
        const mName = normalizeName(m.fullName);
        const mDob = m.dob;
        const mobileMatch = currentMobile && mMobile && mMobile === currentMobile && m.status !== 'Draft';
        const nameAndDobMatch = currentName && mName === currentName && currentDob && mDob === currentDob;
        return mobileMatch || nameAndDobMatch;
    });

    if (strictEntry) {
      return {
        entry: strictEntry,
        isNameDup: currentName && normalizeName(strictEntry.fullName) === currentName && strictEntry.dob === currentDob,
        isMobileDup: currentMobile && normalizeMobile(strictEntry.mobile) === currentMobile,
        isPotentialDup: false
      };
    }

    const potentialEntry = allMembers.find(m => {
        if (m.id === formData.id) return false;
        const mName = normalizeName(m.fullName);
        return currentName && mName === currentName && currentName.length > 3;
    });

    return {
      entry: potentialEntry || null,
      isNameDup: false,
      isMobileDup: false,
      isPotentialDup: !!potentialEntry
    };
  }, [formData.fullName, formData.mobile, formData.dob, formData.id, allMembers]);

  const duplicateEntry = duplicateInfo.entry;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      currentAddress: { 
        ...(prev.currentAddress || { street: '', city: '', state: '', pincode: '', country: 'India' }), 
        [name]: value 
      }
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubMember = () => {
    const newMember: FamilyMember = {
      id: generateId(),
      fullName: '',
      gender: 'Male',
      dob: '',
      maritalStatus: 'Single',
      education: '',
      occupation: '',
      currentAddress: formData.currentAddress || { street: '', city: '', state: '', pincode: '', country: 'India' },
      mobile: '',
      familyId: formData.familyId!,
      isHeadOfFamily: false,
      status: formData.status as any,
      relationToHead: 'Son'
    };
    setSubMembers([...subMembers, newMember]);
    setActiveSubMemberIndex(subMembers.length);
  };

  const handleSubMemberChange = (index: number, field: keyof FamilyMember, value: any) => {
    const updated = [...subMembers];
    updated[index] = { ...updated[index], [field]: value };
    setSubMembers(updated);
  };

  const triggerAI = async () => {
    if (!formData.fullName && !formData.nativePlace) return;
    setAiStatus('loading');
    try {
      const translated = await autoFillNativeDetails(formData, targetLang);
      setFormData(prev => ({
        ...prev,
        nativeName: translated.fullName || prev.nativeName,
        nativeNativePlace: translated.nativeNativePlace || prev.nativeNativePlace,
        nativeOccupation: translated.occupation || prev.nativeOccupation,
        nativeEducation: translated.education || prev.nativeEducation,
        nativeCurrentAddress: translated.currentAddress || prev.nativeCurrentAddress,
        nativeGotra: translated.gotra || prev.nativeGotra
      }));
      setAiStatus('success');
      setTimeout(() => setAiStatus('idle'), 3000);
    } catch (e) {
      setAiStatus('error');
      setTimeout(() => setAiStatus('idle'), 3000);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.dob) {
      alert("Name and DOB are required.");
      return;
    }
    
    if (duplicateEntry && !duplicateInfo.isPotentialDup) {
      alert("A strict duplicate was found. Submission blocked.");
      return;
    }

    const mainMember: FamilyMember = {
      ...formData as FamilyMember,
      id: formData.id!,
      fullName: formData.fullName!,
      dob: formData.dob!,
      familyId: formData.familyId!,
      currentAddress: formData.currentAddress!,
      status: formData.status as any
    };

    // Synchronize family context to sub-members
    const finalSubMembers = subMembers.map(sm => ({
      ...sm,
      familyId: mainMember.familyId,
      currentAddress: mainMember.currentAddress,
      nativeCurrentAddress: mainMember.nativeCurrentAddress,
      nativePlace: mainMember.nativePlace,
      nativeNativePlace: mainMember.nativeNativePlace,
      gotra: mainMember.gotra,
      nativeGotra: mainMember.nativeGotra
    }));

    onSubmit(mainMember, finalSubMembers);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-0 max-w-5xl mx-auto border-t-8 border-orange-600 max-h-[90vh] overflow-hidden flex flex-col transition-all">
      {/* Header */}
      <div className="bg-white border-b px-8 py-5 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {formData.isHeadOfFamily ? <Crown className="text-orange-500" /> : <UserIcon className="text-orange-500" />}
            {initialData?.id ? 'Edit Profile' : 'New Registration'}
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            {formData.isHeadOfFamily ? 'Managing Head & Household' : 'Individual Profile Update'}
          </p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin">
        {/* Core Profile Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
             <div className="flex flex-col items-center gap-4 shrink-0">
                <div className="relative w-32 h-32">
                   {formData.photoUrl ? (
                     <img src={formData.photoUrl} className="w-full h-full object-cover rounded-3xl border-4 border-white shadow-xl" />
                   ) : (
                     <div className="w-full h-full bg-orange-50 rounded-3xl flex items-center justify-center text-orange-200 border-2 border-dashed border-orange-100">
                        <Camera size={40} />
                     </div>
                   )}
                   <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-orange-600 text-white p-3 rounded-2xl shadow-lg border-4 border-white"><Edit2 size={16} /></button>
                   <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isHead" checked={formData.isHeadOfFamily} onChange={e => setFormData({...formData, isHeadOfFamily: e.target.checked})} className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500" />
                  <label htmlFor="isHead" className="text-xs font-black text-gray-600 uppercase">Head of Family</label>
                </div>
             </div>

             <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                   <Sparkles className="text-orange-500" size={20} />
                   <div className="flex-1 flex items-center gap-3">
                      <select value={targetLang} onChange={e => setTargetLang(e.target.value as Language)} className="text-xs font-bold border-gray-200 rounded-xl bg-white p-2">
                        {['Hindi', 'Gujarati', 'Marathi'].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <button type="button" onClick={triggerAI} disabled={aiStatus === 'loading'} className="text-xs font-black uppercase text-orange-600 hover:text-orange-700 disabled:opacity-50">
                        {aiStatus === 'loading' ? 'Processing...' : 'Auto-Fill Native Fields'}
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name (English) *</label>
                      <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-orange-400 outline-none" required />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Native Name</label>
                      <input type="text" name="nativeName" value={formData.nativeName || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:border-orange-400 outline-none" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DOB *</label>
                        <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none">
                           <option value="Male">Male</option>
                           <option value="Female">Female</option>
                        </select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</label>
                      <input type="tel" name="mobile" value={formData.mobile || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" />
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Origin & Education Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t pt-10">
           <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><MapPin size={18} className="text-orange-500" /> Origin Details</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-gray-400 uppercase">Native Place (Eng)</label>
                   <input type="text" name="nativePlace" value={formData.nativePlace || ''} onChange={handleChange} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-gray-400 uppercase">Gotra (Eng)</label>
                   <input type="text" name="gotra" value={formData.gotra || ''} onChange={handleChange} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-gray-400 uppercase">Current Address</label>
                 <textarea name="street" value={formData.currentAddress?.street || ''} onChange={(e: any) => handleAddressChange(e)} className="w-full p-3 bg-gray-50 border rounded-xl text-xs font-medium h-20 resize-none" placeholder="Street Address" />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" name="city" value={formData.currentAddress?.city || ''} onChange={(e: any) => handleAddressChange(e)} placeholder="City" className="p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                    <input type="text" name="pincode" value={formData.currentAddress?.pincode || ''} onChange={(e: any) => handleAddressChange(e)} placeholder="Pincode" className="p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                 </div>
              </div>
           </div>
           <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><FileText size={18} className="text-orange-500" /> Career & Health</h3>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Education</label>
                      <input type="text" name="education" value={formData.education || ''} onChange={handleChange} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Occupation</label>
                      <input type="text" name="occupation" value={formData.occupation || ''} onChange={handleChange} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-gray-400 uppercase">Marital Status</label>
                       <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold">
                          {['Single', 'Married', 'Divorced', 'Widowed'].map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-gray-400 uppercase">Blood Group</label>
                       <select name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold">
                          <option value="">Select</option>
                          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => <option key={b} value={b}>{b}</option>)}
                       </select>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Household Members Section (Only for Head of Family) */}
        {formData.isHeadOfFamily && (
          <section className="border-t-4 border-dashed border-gray-100 pt-10 space-y-6">
             <div className="flex justify-between items-center">
                <div>
                   <h3 className="text-xl font-black text-gray-950 uppercase tracking-tight flex items-center gap-2"><Users size={22} className="text-orange-600" /> Other Household Members</h3>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage spouse, children, and parents in this household</p>
                </div>
                <button type="button" onClick={handleAddSubMember} className="bg-orange-600 text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-orange-700 transition-transform active:scale-95 shadow-lg">
                   <Plus size={16} /> Add Member
                </button>
             </div>

             <div className="space-y-4">
                {subMembers.map((member, index) => (
                  <div key={member.id} className="bg-gray-50 border-2 border-gray-100 rounded-3xl overflow-hidden transition-all hover:border-orange-200">
                     <div className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                           <div className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center text-orange-200 shrink-0">
                              {member.photoUrl ? <img src={member.photoUrl} className="w-full h-full object-cover rounded-2xl" /> : <UserIcon size={24} />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-black text-gray-900 truncate uppercase text-sm leading-tight">
                                {member.fullName || <span className="text-gray-300 italic">New Member Name</span>}
                              </h4>
                              <div className="flex gap-4 mt-1">
                                 <span className="text-[10px] font-black text-orange-600 uppercase bg-orange-100 px-2 py-0.5 rounded-lg">{member.relationToHead}</span>
                                 <span className="text-[10px] font-black text-gray-400 uppercase">{member.gender} • {member.dob || 'DOB missing'}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button type="button" onClick={() => setActiveSubMemberIndex(activeSubMemberIndex === index ? null : index)} className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:text-orange-600 transition-colors">
                              <Edit2 size={18} />
                           </button>
                           <button type="button" onClick={() => setSubMembers(subMembers.filter((_, i) => i !== index))} className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 size={18} />
                           </button>
                        </div>
                     </div>

                     {activeSubMemberIndex === index && (
                       <div className="p-6 bg-white border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase">Full Name *</label>
                             <input type="text" value={member.fullName} onChange={e => handleSubMemberChange(index, 'fullName', e.target.value)} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase">Relation to Head *</label>
                             <select value={member.relationToHead} onChange={e => handleSubMemberChange(index, 'relationToHead', e.target.value)} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold">
                                {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase">DOB</label>
                                <input type="date" value={member.dob} onChange={e => handleSubMemberChange(index, 'dob', e.target.value)} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase">Gender</label>
                                <select value={member.gender} onChange={e => handleSubMemberChange(index, 'gender', e.target.value)} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold">
                                   <option value="Male">Male</option>
                                   <option value="Female">Female</option>
                                </select>
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase">Education</label>
                             <input type="text" value={member.education} onChange={e => handleSubMemberChange(index, 'education', e.target.value)} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase">Occupation</label>
                             <input type="text" value={member.occupation} onChange={e => handleSubMemberChange(index, 'occupation', e.target.value)} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase">Mobile</label>
                             <input type="tel" value={member.mobile} onChange={e => handleSubMemberChange(index, 'mobile', e.target.value)} className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" />
                          </div>
                       </div>
                     )}
                  </div>
                ))}

                {subMembers.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-[40px] text-gray-300">
                     <Users size={48} className="mx-auto opacity-10 mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No other family members listed yet.</p>
                  </div>
                )}
             </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
         <div className="flex items-center gap-3">
            <div className="bg-orange-100 text-orange-700 p-2 rounded-xl">
               <ShieldCheck size={20} />
            </div>
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Data Privacy</p>
               <p className="text-[10px] font-bold text-gray-600">Securely encrypted for community use only</p>
            </div>
         </div>
         <div className="flex gap-4 w-full md:w-auto">
            <button type="button" onClick={onCancel} className="flex-1 md:flex-none px-8 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors">Discard</button>
            <button type="button" onClick={handleFormSubmit} className="flex-1 md:flex-none px-12 py-3 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-200 hover:bg-orange-700 transition-transform active:scale-95 flex items-center justify-center gap-2">
               <Save size={18} /> Save & Synchronize Household
            </button>
         </div>
      </div>
    </div>
  );
};

export default BiodataForm;
