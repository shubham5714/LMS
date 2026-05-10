"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/shared/lib/supabase';

interface UserData {
  username: string;
  role: string;
  timezone: string;
}

interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user data and validate authentication on mount
  useEffect(() => {
    const loadUserDataAndValidateAuth = async () => {
      try {
        // First check if user is authenticated with Supabase
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('User not authenticated with Supabase');
          setUserData(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // User is authenticated, now check session storage
        const userRoleRaw = sessionStorage.getItem('userRole');
        
        if (userRoleRaw) {
          const userRoleData = JSON.parse(userRoleRaw);
          setUserData({
            username: userRoleData.username,
            role: userRoleData.role,
            timezone: userRoleData.timezone || 'UTC'
          });
          setIsAuthenticated(true);
        } else {
          setUserData(null);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error during authentication check:', error);
        setUserData(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserDataAndValidateAuth();
    
    // Listen for user data updates from login page (same tab)
    const handleUserDataUpdated = (event: CustomEvent) => {
      setUserData(event.detail);
    };
    
    // Listen for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'userRole') {
          if (event.newValue) {
            try {
              const userRoleData = JSON.parse(event.newValue);
              setUserData({
                username: userRoleData.username,
                role: userRoleData.role,
                timezone: userRoleData.timezone || 'UTC'
              });
            } catch (error) {
              console.error('Error parsing user data from storage event:', error);
              setUserData(null);
            }
          } else {
            setUserData(null);
          }
        }
    };
    
    // Set up BroadcastChannel for cross-tab communication
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel('userDataSync');
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'userDataUpdated') {
          setUserData(event.data.data);
        }
      };
    }
    
    window.addEventListener('userDataUpdated', handleUserDataUpdated as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdated as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []);

  const value: UserContextType = {
    userData,
    isLoading,
    isAuthenticated
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

// Custom hook to update user data from outside the context (for login page)
export const useUpdateUserData = () => {
  const updateUserData = (userData: UserData) => {
    try {
      sessionStorage.setItem('userRole', JSON.stringify(userData));
      
      // Dispatch a custom event to notify the context (same tab)
      window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: userData }));
      
      // Trigger storage event for cross-tab synchronization
      // Note: storage event is only fired for localStorage, not sessionStorage
      // So we'll use a different approach with BroadcastChannel API
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('userDataSync');
        channel.postMessage({ type: 'userDataUpdated', data: userData });
        channel.close();
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };
  
  return updateUserData;
};
