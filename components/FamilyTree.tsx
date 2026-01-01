
import React from 'react';
import { FamilyMember } from '../types';
import { User, ShieldCheck } from 'lucide-react';

interface Props {
  members: FamilyMember[];
  logoUrl?: string;
}

const TreeNode: React.FC<{ member: FamilyMember; allMembers: FamilyMember[] }> = ({ member, allMembers }) => {
  const children = allMembers.filter(m => m.parentId === member.id);

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className="relative bg-white border-2 border-orange-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow min-w-[160px] text-center mb-10 z-10 group">
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
           {member.photoUrl ? (
             <img src={member.photoUrl} alt={member.fullName} className="w-10 h-10 rounded-full border-4 border-white shadow bg-gray-100 object-cover" />
           ) : (
             <div className="w-10 h-10 rounded-full border-4 border-white shadow bg-orange-100 flex items-center justify-center text-orange-700">
               <User size={18} />
             </div>
           )}
        </div>
        <div className="mt-4">
          <p className="font-black text-sm text-gray-800 truncate max-w-[150px] uppercase tracking-tight" title={member.fullName}>{member.fullName}</p>
          <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-1">{member.relationToHead}</p>
          {member.spouseName && (
             <div className="flex items-center justify-center gap-1 mt-2 py-1 px-2 bg-orange-50 rounded-lg">
                <span className="text-[9px] text-gray-500 font-bold italic truncate max-w-[120px]">w/ {member.spouseName}</span>
             </div>
          )}
        </div>
        
        {/* Connector Line to Children */}
        {children.length > 0 && (
          <div className="absolute top-full left-1/2 h-10 w-0.5 bg-orange-200 -translate-x-1/2"></div>
        )}
      </div>

      {/* Children Container */}
      {children.length > 0 && (
        <div className="flex gap-8 relative pt-4">
           {/* Render Children */}
           <div className="flex items-start gap-8 pt-0 border-t-2 border-orange-200 mt-0">
              {children.map(child => (
                <div key={child.id} className="relative pt-8">
                    {/* Vertical line from parent's horizontal bar to child */}
                   <div className="absolute top-0 left-1/2 h-8 w-0.5 bg-orange-200 -translate-x-1/2"></div>
                   <TreeNode member={child} allMembers={allMembers} />
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const FamilyTree: React.FC<Props> = ({ members, logoUrl }) => {
  const heads = members.filter(m => m.isHeadOfFamily);
  const rootMembers = heads.length > 0 ? heads : members.filter(m => !m.parentId);

  if (members.length === 0) return <div className="text-center p-12 text-gray-500 bg-white rounded-3xl border">No members to display</div>;

  return (
    <div className="w-full overflow-x-auto p-12 bg-white rounded-[40px] border border-gray-100 min-h-[500px] flex justify-center relative shadow-inner overflow-hidden">
      {/* Sanstha Branding Watermark */}
      {logoUrl && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <img src={logoUrl} className="w-[600px] h-[600px] object-contain" />
        </div>
      )}
      
      <div className="flex gap-16 relative z-10">
        {rootMembers.map(head => (
          <TreeNode key={head.id} member={head} allMembers={members} />
        ))}
      </div>
    </div>
  );
};

export default FamilyTree;
