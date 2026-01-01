import React, { useState, useEffect } from 'react';
import { AppState, FamilyMember, SansthaSettings, User } from './types';
import SansthaHeader from './components/SansthaHeader';
import Dashboard from './components/Dashboard';
import BiodataForm from './components/BiodataForm';
import FamilyList from './components/FamilyList';
import FamilyTree from './components/FamilyTree';
import AdminPanel from './components/AdminPanel';
import PDFExport from './components/PDFExport';
import MatrimonialView from './components/MatrimonialView';
import BloodDirectory from './components/BloodDirectory';
import { Plus, UserCog, BookOpen, Printer, LayoutDashboard, Heart, Droplets } from 'lucide-react';
import { TRANSLATIONS } from './utils/i18n';

const SAMAJ_LOGO_SVG = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNDAwIDQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzMxMTMwNiIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTYwIiBmaWxsPSJub25lIiBzdHJva2U9IiM3MTM0MWEiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMTU0IiBmaWxsPSJub25lIiBzdHJva2U9IiM3MTM0MWEiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2UtZGFzaGFycmF5PSIzIDMiLz4KICA8cGF0aCBpZD0idG9wQ3VydmUiIGQ9Ik0gMTAwIDIwMCBBIDEwMCAxMDAgMCAwIDEgMzAwIDIwMCIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGlkPSJib3R0b21DdXJ2ZSIgZD0iTSAxMDAgMjAwIEEgMTAwIDEwMCAwIDAgMCAzMDAgMjAwIiBmaWxsPSJub25lIi8+CiAgPHRleHQgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2Y0ZDRhOCIgbGV0dGVyLXNwYWNpbmc9IjQiPgogICAgPHRleHRQYXRoIGhyZWY9IiN0b3BDdXJ2ZSIgc3RhcnRPZmZzZXQ9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+S0FXQURJWUEgR09UUkEgQlVSSEFOUFVSPC90ZXh0UGF0aD4KICA8L3RleHQ+CiAgPHRleHQgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2Y0ZDRhOCIgbGV0dGVyLXNwYWNpbmc9IjgiPgogICAgPHRleHRQYXRoIGhyZWY9IiNib3R0b21DdXJ2ZSIgc3RhcnRPZmZzZXQ9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RVNULiAyMDI0PC90ZXh0UGF0aD4KICA8L3RleHQ+CiAgPHBhdGggZD0iTSA1MCAxODAgTCAzNTAgMTgwIE0gNTAgMjIwIEwgMzUwIDIyMCIgc3Ryb2tlPSIjNzEzNDFhIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSIyMDAiIHk9IjIwNyIgZm9udC1mYW1pbHk9IidHZW9yZ2lhJywgc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZjRkNGE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMiI+U0hSRUUgR1VKUkFUSSBNT0RFIFZBTklLPC90ZXh0PgogIDxwYXRoIGQ9Ik0gODAgMTcwIFEgMjAwIDE0MCAzMjAgMTcwIiBmaWxsPSJub25lIiBzdHJva2U9IiM3MTM0MWEiIHN0cm9rZS13aWR0aD0iMC41Ii8+CiAgPHBhdGggZD0iTSA4MCAyMzAgUSAyMDAgMjYwIDMyMCAyMzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzcxMzQxYSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+`;

const DEFAULT_USER: User = { id: 'admin-1', mobile: 'admin', role: 'Admin', name: 'Samaj Member' };

const DEFAULT_SETTINGS: SansthaSettings = {
  name: "Shree Gujrati Mode Vanik Samaj",
  nativeName: "श्री गुजराती मोढ़ वणिक समाज",
  logoUrl: SAMAJ_LOGO_SVG,
  themeColor: "#311306",
  contactEmail: "contact@modevanik.com",
  establishedYear: "2024",
  address: "B12 AKSAR DHAN COLONY, RASTIPURA, BURHANPUR, M.P. - 450331",
  nativeAddress: "बी12 अक्षर धाम कॉलोनी, रस्तीपुरा, बुरहानपुर, म.प्र. - 450331",
  registrationNumber: "SOCIETY/REG/2023/001",
  presidentName: "Shri Rajesh Bhai Shah",
  nativePresidentName: "श्री राजेश भाई शाह",
  presidentMessage: "Greetings to all our honored community members. Our Samaj stands on the foundation of culture, tradition, and mutual cooperation.",
  nativePresidentMessage: `आदरणीय बुज़ुर्गों, भाइयों, बहनों एवं हमारे सम्मानित समाज के सभी सदस्यों को सादर प्रणाम। हमारा समाज संस्कारों, परंपराओं और आपसी सहयोग की मजबूत नींव पर खड़ा है। आइए, हम सब मिलकर समाज के उज्ज्वल भविष्य के लिए निरंतर प्रयास करें।`,
  samajHistory: "The Shree Gujrati Mode Vanik Samaj (Kawadiya Gotra) has a rich heritage rooted in the traditions of Gujarat and Madhya Pradesh. Our community has always prioritized education, trade, and social welfare.",
  nativeSamajHistory: "श्री गुजराती मोढ़ वणिक समाज (कावडिया गोत्र) की विरासत गुजरात और मध्य प्रदेश की समृद्ध परंपराओं में गहराई से निहित है। हमारे समाज ने हमेशा शिक्षा, व्यापार और सामाजिक कल्याण को प्राथमिकता दी है।",
  committeeMembers: [
    { id: 'c1', name: 'Rajesh Bhai Shah', nativeName: 'श्री राजेश भाई शाह', role: 'President', mobile: '9827328228', nativeRole: 'अध्यक्ष' },
    { id: 'c2', name: 'Manoj Bhai Shah', nativeName: 'श्री मनोज भाई शाह', role: 'Vice President', mobile: '9399936497', nativeRole: 'उपाध्यक्ष' },
    { id: 'c3', name: 'Umesh Bhai Mehta', nativeName: 'श्री उमेश भाई मेहता', role: 'Secretary', mobile: '9479431388', nativeRole: 'सचिव' },
    { id: 'c4', name: 'Hitesh Bhai Gandhi', nativeName: 'श्री हितेश भाई गांधी', role: 'Treasurer', mobile: '9827639666', nativeRole: 'कोषाध्यक्ष' },
  ],
  sponsors: [],
  deceasedMembers: [],
};

const INITIAL_MEMBERS: FamilyMember[] = [
  { id: 'm_umesh_mehta', fullName: 'Umesh Suresh Mehta', nativeName: 'श्री उमेश सुरेश मेहता', gender: 'Male', dob: '1982-01-01', maritalStatus: 'Married', education: 'Graduate', nativeEducation: 'स्नातक', occupation: 'Business/Secretary', nativeOccupation: 'व्यवसाय/सचिव', mobile: '9479431388', familyId: 'f_mehta_umesh', isHeadOfFamily: true, relationToHead: 'Self', status: 'Approved', currentAddress: { street: 'Akshar Dham Colony Rastipura', city: 'Burhanpur', state: 'M.P.', pincode: '450331', country: 'India' }, nativeCurrentAddress: 'अक्षर धाम कॉलोनी, रस्तीपुरा, बुरहानपुर, म.प्र. 450331', nativePlace: 'Burhanpur', nativeNativePlace: 'बुरहानpur', bloodGroup: 'B+' },
  { id: 'm_latesh_shah', fullName: 'Latesh Bhagwandas Shah', nativeName: 'श्री लतेश भगवानदास शाह', gender: 'Male', dob: '1988-05-15', maritalStatus: 'Married', education: 'Graduate', occupation: 'Business', mobile: '9300599549', familyId: 'f_shah_latesh', isHeadOfFamily: true, relationToHead: 'Self', status: 'Approved', currentAddress: { street: 'New Akshar Dham Colony Rastipura', city: 'Burhanpur', state: 'M.P.', pincode: '450331', country: 'India' }, nativeCurrentAddress: 'न्यू अक्षर धाम कॉलोनी, रस्तीपुरा, बुरहानपुर, म.प्र.', nativePlace: 'Burhanpur', nativeNativePlace: 'बुरहानपुर' },
  { id: 'm_bhagwandas_shah', fullName: 'Bhagwandas Shah', nativeName: 'श्री भगवानदास शाह', gender: 'Male', dob: '1956-05-02', maritalStatus: 'Married', education: 'Undergraduate', occupation: 'Retired', mobile: '7000539098', familyId: 'f_shah_latesh', isHeadOfFamily: false, relationToHead: 'Father', status: 'Approved', currentAddress: { street: 'New Akshar Dham Colony Rastipura', city: 'Burhanpur', state: 'M.P.', pincode: '450331', country: 'India' } },
  { id: 'm_sheela_ben_shah', fullName: 'Sheela Ben Shah', nativeName: 'श्रीमती शीला बेन शाह', gender: 'Female', dob: '1959-06-26', maritalStatus: 'Married', education: 'Housewife', occupation: 'Home Maker', mobile: '', familyId: 'f_shah_latesh', isHeadOfFamily: false, relationToHead: 'Mother', status: 'Approved', currentAddress: { street: 'New Akshar Dham Colony Rastipura', city: 'Burhanpur', state: 'M.P.', pincode: '450331', country: 'India' } },
  { id: 'm_rupali_shah', fullName: 'Rupali Shah', nativeName: 'श्रीमती रूपाली शाह', gender: 'Female', dob: '1990-03-15', maritalStatus: 'Married', education: 'Graduate', occupation: 'Home Maker', mobile: '', familyId: 'f_shah_latesh', isHeadOfFamily: false, relationToHead: 'Wife', status: 'Approved', currentAddress: { street: 'New Akshar Dham Colony Rastipura', city: 'Burhanpur', state: 'M.P.', pincode: '450331', country: 'India' } },
  { id: 'm_chitravi_shah', fullName: 'Chitravi Shah', nativeName: 'कु. चित्रावी शाह', gender: 'Female', dob: '2015-05-16', maritalStatus: 'Single', education: 'Student', occupation: 'Education', mobile: '', familyId: 'f_shah_latesh', isHeadOfFamily: false, relationToHead: 'Daughter', status: 'Approved', currentAddress: { street: 'New Akshar Dham Colony Rastipura', city: 'Burhanpur', state: 'M.P.', pincode: '450331', country: 'India' } },
  { id: 'm_sejal_shah', fullName: 'Sejal Shah', nativeName: 'कु. सेजल शाह', gender: 'Female', dob: '2019-10-11', maritalStatus: 'Single', education: 'Student', occupation: 'Education', mobile: '', familyId: 'f_shah_latesh', isHeadOfFamily: false, relationToHead: 'Daughter', status: 'Approved', currentAddress: { street: 'New Akshar Dham Colony Rastipura', city: 'Burhanpur', state: 'M.P.', pincode: '450331', country: 'India' } },
  { id: 'm_tarun_gandhi', fullName: 'Tarun Shankarlal Gandhi', nativeName: 'श्री तरुण शंकरलाल गांधी', gender: 'Male', dob: '1992-01-01', maritalStatus: 'Married', education: 'Graduate', nativeEducation: 'स्नातक', occupation: 'Professional', nativeOccupation: 'व्यवसाय', mobile: '7696903206', familyId: 'f_gandhi_tarun', isHeadOfFamily: true, relationToHead: 'Self', status: 'Approved', currentAddress: { street: 'B12 Akshar Dham Colony Rastipura', city: 'Burhanpur', state: 'M.P.', pincode: '450331', country: 'India' }, nativeCurrentAddress: 'बी12 अक्षर धाम कॉलोनी, रस्तीपुरा, बुरहानपुर', nativePlace: 'Burhanpur', nativeNativePlace: 'बुरहानपुर', bloodGroup: 'O+' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('samaj_app_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.currentUser = DEFAULT_USER;
        return parsed;
      } catch (e) { console.error("Restore failed:", e); }
    }
    return { members: INITIAL_MEMBERS, settings: DEFAULT_SETTINGS, currentUser: DEFAULT_USER };
  });

  const [view, setView] = useState<'dashboard' | 'list' | 'admin' | 'tree' | 'matrimonial' | 'blood'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [showPDF, setShowPDF] = useState<'single' | 'booklet' | null>(null);
  const [pdfHead, setPdfHead] = useState<FamilyMember | undefined>(undefined);
  const [language, setLanguage] = useState('English');

  useEffect(() => { 
    localStorage.setItem('samaj_app_state', JSON.stringify(state)); 
  }, [state]);

  const isAdmin = state.currentUser?.role === 'Admin';
  const t = (key: string) => TRANSLATIONS[language]?.[key] || key;

  const handleAddMember = (familyId?: string) => {
    const baseId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const initialData = familyId ? { familyId, isHeadOfFamily: false, status: 'Approved' as any } : { id: baseId };
    setEditingMember(initialData as any);
    setShowForm(true);
  };

  const handleFormSubmit = (mainMember: FamilyMember, otherMembers: FamilyMember[] = []) => {
    setState(prev => {
      let newMembers = [...prev.members];
      
      // Update or add the main member
      const mainIdx = newMembers.findIndex(m => m.id === mainMember.id);
      if (mainIdx >= 0) newMembers[mainIdx] = mainMember;
      else newMembers.push(mainMember);

      // Bulk update/add sub-members if provided
      otherMembers.forEach(sm => {
        const smIdx = newMembers.findIndex(m => m.id === sm.id);
        if (smIdx >= 0) newMembers[smIdx] = sm;
        else newMembers.push(sm);
      });

      return { ...prev, members: newMembers };
    });
    setShowForm(false);
    setEditingMember(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <SansthaHeader settings={state.settings} isAdmin={isAdmin} toggleSidebar={() => {}} onOpenSettings={() => setView('admin')} language={language} setLanguage={setLanguage} />
      <div className="container mx-auto px-4 pt-8">
        <div className="flex flex-col xl:flex-row justify-between items-center mb-8 bg-white p-4 rounded-3xl shadow-sm gap-4 border border-gray-100">
           <div className="flex overflow-x-auto gap-4 scrollbar-hide w-full xl:w-auto">
             <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${view === 'dashboard' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><LayoutDashboard size={18} /> Home</button>
             <button onClick={() => setView('list')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${view === 'list' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><BookOpen size={18} /> {t('directory')}</button>
             <button onClick={() => setView('matrimonial')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${view === 'matrimonial' ? 'bg-rose-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Heart size={18} /> {t('matrimonialSection')}</button>
             <button onClick={() => setView('blood')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${view === 'blood' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Droplets size={18} /> {t('bloodDirectory')}</button>
             <button onClick={() => setView('admin')} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${view === 'admin' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><UserCog size={18} /> {t('adminPanel')}</button>
           </div>
           <div className="flex gap-3 w-full xl:w-auto justify-end">
              <button onClick={() => setShowPDF('booklet')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"><Printer size={18} /> {t('printBooklet')}</button>
              <button onClick={() => handleAddMember()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg transition-transform active:scale-95"><Plus size={20} /> {t('addNewFamily')}</button>
           </div>
        </div>

        {view === 'dashboard' && <Dashboard members={state.members} settings={state.settings} onAddFamily={() => handleAddMember()} onViewDirectory={() => setView('list')} language={language} />}
        {view === 'list' && <FamilyList members={state.members} currentUser={state.currentUser} onEdit={(m) => { setEditingMember(m); setShowForm(true); }} onDelete={(id) => setState(p => ({...p, members: p.members.filter(m => m.id !== id)}))} onPrint={(head) => { setPdfHead(head); setShowPDF('single'); }} onViewTree={(fid) => { setSelectedFamilyId(fid); setView('tree'); }} onAddMember={handleAddMember} />}
        {view === 'matrimonial' && <MatrimonialView members={state.members} language={language} />}
        {view === 'blood' && <BloodDirectory members={state.members} language={language} />}
        {view === 'admin' && <AdminPanel members={state.members} onApprove={(id) => setState(p => ({...p, members: p.members.map(m => m.id === id ? {...m, status: 'Approved'} : m)}))} onReject={(id) => setState(p => ({...p, members: p.members.map(m => m.id === id ? {...m, status: 'Rejected'} : m)}))} settings={state.settings} onUpdateSettings={(s) => setState(prev => ({ ...prev, settings: s }))} onBulkAddMembers={(newMs) => setState(prev => ({ ...prev, members: [...prev.members, ...newMs] }))} language={language} />}
        {view === 'tree' && selectedFamilyId && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-950 uppercase tracking-tighter">Family Genealogy</h2>
                  <p className="text-sm text-gray-500 font-medium">Ancestral tracing and household connections.</p>
                </div>
                <button onClick={() => setView('list')} className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl transition-all active:scale-95">Back to List</button>
             </div>
             <FamilyTree members={state.members.filter(m => m.familyId === selectedFamilyId)} logoUrl={state.settings.logoUrl} />
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <BiodataForm initialData={editingMember || undefined} allMembers={state.members} currentUser={state.currentUser} existingFamilies={[]} currentFamilyMembers={editingMember?.familyId ? state.members.filter(m => m.familyId === editingMember.familyId) : []} onSubmit={handleFormSubmit} onCancel={() => { setShowForm(false); setEditingMember(null); }} />
        </div>
      )}

      {showPDF && <PDFExport mode={showPDF} familyHead={pdfHead} allMembers={state.members} settings={state.settings} language={language} onClose={() => { setShowPDF(null); setPdfHead(undefined); }} />}
    </div>
  );
};

export default App;