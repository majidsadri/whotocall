import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoginModalContextType {
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isLoginModalVisible: boolean;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  const openLoginModal = () => setIsLoginModalVisible(true);
  const closeLoginModal = () => setIsLoginModalVisible(false);

  return (
    <LoginModalContext.Provider value={{ openLoginModal, closeLoginModal, isLoginModalVisible }}>
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error('useLoginModal must be used within a LoginModalProvider');
  }
  return context;
}
