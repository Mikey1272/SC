import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (in production, use service account key)
const serviceAccount: ServiceAccount = {
  projectId: "studentconnect-c9c12",
  clientEmail: "firebase-adminsdk@studentconnect-c9c12.iam.gserviceaccount.com",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ""
};

let adminApp;
let adminDb;
let adminAuth;

try {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://studentconnect-c9c12-default-rtdb.firebaseio.com"
  });
  adminDb = getDatabase(adminApp);
  adminAuth = getAuth(adminApp);
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.log('Firebase Admin not configured, using in-memory storage');
}

export { adminDb, adminAuth };

// Firebase database structure helpers
export const dbPaths = {
  users: 'users', // Store users by username
  consultancies: 'consultancies',
  referralCodes: 'referralCodes',
  verifiedUsers: 'verifiedUsers',
  deviceSessions: 'deviceSessions',
  chatRooms: 'chatRooms',
  stats: 'stats',
  messages: 'messages'
};

// Save user data under username for real-time access
export const saveUserToFirebase = async (username: string, userData: any): Promise<void> => {
  if (!adminDb) return;
  
  try {
    const userPath = `${dbPaths.users}/${username}`;
    await adminDb.ref(userPath).set({
      ...userData,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });
    console.log('User saved to Firebase under username:', username);
  } catch (error) {
    console.error('Error saving user to Firebase:', error);
    throw error;
  }
};

// Save message to user's chat history under username
export const saveMessageToFirebase = async (username: string, message: any): Promise<void> => {
  if (!adminDb) return;
  
  try {
    const messagePath = `${dbPaths.users}/${username}/messages`;
    const messageRef = adminDb.ref(messagePath).push();
    await messageRef.set({
      ...message,
      timestamp: Date.now()
    });

    // Also save to global messages for analytics
    const globalMessagePath = `${dbPaths.messages}/${message.country}`;
    const globalMessageRef = adminDb.ref(globalMessagePath).push();
    await globalMessageRef.set({
      ...message,
      username,
      timestamp: Date.now()
    });

    console.log('Message saved to Firebase for user:', username);
  } catch (error) {
    console.error('Error saving message to Firebase:', error);
    throw error;
  }
};

// Update user activity for real-time tracking
export const updateUserActivity = async (username: string, activityData: any): Promise<void> => {
  if (!adminDb) return;
  
  try {
    const userPath = `${dbPaths.users}/${username}`;
    await adminDb.ref(userPath).update({
      ...activityData,
      lastUpdated: Date.now()
    });
    
    // Update global stats
    await updateGlobalStats();
    
    console.log('User activity updated for:', username);
  } catch (error) {
    console.error('Error updating user activity:', error);
    throw error;
  }
};

// Get real-time statistics
export const getRealTimeStats = async (): Promise<any> => {
  if (!adminDb) return null;
  
  try {
    const statsRef = adminDb.ref(dbPaths.stats);
    const snapshot = await statsRef.once('value');
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    // If no stats exist, calculate and save them
    await updateGlobalStats();
    const newSnapshot = await statsRef.once('value');
    return newSnapshot.exists() ? newSnapshot.val() : null;
  } catch (error) {
    console.error('Error getting real-time stats:', error);
    return null;
  }
};

// Update global statistics
export const updateGlobalStats = async (): Promise<void> => {
  if (!adminDb) return;
  
  try {
    // Get all users
    const usersSnapshot = await adminDb.ref(dbPaths.users).once('value');
    const users = usersSnapshot.val() || {};
    
    // Get all consultancies
    const consultanciesSnapshot = await adminDb.ref(dbPaths.consultancies).once('value');
    const consultancies = consultanciesSnapshot.val() || {};
    
    // Get all referral codes
    const referralCodesSnapshot = await adminDb.ref(dbPaths.referralCodes).once('value');
    const referralCodes = referralCodesSnapshot.val() || {};
    
    // Get all messages
    const messagesSnapshot = await adminDb.ref(dbPaths.messages).once('value');
    const messages = messagesSnapshot.val() || {};
    
    // Calculate stats
    const userList = Object.values(users);
    const totalUsers = userList.length;
    const onlineUsers = userList.filter((user: any) => user.isOnline).length;
    
    const referralCodeList = Object.values(referralCodes);
    const totalReferralCodes = referralCodeList.length;
    const usedReferralCodes = referralCodeList.filter((code: any) => code.isUsed).length;
    const expiredReferralCodes = referralCodeList.filter((code: any) => new Date() > new Date(code.expiresAt)).length;
    
    const totalConsultancies = Object.keys(consultancies).length;
    
    // Calculate total messages across all countries
    let totalMessages = 0;
    const countryStats = [];
    
    const countries = ['us', 'uk', 'de', 'ca', 'au'];
    
    for (const countryId of countries) {
      const countryMessages = messages[countryId] || {};
      const countryMessageCount = Object.keys(countryMessages).length;
      totalMessages += countryMessageCount;
      
      const countryUsers = userList.filter((user: any) => user.assignedCountry === countryId);
      const countryOnlineUsers = countryUsers.filter((user: any) => user.isOnline).length;
      
      countryStats.push({
        countryId,
        totalUsers: countryUsers.length,
        onlineUsers: countryOnlineUsers,
        activeUsers: countryOnlineUsers, // For compatibility
        totalMessages: countryMessageCount
      });
    }
    
    const stats = {
      totalUsers,
      onlineUsers,
      totalMessages,
      totalConsultancies,
      totalReferralCodes,
      usedReferralCodes,
      expiredReferralCodes,
      pendingReports: 0, // TODO: Implement reports tracking
      countryStats,
      lastUpdated: Date.now()
    };
    
    await adminDb.ref(dbPaths.stats).set(stats);
    console.log('Global stats updated');
  } catch (error) {
    console.error('Error updating global stats:', error);
    throw error;
  }
};

