import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  isSubscribed: boolean;
  setIsSubscribed: (value: boolean) => void;
  username: string;
  setUsername: (value: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [username, setUsername] = useState('');

  return (
    <ChatContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        isSubscribed,
        setIsSubscribed,
        username,
        setUsername,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};