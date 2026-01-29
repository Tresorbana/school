/**
 * API Provider that initializes global contexts for token expiration handling
 */

import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../../utils/context/AuthContext';
import { useToast } from '../../utils/context/ToastContext';
import { setGlobalContexts } from '../../utils/apiClient';

interface ApiProviderProps {
  children: ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  const { logout } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    // Initialize global contexts for API client
    setGlobalContexts(logout, addToast);
  }, [logout, addToast]);

  return <>{children}</>;
}