// Enhanced content moderation with multilingual support
const badWordsMultilingual = {
  english: [
    'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'piss',
    'hell', 'stupid', 'idiot', 'moron', 'retard', 'gay', 'fag', 'nigger',
    'whore', 'slut', 'pussy', 'dick', 'cock', 'penis', 'vagina', 'sex'
  ],
  spanish: [
    'mierda', 'joder', 'puta', 'cabrón', 'pendejo', 'idiota', 'estúpido',
    'coño', 'carajo', 'hijo de puta', 'maricón', 'gilipollas'
  ],
  french: [
    'merde', 'putain', 'connard', 'salope', 'con', 'bite', 'chatte',
    'enculé', 'fils de pute', 'bordel', 'crétin', 'imbécile'
  ],
  german: [
    'scheiße', 'fick', 'arschloch', 'hurensohn', 'fotze', 'schwanz',
    'muschi', 'verdammt', 'blöd', 'idiot', 'dumm'
  ],
  italian: [
    'merda', 'cazzo', 'puttana', 'stronzo', 'figa', 'coglione',
    'bastardo', 'idiota', 'stupido', 'porco dio'
  ],
  portuguese: [
    'merda', 'caralho', 'puta', 'filho da puta', 'cu', 'buceta',
    'porra', 'idiota', 'burro', 'estúpido'
  ],
  hindi: [
    'भोसड़ी', 'रंडी', 'चूतिया', 'मादरचोद', 'भेनचोद', 'गांडू',
    'कुत्ता', 'साला', 'हरामी', 'कमीना'
  ],
  arabic: [
    'كلب', 'حمار', 'غبي', 'أحمق', 'لعين', 'قذر',
    'وسخ', 'حقير', 'منحط', 'فاسد'
  ],
  chinese: [
    '操', '妈的', '傻逼', '白痴', '混蛋', '王八蛋',
    '狗屎', '贱人', '婊子', '蠢货'
  ],
  japanese: [
    'ばか', 'あほ', 'くそ', 'しね', 'きちがい', 'ぶす',
    'でぶ', 'うざい', 'むかつく', 'やばい'
  ],
  korean: [
    '바보', '멍청이', '개새끼', '씨발', '병신', '미친',
    '죽어', '꺼져', '닥쳐', '시끄러워'
  ],
  russian: [
    'сука', 'блядь', 'пизда', 'хуй', 'говно', 'дебил',
    'идиот', 'тупой', 'урод', 'мудак'
  ]
};

// Contact sharing patterns
const contactPatterns = {
  phone: [
    /(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    /\b\d{10,15}\b/g
  ],
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Za-z]{2,}\b/g
  ],
  socialMedia: [
    /@[a-zA-Z0-9._]+/g,
    /instagram\.com\/[a-zA-Z0-9._]+/gi,
    /facebook\.com\/[a-zA-Z0-9._]+/gi,
    /twitter\.com\/[a-zA-Z0-9._]+/gi,
    /tiktok\.com\/@[a-zA-Z0-9._]+/gi,
    /snapchat\.com\/add\/[a-zA-Z0-9._]+/gi,
    /t\.me\/[a-zA-Z0-9._]+/gi,
    /wa\.me\/[0-9]+/gi,
    /whatsapp\.com\/[a-zA-Z0-9._]+/gi
  ]
};

// Social media keywords
const socialMediaKeywords = [
  'whatsapp', 'telegram', 'instagram', 'facebook', 'snapchat', 'discord',
  'tiktok', 'twitter', 'linkedin', 'youtube', 'twitch', 'reddit',
  'watsapp', 'insta', 'fb', 'snap', 'disc', 'ig', 'yt', 'tt',
  'add me', 'follow me', 'dm me', 'message me', 'text me', 'call me',
  'my number', 'my email', 'my insta', 'my snap', 'my ig', 'my fb',
  'contact me', 'reach me', 'find me on', 'add me on', 'follow me on'
];

// Contact request phrases in multiple languages
const contactRequestPhrases = {
  english: [
    'dm me', 'message me', 'text me', 'call me', 'add me', 'contact me',
    'my number', 'my email', 'my phone', 'reach out', 'get in touch',
    'private message', 'personal message', 'outside chat'
  ],
  spanish: [
    'escríbeme', 'contáctame', 'mi número', 'mi email', 'mensaje privado',
    'háblame', 'llámame', 'agrégame'
  ],
  french: [
    'écris-moi', 'contacte-moi', 'mon numéro', 'mon email', 'message privé',
    'appelle-moi', 'ajoute-moi'
  ],
  german: [
    'schreib mir', 'kontaktiere mich', 'meine nummer', 'meine email',
    'private nachricht', 'ruf mich an', 'füge mich hinzu'
  ],
  hindi: [
    'मुझे मैसेज करो', 'संपर्क करें', 'मेरा नंबर', 'मेरी ईमेल',
    'प्राइवेट मैसेज', 'कॉल करो', 'ऐड करो'
  ]
};

