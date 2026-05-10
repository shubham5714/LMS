"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/shared/lib/supabase';

interface Tenant {
  id: string;
  name: string;
}

interface TenantContextType {
  assignedTenants: Tenant[];
  selectedTenantIds: string | string[];
  setSelectedTenantIds: (tenantIds: string | string[]) => void;
  updateAssignedTenants: (tenants: Tenant[]) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [assignedTenants, setAssignedTenants] = useState<Tenant[]>([]);
  const [selectedTenantIds, setSelectedTenantIdsState] = useState<string | string[]>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load tenant data and validate authentication on mount
  useEffect(() => {
    const loadTenantDataAndValidateAuth = async () => {
      try {
        // First check if user is authenticated with Supabase
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('User not authenticated with Supabase, clearing tenant data');
          setAssignedTenants([]);
          setSelectedTenantIdsState('all');
          setIsLoading(false);
          return;
        }

        // User is authenticated, now check session storage
        const tenantsRaw = sessionStorage.getItem('assignedTenants');
        const selectedRaw = sessionStorage.getItem('selectedTenantIds');
        
        if (tenantsRaw) {
          setAssignedTenants(JSON.parse(tenantsRaw));
        } else {
          setAssignedTenants([]);
        }
        
        if (selectedRaw) {
          setSelectedTenantIdsState(JSON.parse(selectedRaw));
        }
      } catch (error) {
        console.error('Error during tenant data validation:', error);
        setAssignedTenants([]);
        setSelectedTenantIdsState('all');
      } finally {
        setIsLoading(false);
      }
    };

    loadTenantDataAndValidateAuth();
    
    // Listen for tenant updates from login page (same tab)
    const handleTenantsUpdated = (event: CustomEvent) => {
      setAssignedTenants(event.detail);
      setSelectedTenantIdsState('all');
    };
    
    // Listen for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'assignedTenants') {
        if (event.newValue) {
          try {
            setAssignedTenants(JSON.parse(event.newValue));
          } catch (error) {
            console.error('Error parsing tenant data from storage event:', error);
          }
        }
      }
      if (event.key === 'selectedTenantIds') {
        if (event.newValue) {
          try {
            setSelectedTenantIdsState(JSON.parse(event.newValue));
          } catch (error) {
            console.error('Error parsing selected tenant IDs from storage event:', error);
          }
        }
      }
    };
    
    // Set up BroadcastChannel for cross-tab communication
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel('tenantDataSync');
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'tenantsUpdated') {
          setAssignedTenants(event.data.data);
          setSelectedTenantIdsState('all');
        }
      };
    }
    
    window.addEventListener('tenantsUpdated', handleTenantsUpdated as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('tenantsUpdated', handleTenantsUpdated as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []);

  // Persist selected tenant IDs to session storage when they change
  useEffect(() => {
    if (!isLoading) {
      try {
        sessionStorage.setItem('selectedTenantIds', JSON.stringify(selectedTenantIds));
      } catch (error) {
        console.error('Error saving selected tenant IDs to session storage:', error);
      }
    }
  }, [selectedTenantIds, isLoading]);

  const setSelectedTenantIds = (tenantIds: string | string[]) => {
    setSelectedTenantIdsState(tenantIds);
  };

  const updateAssignedTenants = (tenants: Tenant[]) => {
    setAssignedTenants(tenants);
    // Also update sessionStorage
    try {
      sessionStorage.setItem('assignedTenants', JSON.stringify(tenants));
    } catch (error) {
      console.error('Error saving assigned tenants to session storage:', error);
    }
  };

  const value: TenantContextType = {
    assignedTenants,
    selectedTenantIds,
    setSelectedTenantIds,
    updateAssignedTenants,
    isLoading
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
};

// Custom hook to update tenants from outside the context (for login page)
export const useUpdateTenants = () => {
  const updateTenants = (tenants: Tenant[]) => {
    try {
      sessionStorage.setItem('assignedTenants', JSON.stringify(tenants));
      sessionStorage.setItem('selectedTenantIds', JSON.stringify('all'));
      
      // Dispatch a custom event to notify the context (same tab)
      window.dispatchEvent(new CustomEvent('tenantsUpdated', { detail: tenants }));
      
      // Trigger cross-tab synchronization with BroadcastChannel API
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('tenantDataSync');
        channel.postMessage({ type: 'tenantsUpdated', data: tenants });
        channel.close();
      }
    } catch (error) {
      console.error('Error updating tenants:', error);
    }
  };
  
  return updateTenants;
};