// Save user data under consultancy structure for referral users
export const saveUserToConsultancy = async (consultancyName: string, referralCode: string, userData: any): Promise<void> => {
  if (!adminDb) return;
  
  try {
    const userPath = `${dbPaths.consultancies}/${consultancyName}/users/${referralCode}`;
    await adminDb.ref(userPath).set({
      ...userData,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });
    console.log('User saved to consultancy:', consultancyName, referralCode);
  } catch (error) {
    console.error('Error saving user to consultancy:', error);
    throw error;
  }
};

// Get user data from consultancy structure
export const getUserFromConsultancy = async (consultancyName: string, referralCode: string) => {
  if (!adminDb) return null;
  
  try {
    const userPath = `${dbPaths.consultancies}/${consultancyName}/users/${referralCode}`;
    const snapshot = await adminDb.ref(userPath).once('value');
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error getting user from consultancy:', error);
    return null;
  }
};

// Save message to user's chat history under consultancy
export const saveMessageToUser = async (consultancyName: string, referralCode: string, message: any): Promise<void> => {
  if (!adminDb) return;
  
  try {
    const messagePath = `${dbPaths.consultancies}/${consultancyName}/users/${referralCode}/messages`;
    const messageRef = adminDb.ref(messagePath).push();
    await messageRef.set({
      ...message,
      timestamp: Date.now()
    });
    console.log('Message saved for user:', referralCode);
  } catch (error) {
    console.error('Error saving message to user:', error);
    throw error;
  }
};

// Get user's chat history
export const getUserChatHistory = async (consultancyName: string, referralCode: string) => {
  if (!adminDb) return [];
  
  try {
    const messagesPath = `${dbPaths.consultancies}/${consultancyName}/users/${referralCode}/messages`;
    const snapshot = await adminDb.ref(messagesPath).once('value');
    
    if (snapshot.exists()) {
      const messages = snapshot.val();
      return Object.values(messages);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting user chat history:', error);
    return [];
  }
};

// Save verified user (non-referral users)
export const saveVerifiedUser = async (userId: string, userData: any): Promise<void> => {
  if (!adminDb) return;
  
  try {
    const userPath = `${dbPaths.verifiedUsers}/${userId}`;
    await adminDb.ref(userPath).set({
      ...userData,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });
    console.log('Verified user saved:', userId);
  } catch (error) {
    console.error('Error saving verified user:', error);
    throw error;
  }
};

// Get verified user
export const getVerifiedUser = async (userId: string) => {
  if (!adminDb) return null;
  
  try {
    const userPath = `${dbPaths.verifiedUsers}/${userId}`;
    const snapshot = await adminDb.ref(userPath).once('value');
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error getting verified user:', error);
    return null;
  }
};

// Save consultancy data
export const saveConsultancy = async (consultancyId: string, consultancyData: any): Promise<void> => {
  if (!adminDb) return;
  
  try {
    const consultancyPath = `${dbPaths.consultancies}/${consultancyData.name}`;
    await adminDb.ref(consultancyPath).set({
      ...consultancyData,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });
    console.log('Consultancy saved:', consultancyData.name);
  } catch (error) {
    console.error('Error saving consultancy:', error);
    throw error;
  }
};

// Save referral codes
export const saveReferralCodes = async (codes: any[]): Promise<void> => {
  if (!adminDb) return;
  
  try {
    const batch = {};
    codes.forEach(code => {
      batch[`${dbPaths.referralCodes}/${code.code}`] = code;
    });
    
    await adminDb.ref().update(batch);
    console.log('Referral codes saved:', codes.length);
  } catch (error) {
    console.error('Error saving referral codes:', error);
    throw error;
  }
};

export const createDeviceSession = async (userId: string, deviceId: string, referralCode?: string): Promise<void> => {
  if (!adminDb) return;
  
  const sessionData = {
    userId,
    deviceId,
    loginTime: Date.now(),
    isActive: true,
    referralCode: referralCode || null
  };
  
  await adminDb.ref(`${dbPaths.deviceSessions}/${userId}`).set(sessionData);
};

export const checkDeviceSession = async (userId: string, deviceId: string) => {
  if (!adminDb) return { canLogin: true, existingDevice: null };
  
  const sessionRef = adminDb.ref(`${dbPaths.deviceSessions}/${userId}`);
  const snapshot = await sessionRef.once('value');
  const session = snapshot.val();
  
  if (!session || !session.isActive) {
    return { canLogin: true, existingDevice: null };
  }
  
  if (session.deviceId === deviceId) {
    return { canLogin: true, existingDevice: null };
  }
  
  return { canLogin: false, existingDevice: session.deviceId };
};

export const switchDevice = async (userId: string, newDeviceId: string) => {
  if (!adminDb) return;
  
  await adminDb.ref(`${dbPaths.deviceSessions}/${userId}`).update({
    deviceId: newDeviceId,
    loginTime: Date.now()
  });
};

export const logoutDevice = async (userId: string) => {
  if (!adminDb) return;
  
  await adminDb.ref(`${dbPaths.deviceSessions}/${userId}`).update({
    isActive: false,
    logoutTime: Date.now()
  });
};