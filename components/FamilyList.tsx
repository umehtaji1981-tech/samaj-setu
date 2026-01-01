
import React, { useState, useMemo } from 'react';
import { FamilyMember, User } from '../types';
import { Search, MapPin, Edit, Download, Users, Trash2, Clock, FileText, XCircle, Network, Crown, Plus, CheckCircle2 } from 'lucide-react';

interface Props {
  members: FamilyMember[];
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  onPrint: (member: FamilyMember) => void;
  onViewTree: (familyId: string) => void;
  onAddMember: (familyId: string) => void;
  currentUser: User | null;
}

const FamilyList: React.FC<Props> = ({ members, onEdit, onDelete, onPrint, onViewTree, onAddMember, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const isAdmin = currentUser?.role === 'Admin';

  const calculateMemberCompleteness = (m: FamilyMember): number => {
    const fields = [
      m.fullName,
      m.nativeName,
      m.dob,
      m.gender,
      m.maritalStatus,
      m.education,
      m.nativeEducation,
      m.occupation,
      m.nativeOccupation,
      m.gotra,
      m.nativePlace,
      m.mobile,
      m.photoUrl,
      m.currentAddress?.street,
      m.currentAddress?.city
    ];
    const filled = fields.filter(f => f && String(f).trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  const getCompletenessColor = (percent: number) => {
    if (percent < 40) return 'bg-red-500';
    if (percent < 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      onDelete(id);
    }
  };

  // Group members by Family ID
  const families = useMemo(() => {
    return members.reduce((acc, member) => {
      if (!acc[member.familyId]) {
        acc[member.familyId] = [];
      }
      acc[member.familyId].push(member);
      return acc;
    }, {} as Record<string, FamilyMember[]>);
  }, [members]);

  const filteredFamilyIds = useMemo(() => {
    return Object.keys(families).filter(famId => {
      const famMembers = families[famId];
      if (!famMembers || famMembers.length === 0) return false;
      
      const isOwner = currentUser && famMembers.some(m => m.mobile === currentUser.mobile);
      const hasApproved = famMembers.some(m => m.status === 'Approved');
      
      const isVisible = isAdmin || isOwner || hasApproved;
      
      if (!isVisible) return false;

      // Search Filtering
      const matchesSearch = famMembers.some(m => 
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.nativeName && m.nativeName.includes(searchTerm)) ||
        (m.nativePlace && m.nativePlace.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      const matchesCity = filterCity ? famMembers.some(m => m.currentAddress.city.toLowerCase().includes(filterCity.toLowerCase())) : true;
      
      return matchesSearch && matchesCity;
    });
  }, [families, isAdmin, currentUser, searchTerm, filterCity]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name, Native Place..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="border rounded-lg px-4 py-2 bg-white"
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
        >
          <option value="">All Cities</option>
          {Array.from(new Set(members.map(m => m.currentAddress.city).filter(Boolean))).map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6">
        {filteredFamilyIds.map(famId => {
          const famMembers = families[famId];
          if (!famMembers || famMembers.length === 0) return null;
          
          const head = famMembers.find(m => m.isHeadOfFamily) || famMembers[0];
          const isOwner = currentUser && famMembers.some(m => m.mobile === currentUser.mobile);
          
          const familyCompleteness = Math.round(
            famMembers.reduce((acc, m) => acc + calculateMemberCompleteness(m), 0) / famMembers.length
          );
          
          return (
            <div key={famId} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="bg-orange-50 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-orange-100">
                <div className="flex-1 min-w-0">
                   <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 truncate pr-4">
                     {head.fullName} <span className="text-sm font-normal text-gray-500 hidden sm:inline">({head.nativeName || 'Family Head'})</span>
                   </h3>
                   <div className="text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                     <span className="flex items-center gap-1"><MapPin size={14} /> {head.nativePlace || 'Unknown Native'}</span>
                     <span className="flex items-center gap-1"><MapPin size={14} className="text-orange-500" /> {head.currentAddress.city}</span>
                     <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-orange-200 text-xs font-bold text-orange-700">{famMembers.length} Members</span>
                   </div>
                   
                   {/* Family Progress Bar */}
                   <div className="mt-3 max-w-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Profile Completeness</span>
                        <span className={`text-[10px] font-black ${familyCompleteness === 100 ? 'text-green-600' : 'text-gray-500'}`}>{familyCompleteness}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${getCompletenessColor(familyCompleteness)}`} 
                          style={{ width: `${familyCompleteness}%` }}
                        />
                      </div>
                   </div>
                </div>
                <div className="mt-4 md:mt-0 flex gap-2 shrink-0">
                   <button onClick={() => onViewTree(famId)} className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-50">
                     <Network size={14} /> Tree
                   </button>
                   <button onClick={() => onPrint(head)} className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-50">
                     <Download size={14} /> PDF
                   </button>
                   {(isAdmin || isOwner) && (
                      <button 
                        onClick={() => onAddMember(famId)} 
                        className="text-sm bg-orange-600 border border-orange-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-orange-700 shadow-sm font-medium"
                      >
                        <Plus size={14} /> Add Member
                      </button>
                   )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {famMembers.map(member => {
                    // Visibility logic for individual card
                    if (!isAdmin && !isOwner && member.status !== 'Approved') return null;
                    const completeness = calculateMemberCompleteness(member);

                    return (
                      <div key={member.id} className={`relative flex items-start gap-3 p-3 rounded-lg border transition-all ${member.status === 'Pending' ? 'bg-yellow-50 border-yellow-200' : member.status === 'Draft' ? 'bg-gray-50 border-gray-200 border-dashed' : member.status === 'Rejected' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'} hover:border-orange-300`}>
                        <div className="relative w-12 h-12 shrink-0">
                          {member.photoUrl ? (
                            <img 
                              src={member.photoUrl} 
                              alt={member.fullName} 
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border-2 border-white shadow-sm">
                              <Users size={20} />
                            </div>
                          )}
                          {completeness === 100 && (
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                              <CheckCircle2 size={12} className="text-green-500 fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <h4 className="text-sm font-semibold truncate text-gray-900 flex items-center gap-1 pr-1">
                                {member.fullName}
                                {member.isHeadOfFamily && <Crown size={14} className="text-yellow-600 fill-yellow-400 shrink-0" />}
                             </h4>
                             <div className="flex gap-1 shrink-0">
                               {(isAdmin || isOwner) && (
                                 <button onClick={() => onEdit(member)} className="text-blue-600 hover:text-blue-800 p-0.5" title="Edit Biodata">
                                   <Edit size={14} />
                                 </button>
                               )}
                               {isAdmin && (
                                 <button 
                                   onClick={(e) => handleDeleteClick(e, member.id)} 
                                   className="text-red-600 hover:text-red-800 p-0.5" 
                                   title="Delete Profile"
                                 >
                                   <Trash2 size={14} />
                                 </button>
                               )}
                             </div>
                          </div>
                          <p className="text-xs text-gray-500">{member.isHeadOfFamily ? 'Head' : member.relationToHead}</p>
                          <p className="text-xs text-gray-600 mt-1 truncate">{member.education} • {member.occupation}</p>
                          
                          {/* Profile Health Mini-Bar */}
                          <div className="mt-2 flex items-center gap-2">
                             <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full ${getCompletenessColor(completeness)} transition-all`} 
                                 style={{ width: `${completeness}%` }} 
                               />
                             </div>
                             <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">{completeness}%</span>
                          </div>

                          {/* Status Indicators */}
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {member.status === 'Pending' && (isAdmin || isOwner) && (
                                <span className="flex items-center gap-1 text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200">
                                    <Clock size={10} /> {isAdmin ? 'Needs Approval' : 'Pending'}
                                </span>
                            )}
                            {member.status === 'Draft' && (isAdmin || isOwner) && (
                                <span className="flex items-center gap-1 text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded border border-gray-300">
                                    <FileText size={10} /> Draft
                                </span>
                            )}
                            {member.status === 'Rejected' && (isAdmin || isOwner) && (
                                <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                                    <XCircle size={10} /> Rejected
                                </span>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {filteredFamilyIds.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
            <Users size={48} className="mx-auto mb-3 opacity-20" />
            <p>No families found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyList;
