export interface ReferralCode {
  id: string;
  code: string;
  consultancyName: string;
  consultancyId: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
  createdBy: string;
  assignedCountry?: string;
  deviceId?: string;
}

export interface Consultancy {
  id: string;
  name: string;
  totalCodes: number;
  usedCodes: number;
  createdAt: Date;
  isActive: boolean;
  referralCodes: string[];
}

export interface User {
  id: string;
  username: string;
  email?: string;
  country: string;
  assignedCountry?: string;
  isOnline: boolean;
  lastSeen: Date;
  avatar: string;
  accountType: 'referral' | 'verified' | 'admin' | 'founder';
  referralCode?: string;
  consultancyName?: string;
  visaPhotoUrl?: string;
  visaVerified?: boolean;
  deviceId?: string;
  reportCount: number;
  isBanned: boolean;
  joinedAt: Date;
  firebaseUid?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  message?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface DeviceSession {
  userId: string;
  deviceId: string;
  loginTime: number;
  isActive: boolean;
  referralCode?: string;
}