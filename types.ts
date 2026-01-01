
export type Language = 'Hindi' | 'Gujarati' | 'Marathi' | 'Tamil' | 'Telugu' | 'Kannada' | 'Bengali' | 'Punjabi' | 'English';

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface FamilyMember {
  id: string;
  fullName: string;
  nativeName?: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  bloodGroup?: string;
  education: string;
  nativeEducation?: string;
  occupation: string;
  nativeOccupation?: string;
  income?: string;
  gotra?: string;
  nativeGotra?: string;
  nativePlace?: string;
  nativeNativePlace?: string;
  currentAddress: Address;
  nativeCurrentAddress?: string;
  mobile: string;
  email?: string;
  familyId: string;
  isHeadOfFamily: boolean;
  relationToHead?: string;
  parentId?: string;
  spouseName?: string;
  photoUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Draft';
  bio?: string;
  height?: string;
  weight?: string;
  documents?: { name: string; url: string; type: string }[];
}

export interface CommitteeMember {
  id: string;
  name: string;
  nativeName?: string;
  role: string;
  nativeRole?: string;
  gotra?: string;
  nativeGotra?: string;
  nativeNativePlace?: string;
  photoUrl?: string;
  mobile?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  imageUrl: string;
}

export interface DeceasedMember {
  id: string;
  name: string;
  nativeName?: string;
  passingDate: string;
  nativePassingDate?: string;
  photoUrl?: string;
  tribute?: string;
  nativeTribute?: string;
}

export interface SansthaSettings {
  name: string;
  nativeName?: string;
  logoUrl?: string;
  themeColor: string;
  contactEmail: string;
  establishedYear: string;
  address: string;
  nativeAddress?: string;
  translations?: Record<string, { address?: string }>;
  registrationNumber?: string;
  committeeMembers: CommitteeMember[];
  otherMembers?: CommitteeMember[];
  sponsors: Sponsor[];
  deceasedMembers?: DeceasedMember[];
  advertisements?: string[];
  presidentName?: string;
  nativePresidentName?: string;
  presidentMessage?: string;
  nativePresidentMessage?: string;
  presidentPhotoUrl?: string;
  samajHistory?: string;
  nativeSamajHistory?: string;
  coverTemplate?: 'Classic' | 'Modern' | 'Royal';
}

export interface User {
  id: string;
  mobile: string;
  role: 'Admin' | 'User';
  name?: string;
}

export interface AppState {
  members: FamilyMember[];
  settings: SansthaSettings;
  currentUser: User | null;
}