export const moderateMessage = (message: string): { 
  isClean: boolean; 
  cleanMessage: string; 
  violations: string[] 
} => {
  const violations: string[] = [];
  let cleanMessage = message;
  const lowerMessage = message.toLowerCase();

  // Check for profanity in multiple languages
  Object.entries(badWordsMultilingual).forEach(([language, words]) => {
    words.forEach(word => {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(lowerMessage)) {
        violations.push(`inappropriate_language_${language}`);
        cleanMessage = cleanMessage.replace(regex, '***');
      }
    });
  });

  // Check for phone numbers
  contactPatterns.phone.forEach(pattern => {
    if (pattern.test(message)) {
      violations.push('phone_sharing');
      cleanMessage = cleanMessage.replace(pattern, '[CONTACT REMOVED]');
    }
  });

  // Check for email addresses
  contactPatterns.email.forEach(pattern => {
    if (pattern.test(message)) {
      violations.push('email_sharing');
      cleanMessage = cleanMessage.replace(pattern, '[EMAIL REMOVED]');
    }
  });

  // Check for social media handles and links
  contactPatterns.socialMedia.forEach(pattern => {
    if (pattern.test(message)) {
      violations.push('social_media_sharing');
      cleanMessage = cleanMessage.replace(pattern, '[SOCIAL REMOVED]');
    }
  });

  // Check for social media keywords
  socialMediaKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(lowerMessage)) {
      violations.push('social_media_mention');
      cleanMessage = cleanMessage.replace(regex, '[SOCIAL REMOVED]');
    }
  });

  // Check for contact request phrases in multiple languages
  Object.entries(contactRequestPhrases).forEach(([language, phrases]) => {
    phrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(lowerMessage)) {
        violations.push(`contact_request_${language}`);
        cleanMessage = cleanMessage.replace(regex, '[CONTACT REQUEST REMOVED]');
      }
    });
  });

  // Check for URL patterns
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b)/gi;
  if (urlPattern.test(message)) {
    violations.push('url_sharing');
    cleanMessage = cleanMessage.replace(urlPattern, '[LINK REMOVED]');
  }

  // Check for potential coded contact sharing
  const codedPatterns = [
    /\b\d+\s*[-_]\s*\d+\s*[-_]\s*\d+/g, // Numbers with separators
    /\b[a-zA-Z]+\d+[a-zA-Z]*\b/g, // Mixed alphanumeric that could be usernames
  ];

  codedPatterns.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches && matches.some(match => match.length > 6)) {
      violations.push('potential_contact_sharing');
      cleanMessage = cleanMessage.replace(pattern, '[POTENTIAL CONTACT REMOVED]');
    }
  });

  return {
    isClean: violations.length === 0,
    cleanMessage,
    violations: [...new Set(violations)] // Remove duplicates
  };
};

export const generateViolationWarning = (violations: string[]): string => {
  const warningMessages: Record<string, string> = {
    inappropriate_language_english: 'Inappropriate language detected (English)',
    inappropriate_language_spanish: 'Inappropriate language detected (Spanish)',
    inappropriate_language_french: 'Inappropriate language detected (French)',
    inappropriate_language_german: 'Inappropriate language detected (German)',
    inappropriate_language_italian: 'Inappropriate language detected (Italian)',
    inappropriate_language_portuguese: 'Inappropriate language detected (Portuguese)',
    inappropriate_language_hindi: 'Inappropriate language detected (Hindi)',
    inappropriate_language_arabic: 'Inappropriate language detected (Arabic)',
    inappropriate_language_chinese: 'Inappropriate language detected (Chinese)',
    inappropriate_language_japanese: 'Inappropriate language detected (Japanese)',
    inappropriate_language_korean: 'Inappropriate language detected (Korean)',
    inappropriate_language_russian: 'Inappropriate language detected (Russian)',
    phone_sharing: 'Phone number sharing is not allowed',
    email_sharing: 'Email sharing is not allowed',
    social_media_sharing: 'Social media handle/link sharing is not allowed',
    social_media_mention: 'Social media platform mentions are not allowed',
    contact_request_english: 'Requesting personal contact is not allowed',
    contact_request_spanish: 'Requesting personal contact is not allowed',
    contact_request_french: 'Requesting personal contact is not allowed',
    contact_request_german: 'Requesting personal contact is not allowed',
    contact_request_hindi: 'Requesting personal contact is not allowed',
    url_sharing: 'URL/Link sharing is not allowed',
    potential_contact_sharing: 'Potential contact information detected'
  };

  return violations
    .map(v => warningMessages[v] || 'Content policy violation')
    .join(', ');
};