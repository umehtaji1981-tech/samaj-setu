
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FamilyMember, Language, User } from '../types';
import { autoFillNativeDetails } from '../services/geminiService';
import { Loader2, Upload, Sparkles, X, Languages, Save, Info, FileText, Trash2, Paperclip, CheckCircle, AlertCircle, Camera, User as UserIcon, AlertTriangle } from 'lucide-react';

interface Props {
  initialData?: Partial<FamilyMember>;
  allMembers: FamilyMember[];
  onSubmit: (data: FamilyMember, addAnother: boolean) => void;
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

  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [targetLang, setTargetLang] = useState<Language>('Hindi');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const duplicateInfo = useMemo(() => {
    const currentName = normalizeName(formData.fullName);
    const currentMobile = normalizeMobile(formData.mobile);
    const currentDob = formData.dob;

    if (!currentName && !currentMobile) return { entry: null, isNameDup: false, isMobileDup: false, isPotentialDup: false };

    // Strict duplicate (Mobile OR Name+DOB)
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

    // Potential duplicate (Name match but different or missing DOB)
    const potentialEntry = allMembers.find(m => {
        if (m.id === formData.id) return false;
        const mName = normalizeName(m.fullName);
        return currentName && mName === currentName && currentName.length > 3;
    });

    if (potentialEntry) {
      return {
        entry: potentialEntry,
        isNameDup: false,
        isMobileDup: false,
        isPotentialDup: true
      };
    }

    return { entry: null, isNameDup: false, isMobileDup: false, isPotentialDup: false };
  }, [formData.fullName, formData.mobile, formData.dob, formData.id, allMembers]);

  const duplicateEntry = duplicateInfo.entry;

