import { database } from '../config/firebase';
import { ref, set, get, push, update, remove, onValue, off } from 'firebase/database';
import { User, Message, ReferralCode, Consultancy, DeviceSession } from '../types';

// Database paths for consultancy-based structure
export const dbPaths = {
  consultancies: 'consultancies',
  referralCodes: 'referralCodes',
  verifiedUsers: 'verifiedUsers',
  deviceSessions: 'deviceSessions',
  chatRooms: 'chatRooms'
};

// Save user data under consultancy structure for referral users
export const saveUserToConsultancy = async (consultancyName: string, referralCode: string, userData: any): Promise<void> => {
  try {
    const userPath = `${dbPaths.consultancies}/${consultancyName}/users/${referralCode}`;
    await set(ref(database, userPath), {
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
export const getUserFromConsultancy = async (consultancyName: string, referralCode: string): Promise<any | null> => {
  try {
    const userPath = `${dbPaths.consultancies}/${consultancyName}/users/${referralCode}`;
    const snapshot = await get(ref(database, userPath));
    
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
  try {
    const messagePath = `${dbPaths.consultancies}/${consultancyName}/users/${referralCode}/messages`;
    const messageRef = push(ref(database, messagePath));
    await set(messageRef, {
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
export const getUserChatHistory = async (consultancyName: string, referralCode: string): Promise<Message[]> => {
  try {
    const messagesPath = `${dbPaths.consultancies}/${consultancyName}/users/${referralCode}/messages`;
    const snapshot = await get(ref(database, messagesPath));
    
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
  try {
    const userPath = `${dbPaths.verifiedUsers}/${userId}`;
    await set(ref(database, userPath), {
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
export const getVerifiedUser = async (userId: string): Promise<any | null> => {
  try {
    const userPath = `${dbPaths.verifiedUsers}/${userId}`;
    const snapshot = await get(ref(database, userPath));
    
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
  try {
    const consultancyPath = `${dbPaths.consultancies}/${consultancyData.name}`;
    await set(ref(database, consultancyPath), {
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
  try {
    const batch = {};
    codes.forEach(code => {
      batch[`${dbPaths.referralCodes}/${code.code}`] = code;
    });
    
    await update(ref(database), batch);
    console.log('Referral codes saved:', codes.length);
  } catch (error) {
    console.error('Error saving referral codes:', error);
    throw error;
  }
};

// Device session management
export const createDeviceSession = async (userId: string, deviceId: string, referralCode?: string): Promise<void> => {
  try {
    const sessionData = {
      userId,
      deviceId,
      loginTime: Date.now(),
      isActive: true,
      referralCode: referralCode || null
    };
    
    await set(ref(database, `${dbPaths.deviceSessions}/${userId}`), sessionData);
    console.log('Device session created:', userId);
  } catch (error) {
    console.error('Error creating device session:', error);
    throw error;
  }
};

export const checkDeviceSession = async (userId: string, deviceId: string) => {
  try {
    const sessionRef = ref(database, `${dbPaths.deviceSessions}/${userId}`);
    const snapshot = await get(sessionRef);
    const session = snapshot.val();
    
    if (!session || !session.isActive) {
      return { canLogin: true, existingDevice: null };
    }
    
    if (session.deviceId === deviceId) {
      return { canLogin: true, existingDevice: null };
    }
    
    return { canLogin: false, existingDevice: session.deviceId };
  } catch (error) {
    console.error('Error checking device session:', error);
    return { canLogin: true, existingDevice: null };
  }
};

export const switchDevice = async (userId: string, newDeviceId: string) => {
  try {
    await update(ref(database, `${dbPaths.deviceSessions}/${userId}`), {
      deviceId: newDeviceId,
      loginTime: Date.now()
    });
    console.log('Device switched:', userId);
  } catch (error) {
    console.error('Error switching device:', error);
    throw error;
  }
};

export const logoutDevice = async (userId: string) => {
  try {
    await update(ref(database, `${dbPaths.deviceSessions}/${userId}`), {
      isActive: false,
      logoutTime: Date.now()
    });
    console.log('Device logged out:', userId);
  } catch (error) {
    console.error('Error logging out device:', error);
    throw error;
  }
};

// Real-time listeners
export const listenToMessages = (
  consultancyName: string, 
  referralCode: string, 
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesPath = `${dbPaths.consultancies}/${consultancyName}/users/${referralCode}/messages`;
  const messagesRef = ref(database, messagesPath);
  
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const messages = Object.values(data).map((message: any) => ({
        ...message,
        timestamp: new Date(message.timestamp)
      }));
      callback(messages);
    } else {
      callback([]);
    }
  });
  
  return () => off(messagesRef, 'value', unsubscribe);
};

export const listenToUserStatus = (userId: string, callback: (user: User | null) => void): (() => void) => {
  const userRef = ref(database, `${dbPaths.verifiedUsers}/${userId}`);
  
  const unsubscribe = onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const user: User = {
        ...userData,
        lastSeen: new Date(userData.lastSeen),
        joinedAt: new Date(userData.joinedAt)
      };
      callback(user);
    } else {
      callback(null);
    }
  });
  
  return () => off(userRef, 'value', unsubscribe);
};