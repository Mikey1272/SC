import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ReferralCode, Consultancy, User, Report, DeviceSession } from './models/ReferralCode.js';
import { 
  adminDb, 
  adminAuth, 
  dbPaths, 
  createUserSession, 
  checkDeviceSession, 
  switchDevice, 
  logoutDevice,
  saveUserToConsultancy,
  saveMessageToUser,
  getUserChatHistory,
  saveVerifiedUser,
  getVerifiedUser,
  saveConsultancy,
  saveReferralCodes
} from './services/firebaseService.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://chipper-meringue-f409cd.netlify.app"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory storage (fallback when Firebase is not available)
const referralCodes = new Map<string, ReferralCode>();
const consultancies = new Map<string, Consultancy>();
const users = new Map<string, User>();
const reports = new Map<string, Report>();
const userSockets = new Map<string, string>(); // userId -> socketId
const deviceSessions = new Map<string, DeviceSession>(); // userId -> session

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
  country: string;
  avatar: string;
  likes: number;
  replies: number;
  isModerated: boolean;
  violations?: string[];
}

interface Room {
  id: string;
  name: string;
  country: string;
  users: User[];
  messages: Message[];
  activeUsers: number;
}

const rooms = new Map<string, Room>();

// Initialize country rooms (only 5 countries as requested)
const countries = [
  { id: 'us', name: 'United States', flag: '🇺🇸' },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
  { id: 'de', name: 'Germany', flag: '🇩🇪' },
  { id: 'ca', name: 'Canada', flag: '🇨🇦' },
  { id: 'au', name: 'Australia', flag: '🇦🇺' },
];

countries.forEach(country => {
  rooms.set(country.id, {
    id: country.id,
    name: country.name,
    country: country.id,
    users: [],
    messages: [],
    activeUsers: Math.floor(Math.random() * 100) + 50
  });
});

