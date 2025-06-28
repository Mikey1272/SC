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

export interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
  country: string;
  avatar: string;
  likes: number;
  replies: number;
  isModerated?: boolean;
  violations?: string[];
}

export interface Room {
  id: string;
  name: string;
  country: string;
  users: User[];
  messages: Message[];
  activeUsers: number;
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

export interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  totalMessages: number;
  totalConsultancies: number;
  totalReferralCodes: number;
  usedReferralCodes: number;
  expiredReferralCodes: number;
  pendingReports: number;
  countryStats: Array<{
    country: string;
    flag: string;
    activeUsers: number;
    totalMessages: number;
    totalUsers: number;
    onlineUsers: number;
  }>;
}

export interface ConsultancyDetails {
  id: string;
  name: string;
  totalCodes: number;
  usedCodes: number;
  referralCodes: Array<{
    code: string;
    isUsed: boolean;
    usedBy?: string;
    usedAt?: string;
    expiresAt: string;
    assignedCountry?: string;
    isExpired: boolean;
  }>;
}

export interface Country {
  id: string;
  name: string;
  flag: string;
  activeUsers: number;
}