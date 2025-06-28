interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isBot: boolean;
}

// Sample names based on countries
const namesByCountry: Record<string, string[]> = {
  uk: ['James', 'Oliver', 'Emma', 'Charlotte', 'Harry', 'George'],
  us: ['Michael', 'Christopher', 'Jessica', 'Ashley', 'Matthew', 'Emily'],
  ca: ['Liam', 'Noah', 'Olivia', 'Emma', 'William', 'Benjamin'],
  au: ['Jack', 'Oliver', 'Charlotte', 'Olivia', 'William', 'Noah'],
  de: ['Maximilian', 'Alexander', 'Sophie', 'Marie', 'Paul', 'Lukas'],
  fr: ['Lucas', 'Louis', 'Emma', 'Jade', 'Gabriel', 'Jules'],
  in: ['Aarav', 'Vivaan', 'Aanya', 'Diya', 'Reyansh', 'Aadhya'],
  jp: ['Haruto', 'Yuto', 'Himari', 'Yui', 'Sota', 'Yuna'],
  br: ['Miguel', 'Arthur', 'Helena', 'Alice', 'Davi', 'Gabriel'],
  sg: ['Jun', 'Wei', 'Li', 'Min', 'Xiu', 'Yi'],
  za: ['Lethabo', 'Bandile', 'Nokuthula', 'Thando', 'Sipho', 'Ntando'],
  global: ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Jamie'],
};

// Generic names for fallback
const genericNames = ['Alex', 'Taylor', 'Jordan', 'Casey', 'Riley', 'Morgan'];

const sampleMessages = [
  "Has anyone finished the assignment for Professor Smith's class?",
  "I'm looking for a study partner for the upcoming exam.",
  "Does anyone have the notes from yesterday's lecture?",
  "What time does the library close today?",
  "Is anyone else having trouble with the online portal?",
  "Are there any good cafes near campus to study at?",
  "I'm organizing a study group for the physics exam, anyone interested?",
  "Did anyone understand the chapter on quantum mechanics?",
  "The deadline for the research paper was extended!",
  "Has anyone taken Professor Johnson's class before?",
  "I'm looking for recommendations on textbooks for this course.",
  "Are the campus shuttles running on the weekend?",
  "Does anyone know if we need to bring our laptops to tomorrow's class?",
  "I'm new here, can someone explain how the course registration works?",
  "Is anyone selling last semester's textbooks?",
];

export const generateMessages = (countryId: string): Message[] => {
  const names = namesByCountry[countryId] || genericNames;
  const numberOfMessages = 15 + Math.floor(Math.random() * 10);
  const messages: Message[] = [];
  
  // Generate a conversation with random timestamps in the past 2 hours
  const now = new Date();
  
  for (let i = 0; i < numberOfMessages; i++) {
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
    const timestamp = new Date(now.getTime() - (numberOfMessages - i) * 5 * 60000 - Math.random() * 100000);
    
    messages.push({
      id: `initial-${i}`,
      sender: randomName,
      text: randomMessage,
      timestamp,
      isBot: true,
    });
  }
  
  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};