import Filter from 'bad-words';

// Enhanced profanity filter with custom words
const filter = new Filter();

// Add custom inappropriate words and contact sharing patterns
const customBadWords = [
  // Contact sharing patterns
  'whatsapp', 'telegram', 'instagram', 'facebook', 'snapchat', 'discord',
  'email', 'gmail', 'yahoo', 'outlook', 'phone', 'number', 'contact',
  '@gmail', '@yahoo', '@outlook', '@hotmail',
  // Common variations
  'watsapp', 'insta', 'fb', 'snap', 'disc',
  // Phone number patterns (will be handled separately)
];

filter.addWords(...customBadWords);

// Phone number and email regex patterns
const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const socialMediaRegex = /@[a-zA-Z0-9._]+|#[a-zA-Z0-9._]+/g;

export const moderateMessage = (message: string): { isClean: boolean; cleanMessage: string; violations: string[] } => {
  const violations: string[] = [];
  let cleanMessage = message;

  // Check for profanity
  if (filter.isProfane(message)) {
    violations.push('inappropriate_language');
    cleanMessage = filter.clean(message);
  }

  // Check for phone numbers
  if (phoneRegex.test(message)) {
    violations.push('phone_number_sharing');
    cleanMessage = cleanMessage.replace(phoneRegex, '[CONTACT REMOVED]');
  }

  // Check for email addresses
  if (emailRegex.test(message)) {
    violations.push('email_sharing');
    cleanMessage = cleanMessage.replace(emailRegex, '[EMAIL REMOVED]');
  }

  // Check for social media handles
  if (socialMediaRegex.test(message)) {
    violations.push('social_media_sharing');
    cleanMessage = cleanMessage.replace(socialMediaRegex, '[HANDLE REMOVED]');
  }

  // Check for common contact sharing phrases
  const contactPhrases = [
    'dm me', 'message me', 'text me', 'call me', 'add me',
    'my number', 'my email', 'my insta', 'my snap'
  ];

  const lowerMessage = message.toLowerCase();
  for (const phrase of contactPhrases) {
    if (lowerMessage.includes(phrase)) {
      violations.push('contact_request');
      cleanMessage = cleanMessage.replace(new RegExp(phrase, 'gi'), '[CONTACT REQUEST REMOVED]');
    }
  }

  return {
    isClean: violations.length === 0,
    cleanMessage,
    violations
  };
};

export const generateViolationWarning = (violations: string[]): string => {
  const warningMessages = {
    inappropriate_language: 'Inappropriate language detected',
    phone_number_sharing: 'Phone number sharing is not allowed',
    email_sharing: 'Email sharing is not allowed',
    social_media_sharing: 'Social media handle sharing is not allowed',
    contact_request: 'Requesting personal contact is not allowed'
  };

  return violations.map(v => warningMessages[v as keyof typeof warningMessages]).join(', ');
};