// Content moderation function
const moderateMessage = (message: string): { isClean: boolean; cleanMessage: string; violations: string[] } => {
  const violations: string[] = [];
  let cleanMessage = message;

  // Enhanced profanity and contact sharing filter
  const badWords = ['spam', 'scam', 'fake', 'fraud', 'shit', 'fuck', 'damn', 'bitch'];
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const socialRegex = /@[a-zA-Z0-9._]+|whatsapp|telegram|instagram|facebook|snapchat|discord/gi;
  const contactRegex = /contact\s+me|dm\s+me|message\s+me|call\s+me|text\s+me/gi;

  // Check for bad words
  const lowerMessage = message.toLowerCase();
  for (const word of badWords) {
    if (lowerMessage.includes(word)) {
      violations.push('inappropriate_language');
      cleanMessage = cleanMessage.replace(new RegExp(word, 'gi'), '***');
    }
  }

  // Check for contact sharing
  if (phoneRegex.test(message)) {
    violations.push('phone_sharing');
    cleanMessage = cleanMessage.replace(phoneRegex, '[CONTACT REMOVED]');
  }

  if (emailRegex.test(message)) {
    violations.push('email_sharing');
    cleanMessage = cleanMessage.replace(emailRegex, '[EMAIL REMOVED]');
  }

  if (socialRegex.test(message)) {
    violations.push('social_sharing');
    cleanMessage = cleanMessage.replace(socialRegex, '[SOCIAL REMOVED]');
  }

  if (contactRegex.test(message)) {
    violations.push('contact_request');
    cleanMessage = cleanMessage.replace(contactRegex, '[CONTACT REQUEST REMOVED]');
  }

  return {
    isClean: violations.length === 0,
    cleanMessage,
    violations
  };
};

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Generate referral codes for consultancy
app.post('/api/admin/generate-referrals', authenticateToken, async (req, res) => {
  const { consultancyName, numberOfCodes } = req.body;
  const { accountType } = req.user;

  if (accountType !== 'admin' && accountType !== 'founder') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!consultancyName || !numberOfCodes || numberOfCodes <= 0) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const consultancyId = uuidv4();
  const codes: ReferralCode[] = [];
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiry

  // Create consultancy record
  const consultancy: Consultancy = {
    id: consultancyId,
    name: consultancyName,
    totalCodes: numberOfCodes,
    usedCodes: 0,
    createdAt: new Date(),
    isActive: true,
    referralCodes: []
  };

  // Generate referral codes
  for (let i = 0; i < numberOfCodes; i++) {
    const code = `${consultancyName.toUpperCase().replace(/\s+/g, '')}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const referralCode: ReferralCode = {
      id: uuidv4(),
      code,
      consultancyName,
      consultancyId,
      isUsed: false,
      createdAt: new Date(),
      expiresAt,
      createdBy: req.user.id
    };
    
    referralCodes.set(code, referralCode);
    consultancy.referralCodes.push(code);
    codes.push(referralCode);
  }

  consultancies.set(consultancyId, consultancy);

  // Save to Firebase
  try {
    await saveConsultancy(consultancyId, consultancy);
    await saveReferralCodes(codes);
    console.log('Consultancy and referral codes saved to Firebase');
  } catch (error) {
    console.error('Firebase save error:', error);
  }

  res.json({
    success: true,
    consultancyId,
    codes: codes.map(c => c.code),
    message: `Generated ${numberOfCodes} referral codes for ${consultancyName}`,
    expiresAt: expiresAt.toISOString()
  });
});

// Get consultancy details with referral codes
app.get('/api/admin/consultancy/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { accountType } = req.user;

  if (accountType !== 'admin' && accountType !== 'founder') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const consultancy = consultancies.get(id);
  if (!consultancy) {
    return res.status(404).json({ error: 'Consultancy not found' });
  }

  const referralCodeDetails = consultancy.referralCodes.map(codeStr => {
    const code = referralCodes.get(codeStr);
    return code ? {
      code: code.code,
      isUsed: code.isUsed,
      usedBy: code.usedBy,
      usedAt: code.usedAt,
      expiresAt: code.expiresAt,
      assignedCountry: code.assignedCountry,
      isExpired: new Date() > code.expiresAt
    } : null;
  }).filter(Boolean);

  res.json({
    ...consultancy,
    referralCodes: referralCodeDetails,
    unusedCodes: referralCodeDetails.filter(c => !c.isUsed && !c.isExpired).length,
    expiredCodes: referralCodeDetails.filter(c => c.isExpired).length
  });
});

// Validate referral code
app.post('/api/auth/validate-referral', async (req, res) => {
  const { referralCode } = req.body;

  if (!referralCode) {
    return res.status(400).json({ error: 'Referral code is required' });
  }

  const code = referralCodes.get(referralCode);
  if (!code) {
    return res.status(404).json({ error: 'Invalid referral code' });
  }

  if (code.isUsed) {
    return res.status(400).json({ error: 'Referral code already used' });
  }

  if (new Date() > code.expiresAt) {
    return res.status(400).json({ error: 'Referral code has expired' });
  }

  res.json({
    valid: true,
    consultancyName: code.consultancyName,
    expiresAt: code.expiresAt
  });
});

// Register with referral code
app.post('/api/auth/register-referral', async (req, res) => {
  const { username, referralCode, country, deviceId } = req.body;

  if (!username || !referralCode || !country || !deviceId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const code = referralCodes.get(referralCode);
  if (!code || code.isUsed) {
    return res.status(400).json({ error: 'Invalid or used referral code' });
  }

  if (new Date() > code.expiresAt) {
    return res.status(400).json({ error: 'Referral code has expired' });
  }

  // Check device session
  const existingUser = Array.from(users.values()).find(u => u.referralCode === referralCode);
  if (existingUser) {
    const sessionCheck = await checkDeviceSession(existingUser.id, deviceId);
    if (!sessionCheck.canLogin) {
      return res.status(400).json({ 
        error: 'This referral code is active on another device',
        existingDevice: sessionCheck.existingDevice,
        canSwitch: true
      });
    }
  }

  const userId = existingUser?.id || referralCode; // Use referral code as user ID
  const user: User = existingUser || {
    id: userId,
    username,
    country,
    assignedCountry: country, // Lock to selected country
    isOnline: false,
    lastSeen: new Date(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    accountType: 'referral',
    referralCode,
    consultancyName: code.consultancyName,
    deviceId,
    reportCount: 0,
    isBanned: false,
    joinedAt: new Date()
  };

  user.deviceId = deviceId;
  users.set(userId, user);

  // Save user data to Firebase under consultancy structure
  try {
    await saveUserToConsultancy(code.consultancyName, referralCode, {
      id: userId,
      username,
      country,
      assignedCountry: country,
      avatar: user.avatar,
      accountType: 'referral',
      referralCode,
      consultancyName: code.consultancyName,
      deviceId,
      reportCount: 0,
      isBanned: false,
      joinedAt: user.joinedAt.toISOString(),
      lastSeen: user.lastSeen.toISOString()
    });
    console.log('User saved to Firebase under consultancy:', code.consultancyName);
  } catch (error) {
    console.error('Error saving user to Firebase:', error);
  }

  // Create device session
  await createUserSession(userId, deviceId, referralCode);

  // Mark referral code as used
  code.isUsed = true;
  code.usedBy = userId;
  code.usedAt = new Date();
  code.assignedCountry = country;
  code.deviceId = deviceId;
  referralCodes.set(referralCode, code);

  // Update consultancy stats
  const consultancy = Array.from(consultancies.values()).find(c => c.name === code.consultancyName);
  if (consultancy) {
    consultancy.usedCodes++;
    consultancies.set(consultancy.id, consultancy);
  }

  const token = jwt.sign({ id: userId, accountType: 'referral' }, JWT_SECRET);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      country: user.country,
      assignedCountry: user.assignedCountry,
      accountType: user.accountType,
      consultancyName: user.consultancyName
    }
  });
});

// Switch device for referral user
app.post('/api/auth/switch-device', async (req, res) => {
  const { referralCode, deviceId, username } = req.body;

  if (!referralCode || !deviceId) {
    return res.status(400).json({ error: 'Referral code and device ID are required' });
  }

  const code = referralCodes.get(referralCode);
  if (!code || !code.isUsed) {
    return res.status(400).json({ error: 'Invalid referral code' });
  }

  const user = users.get(code.usedBy!);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Logout from previous device
  await logoutDevice(user.id);
  
  // Update user device
  user.deviceId = deviceId;
  users.set(user.id, user);

  // Create new session
  await createUserSession(user.id, deviceId, referralCode);

  // Update referral code device
  code.deviceId = deviceId;
  referralCodes.set(referralCode, code);

  const token = jwt.sign({ id: user.id, accountType: 'referral' }, JWT_SECRET);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      country: user.country,
      assignedCountry: user.assignedCountry,
      accountType: user.accountType,
      consultancyName: user.consultancyName
    }
  });
});

// Register with email/password (non-referral users)
app.post('/api/auth/register-email', async (req, res) => {
  const { username, email, password, deviceId, firebaseUid } = req.body;

  if (!username || !email || !deviceId) {
    return res.status(400).json({ error: 'Username, email and device ID are required' });
  }

  // Check if user already exists
  const existingUser = Array.from(users.values()).find(u => u.email === email);
  if (existingUser) {
    // User exists, this is a login attempt
    const token = jwt.sign({ id: existingUser.id, accountType: existingUser.accountType }, JWT_SECRET);
    
    // Update device session
    await createUserSession(existingUser.id, deviceId);
    
    res.json({
      success: true,
      token,
      user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        country: existingUser.country,
        accountType: existingUser.accountType,
        visaVerified: existingUser.visaVerified
      },
      needsVisaVerification: !existingUser.visaVerified
    });
    return;
  }

  const userId = firebaseUid || uuidv4();
  
  const user: User = {
    id: userId,
    username,
    email,
    country: 'pending', // Will be set after visa verification
    isOnline: false,
    lastSeen: new Date(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    accountType: 'verified',
    deviceId,
    reportCount: 0,
    isBanned: false,
    joinedAt: new Date(),
    visaVerified: false,
    firebaseUid
  };

  users.set(userId, user);

  // Save to Firebase
  try {
    await saveVerifiedUser(userId, {
      id: userId,
      username,
      email,
      avatar: user.avatar,
      accountType: 'verified',
      deviceId,
      reportCount: 0,
      isBanned: false,
      joinedAt: user.joinedAt.toISOString(),
      lastSeen: user.lastSeen.toISOString(),
      visaVerified: false,
      firebaseUid
    });
    console.log('Verified user saved to Firebase:', userId);
  } catch (error) {
    console.error('Error saving verified user to Firebase:', error);
  }

  await createUserSession(userId, deviceId);

  const token = jwt.sign({ id: userId, accountType: 'verified' }, JWT_SECRET);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      accountType: user.accountType,
      visaVerified: user.visaVerified
    },
    needsVisaVerification: true
  });
});

// Login with email/password
app.post('/api/auth/login-email', async (req, res) => {
  const { email, deviceId, firebaseUid } = req.body;

  if (!email || !deviceId) {
    return res.status(400).json({ error: 'Email and device ID are required' });
  }

  // Find user by email or firebaseUid
  const user = Array.from(users.values()).find(u => u.email === email || u.firebaseUid === firebaseUid);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update device session
  await createUserSession(user.id, deviceId);

  const token = jwt.sign({ id: user.id, accountType: user.accountType }, JWT_SECRET);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      country: user.country,
      accountType: user.accountType,
      visaVerified: user.visaVerified
    },
    needsVisaVerification: !user.visaVerified
  });
});

// Upload visa for verification
app.post('/api/auth/upload-visa', authenticateToken, async (req, res) => {
  const { visaPhotoUrl, country } = req.body;
  const userId = req.user.id;

  if (!visaPhotoUrl || !country) {
    return res.status(400).json({ error: 'Visa photo and country are required' });
  }

  const user = users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.visaPhotoUrl = visaPhotoUrl;
  user.country = country;
  user.assignedCountry = country;
  // In production, this would trigger manual verification
  user.visaVerified = true; // Auto-approve for demo
  
  users.set(userId, user);

  // Update in Firebase
  try {
    await saveVerifiedUser(userId, {
      ...user,
      visaPhotoUrl,
      country,
      assignedCountry: country,
      visaVerified: true,
      lastUpdated: Date.now()
    });
    console.log('User visa verification updated in Firebase:', userId);
  } catch (error) {
    console.error('Error updating user visa in Firebase:', error);
  }

  res.json({
    success: true,
    message: 'Visa uploaded successfully. Verification completed.',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      country: user.country,
      accountType: user.accountType,
      visaVerified: user.visaVerified
    }
  });
});

// Admin login
app.post('/api/auth/admin-login', (req, res) => {
  const { username, password, type } = req.body;

  // Hardcoded admin credentials (in production, use proper authentication)
  const adminCredentials = {
    admin: { username: 'admin', password: 'admin123' },
    founder: { username: 'founder', password: 'founder123' }
  };

  const creds = adminCredentials[type as keyof typeof adminCredentials];
  if (!creds || username !== creds.username || password !== creds.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const userId = uuidv4();
  const token = jwt.sign({ id: userId, accountType: type }, JWT_SECRET);

  res.json({
    success: true,
    token,
    user: {
      id: userId,
      username,
      accountType: type
    }
  });
});

// Get dashboard stats (live data)
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  const totalUsers = users.size;
  const onlineUsers = Array.from(users.values()).filter(u => u.isOnline).length;
  const totalMessages = Array.from(rooms.values()).reduce((sum, room) => sum + room.messages.length, 0);
  const totalConsultancies = consultancies.size;
  const totalReferralCodes = referralCodes.size;
  const usedReferralCodes = Array.from(referralCodes.values()).filter(c => c.isUsed).length;
  const expiredReferralCodes = Array.from(referralCodes.values()).filter(c => new Date() > c.expiresAt).length;
  const pendingReports = Array.from(reports.values()).filter(r => r.status === 'pending').length;

  const countryStats = countries.map(country => {
    const room = rooms.get(country.id);
    const countryUsers = Array.from(users.values()).filter(u => u.assignedCountry === country.id);
    return {
      country: country.name,
      flag: country.flag,
      activeUsers: room?.activeUsers || 0,
      totalMessages: room?.messages.length || 0,
      totalUsers: countryUsers.length,
      onlineUsers: countryUsers.filter(u => u.isOnline).length
    };
  });

  res.json({
    totalUsers,
    onlineUsers,
    totalMessages,
    totalConsultancies,
    totalReferralCodes,
    usedReferralCodes,
    expiredReferralCodes,
    pendingReports,
    countryStats
  });
});

// Get consultancies with enhanced details
app.get('/api/admin/consultancies', authenticateToken, (req, res) => {
  const consultancyList = Array.from(consultancies.values()).map(c => {
    const codes = c.referralCodes.map(codeStr => referralCodes.get(codeStr)).filter(Boolean);
    const expiredCodes = codes.filter(code => new Date() > code.expiresAt).length;
    
    return {
      ...c,
      unusedCodes: c.totalCodes - c.usedCodes,
      expiredCodes,
      activeCodes: c.totalCodes - c.usedCodes - expiredCodes
    };
  });

  res.json(consultancyList);
});

// Report user
app.post('/api/report-user', authenticateToken, (req, res) => {
  const { reportedUserId, reason, message } = req.body;
  const reporterId = req.user.id;

  if (!reportedUserId || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const reportId = uuidv4();
  const report: Report = {
    id: reportId,
    reporterId,
    reportedUserId,
    reason,
    message,
    status: 'pending',
    createdAt: new Date()
  };

  reports.set(reportId, report);

  // Increment report count for reported user
  const reportedUser = users.get(reportedUserId);
  if (reportedUser) {
    reportedUser.reportCount++;
    users.set(reportedUserId, reportedUser);

    // Auto-ban if too many reports
    if (reportedUser.reportCount >= 5) {
      reportedUser.isBanned = true;
      users.set(reportedUserId, reportedUser);
      
      // Disconnect banned user
      const socketId = userSockets.get(reportedUserId);
      if (socketId) {
        io.to(socketId).emit('banned', { reason: 'Multiple reports received' });
        io.sockets.sockets.get(socketId)?.disconnect();
      }
    }
  }

  res.json({ success: true, reportId });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (data: { userId: string; username: string; country: string; token: string }) => {
    const { userId, username, country, token } = data;
    
    // Verify token
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      socket.emit('auth-error', { message: 'Invalid token' });
      return;
    }

    const user = users.get(userId);
    if (!user || user.isBanned) {
      socket.emit('auth-error', { message: 'User not found or banned' });
      return;
    }

    // Check if user can access this country
    if (user.assignedCountry && user.assignedCountry !== country) {
      socket.emit('country-restricted', { 
        message: `You can only access ${user.assignedCountry} chat room`,
        assignedCountry: user.assignedCountry
      });
      return;
    }

    // Update user status
    user.isOnline = true;
    user.lastSeen = new Date();
    users.set(userId, user);
    userSockets.set(userId, socket.id);
    
    // Join room
    socket.join(country);
    
    // Add user to room
    const room = rooms.get(country);
    if (room) {
      room.users = room.users.filter(u => u.id !== userId);
      room.users.push(user);
      room.activeUsers = room.users.length;
      
      // Send room data to user
      socket.emit('room-data', {
        room: {
          id: room.id,
          name: room.name,
          country: room.country,
          activeUsers: room.activeUsers
        },
        messages: room.messages,
        users: room.users
      });
      
      // Notify others in room
      socket.to(country).emit('user-joined', user);
      io.to(country).emit('active-users-updated', room.activeUsers);
    }
  });

  socket.on('send-message', async (data: { userId: string; text: string; country: string; token: string }) => {
    const { userId, text, country, token } = data;
    
    // Verify token
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      socket.emit('auth-error', { message: 'Invalid token' });
      return;
    }

    const user = users.get(userId);
    const room = rooms.get(country);
    
    if (!user || !room || user.isBanned) {
      return;
    }

    // Check country restriction
    if (user.assignedCountry && user.assignedCountry !== country) {
      socket.emit('country-restricted', { 
        message: `You can only send messages in ${user.assignedCountry} chat room`,
        assignedCountry: user.assignedCountry
      });
      return;
    }

    // Moderate message
    const moderation = moderateMessage(text);
    
    const message: Message = {
      id: uuidv4(),
      userId,
      username: user.username,
      text: moderation.cleanMessage,
      timestamp: new Date(),
      country,
      avatar: user.avatar,
      likes: 0,
      replies: 0,
      isModerated: !moderation.isClean,
      violations: moderation.violations
    };
    
    room.messages.push(message);

    // Save message to Firebase if user has referral code
    if (user.referralCode && user.consultancyName) {
      try {
        await saveMessageToUser(user.consultancyName, user.referralCode, message);
        console.log('Message saved to Firebase for user:', user.referralCode);
      } catch (error) {
        console.error('Error saving message to Firebase:', error);
      }
    }
    
    // Send moderation warning if needed
    if (!moderation.isClean) {
      socket.emit('moderation-warning', {
        violations: moderation.violations,
        originalMessage: text,
        cleanMessage: moderation.cleanMessage
      });
    }
    
    // Broadcast message to all users in room
    io.to(country).emit('new-message', message);
  });

  socket.on('like-message', (data: { messageId: string; country: string; token: string }) => {
    const { messageId, country, token } = data;
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return;
    }

    const room = rooms.get(country);
    if (room) {
      const message = room.messages.find(m => m.id === messageId);
      if (message) {
        message.likes++;
        io.to(country).emit('message-liked', { messageId, likes: message.likes });
      }
    }
  });

  socket.on('typing', (data: { userId: string; country: string; isTyping: boolean; token: string }) => {
    const { userId, country, isTyping, token } = data;
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return;
    }

    const user = users.get(userId);
    if (user) {
      socket.to(country).emit('user-typing', { userId, username: user.username, isTyping });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and remove user
    let disconnectedUser: User | undefined;
    let userCountry: string | undefined;
    
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        disconnectedUser = users.get(userId);
        if (disconnectedUser) {
          userCountry = disconnectedUser.country;
          disconnectedUser.isOnline = false;
          disconnectedUser.lastSeen = new Date();
          users.set(userId, disconnectedUser);
        }
        userSockets.delete(userId);
        break;
      }
    }
    
    if (disconnectedUser && userCountry) {
      const room = rooms.get(userCountry);
      if (room) {
        room.users = room.users.filter(u => u.id !== disconnectedUser!.id);
        room.activeUsers = room.users.length;
        
        socket.to(userCountry).emit('user-left', disconnectedUser);
        io.to(userCountry).emit('active-users-updated', room.activeUsers);
      }
    }
  });
});

// Get rooms data
app.get('/api/rooms', (req, res) => {
  const roomsData = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    country: room.country,
    activeUsers: room.activeUsers,
    flag: countries.find(c => c.id === room.country)?.flag || '🌎'
  }));
  res.json(roomsData);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});