  useEffect(() => {
    if (!isAdmin && currentUser?.role === 'User' && !formData.mobile) {
      setFormData(prev => ({ ...prev, mobile: currentUser.mobile }));
    }
  }, [isAdmin, currentUser]);

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
      if (file.size > 2 * 1024 * 1024) {
        alert("File size too large. Max 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAI = async () => {
    if (!formData.fullName && !formData.nativePlace) {
      alert("Please enter Name or Native Place first.");
      return;
    }
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
      console.error("AI Error", e);
      setAiStatus('error');
      setTimeout(() => setAiStatus('idle'), 3000);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitData(false, false);
  };

  const submitData = (isDraft: boolean, addAnother: boolean) => {
    if (!isDraft && (!formData.fullName || !formData.dob || !formData.gender)) {
      alert("Please fill required fields (Name, DOB, Gender) to submit.");
      return;
    }
    
    // Only block if it's a strict duplicate (not just potential)
    if (!isDraft && duplicateEntry && !duplicateInfo.isPotentialDup) {
        alert(`CRITICAL ERROR: A profile for "${duplicateEntry.fullName}" already exists with the same ${duplicateInfo.isMobileDup ? 'Mobile Number' : 'Name & Date of Birth'}. You cannot create a duplicate entry.`);
        return;
    }
    
    const finalStatus = isDraft 
        ? 'Draft' 
        : (isAdmin ? (formData.status === 'Draft' ? 'Approved' : formData.status || 'Approved') : 'Pending');

    const finalData: FamilyMember = {
      id: formData.id || generateId(),
      fullName: formData.fullName || '',
      gender: (formData.gender || 'Male') as any,
      dob: formData.dob || '',
      maritalStatus: (formData.maritalStatus || 'Single') as any,
      education: formData.education || '',
      occupation: formData.occupation || '',
      currentAddress: formData.currentAddress || { street: '', city: '', state: '', pincode: '', country: 'India' },
      mobile: formData.mobile || '',
      familyId: formData.familyId || generateId(),
      isHeadOfFamily: !!formData.isHeadOfFamily,
      status: finalStatus,
      nativeName: formData.nativeName,
      nativeEducation: formData.nativeEducation,
      nativeOccupation: formData.nativeOccupation,
      nativeCurrentAddress: formData.nativeCurrentAddress,
      bloodGroup: formData.bloodGroup,
      income: formData.income,
      gotra: formData.gotra,
      nativeGotra: formData.nativeGotra,
      nativePlace: formData.nativePlace,
      nativeNativePlace: formData.nativeNativePlace,
      email: formData.email,
      photoUrl: formData.photoUrl,
      relationToHead: formData.relationToHead || (formData.isHeadOfFamily ? 'Self' : ''),
      parentId: formData.parentId,
      spouseName: formData.spouseName,
      bio: formData.bio,
      documents: formData.documents || []
    };
    
    onSubmit(finalData, addAnother);
  };

  return (
    <div className={`bg-white rounded-lg shadow-xl p-0 max-w-5xl mx-auto border-t-4 ${duplicateEntry && !duplicateInfo.isPotentialDup ? 'border-red-500' : duplicateInfo.isPotentialDup ? 'border-yellow-500' : 'border-orange-500'} max-h-[90vh] overflow-hidden transition-colors flex flex-col`}>
      {/* Sticky Header and Alerts */}
      <div className="sticky top-0 bg-white z-[110] shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              {initialData?.id ? 'Edit Profile' : 'Add Family Member'}
              {formData.isHeadOfFamily && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full border border-orange-200">Head of Family</span>}
            </h2>
            <p className="text-sm text-gray-500">
               {formData.isHeadOfFamily ? 'Registering a new family unit' : `Adding member to household`}
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-red-500 transition-colors p-2">
            <X size={24} />
          </button>
        </div>

        {/* Duplicate Alerts - Made Sticky for maximum visibility */}
        {duplicateEntry && (
          <div className={`mt-4 p-3 rounded-xl border-2 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 ${duplicateInfo.isPotentialDup ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <AlertTriangle className={`shrink-0 ${duplicateInfo.isPotentialDup ? 'text-yellow-600' : 'text-red-600'}`} size={20} />
              <div className="flex-1">
                  <p className="font-black uppercase text-[10px] tracking-widest">{duplicateInfo.isPotentialDup ? 'Potential Match Found' : 'Duplicate Record Detected'}</p>
                  <p className="text-xs font-medium opacity-90 leading-snug">
                    {duplicateInfo.isPotentialDup 
                      ? `"${duplicateEntry.fullName}" is already in the directory. Please check if this is the same person before continuing.`
                      : `A profile for "${duplicateEntry.fullName}" matches the ${duplicateInfo.isMobileDup ? 'Mobile Number' : 'Name & Date of Birth'} provided.`
                    }
                  </p>
              </div>
              {formData.isHeadOfFamily && <span className="bg-white/50 px-2 py-1 rounded text-[10px] font-black uppercase">HOF CHECK</span>}
          </div>
        )}
      </div>

      <form className="p-6 space-y-6 overflow-y-auto" onSubmit={handleFormSubmit}>
        <div className="flex flex-col items-center justify-center mb-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
          <div className="relative w-32 h-32 mb-4">
             {formData.photoUrl ? (
               <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover rounded-full border-4 border-white shadow-md" />
             ) : (
               <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 shadow-inner">
                 <UserIcon size={40} className="text-gray-300" />
               </div>
             )}
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-full border border-orange-200 shadow-sm hover:bg-orange-50 transition-colors font-medium text-sm">
             <Camera size={16} />
             {formData.photoUrl ? 'Change Photo' : 'Upload Photo'}
           </button>
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
        </div>

        <div className="bg-orange-50 p-4 rounded-lg flex flex-wrap items-center gap-3 border border-orange-100 relative">
          <Sparkles className="text-orange-500" size={20} />
          <span className="text-sm font-medium text-gray-700">AI Helper:</span>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value as Language)} className="text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500">
            <option value="Hindi">Hindi</option>
            <option value="Gujarati">Gujarati</option>
            <option value="Marathi">Marathi</option>
          </select>
          <button type="button" onClick={triggerAI} disabled={aiStatus === 'loading'} className={`text-sm px-4 py-1.5 rounded-md flex items-center gap-2 transition-all shadow-sm font-medium ${aiStatus === 'loading' ? 'bg-orange-100 border border-orange-300 text-orange-800' : 'bg-white border border-orange-300 text-orange-700 hover:bg-orange-100'}`}>
            {aiStatus === 'loading' ? <><Loader2 className="animate-spin" size={16} /> Translating...</> : <><Languages size={16} /> Auto-Translate All Fields</>}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Personal Details</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700">Full Name (English) *</label>
              <input 
                type="text" 
                name="fullName" 
                required 
                value={formData.fullName || ''} 
                onChange={handleChange} 
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2 text-sm transition-colors ${duplicateInfo.isNameDup || duplicateInfo.isPotentialDup ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-300'}`} 
              />
              {(duplicateInfo.isNameDup || duplicateInfo.isPotentialDup) && <p className="text-[10px] text-red-600 mt-1 font-bold">{duplicateInfo.isPotentialDup ? 'Possible match found' : 'Exact match with DOB found'}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Native Name (Hindi/Gujarati)</label>
              <input type="text" name="nativeName" value={formData.nativeName || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-medium text-gray-700">Gotra (English)</label>
                  <input type="text" name="gotra" value={formData.gotra || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2 text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-700">Native Gotra</label>
                  <input type="text" name="nativeGotra" value={formData.nativeGotra || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2 text-sm" />
               </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
               <div>
                 <label className="block text-xs font-medium text-gray-700">Date of Birth *</label>
                 <input 
                    type="date" 
                    name="dob" 
                    required 
                    value={formData.dob || ''} 
                    onChange={handleChange} 
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2 text-sm ${duplicateInfo.isNameDup ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                 />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-700">Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2 text-sm">
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-700">Marital Status</label>
                  <select name="maritalStatus" value={formData.maritalStatus || 'Single'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2 text-sm">
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
               </div>
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Origin & Contact</h3>
             <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-xs font-medium text-gray-700">Native Place (Village - Eng)</label>
                   <input type="text" name="nativePlace" value={formData.nativePlace || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2 text-sm" />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-700">Native Place (Native Script)</label>
                   <input type="text" name="nativeNativePlace" value={formData.nativeNativePlace || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2 text-sm" />
                 </div>
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-700">Mobile</label>
                <input 
                  type="tel" 
                  name="mobile" 
                  value={formData.mobile || ''} 
                  onChange={handleChange} 
                  readOnly={!isAdmin} 
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 border p-2 text-sm transition-colors ${!isAdmin ? 'bg-gray-50' : ''} ${duplicateInfo.isMobileDup ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-300'}`} 
                />
                {duplicateInfo.isMobileDup && <p className="text-[10px] text-red-600 mt-1 font-bold">This mobile number is already registered</p>}
             </div>
             <div className="bg-gray-50 p-3 rounded border border-gray-200">
               <h4 className="text-xs font-medium text-gray-700 mb-2">Current Residence Address</h4>
               <input type="text" name="street" placeholder="Flat/Street" value={formData.currentAddress?.street || ''} onChange={handleAddressChange} className="block w-full text-sm rounded-md border-gray-300 border p-1.5 mb-2" />
               <div className="grid grid-cols-2 gap-2">
                  <input type="text" name="city" placeholder="City" value={formData.currentAddress?.city || ''} onChange={handleAddressChange} className="block w-full text-sm rounded-md border-gray-300 border p-1.5" />
                  <input type="text" name="pincode" placeholder="Pincode" value={formData.currentAddress?.pincode || ''} onChange={handleAddressChange} className="block w-full text-sm rounded-md border-gray-300 border p-1.5" />
               </div>
               <div className="mt-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Native Current Address</label>
                  <textarea 
                    name="nativeCurrentAddress" 
                    value={formData.nativeCurrentAddress || ''} 
                    onChange={handleChange} 
                    placeholder="Enter full address in native script" 
                    className="block w-full text-xs rounded-md border-gray-300 border p-1.5 h-16 resize-none"
                  />
               </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end pt-6 border-t border-gray-200 mt-6 gap-3">
           <button type="button" onClick={onCancel} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
           <button 
             type="submit" 
             disabled={!!duplicateEntry && !duplicateInfo.isPotentialDup}
             className={`px-6 py-2 font-bold rounded-lg shadow-md flex items-center gap-2 transition-all ${duplicateEntry && !duplicateInfo.isPotentialDup ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
           >
             {duplicateEntry && !duplicateInfo.isPotentialDup ? <AlertCircle size={18} /> : <Save size={18} />} 
             {duplicateEntry && !duplicateInfo.isPotentialDup ? 'Duplicate Entry Locked' : 'Save Profile'}
           </button>
        </div>
      </form>
    </div>
  );
};

export default BiodataForm;
