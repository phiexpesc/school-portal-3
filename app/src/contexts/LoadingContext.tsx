import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { LoadingOverlay } from '@/components/ui/LoadingButton';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback((message = 'Loading...') => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoadingMessage(message);
    setIsLoading(true);
    
    // Auto-hide loading after 10 seconds as failsafe
    timeoutRef.current = setTimeout(() => {
      console.warn('Loading timeout - auto-hiding overlay');
      setIsLoading(false);
    }, 10000);
  }, []);

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>, message = 'Loading...'): Promise<T> => {
    startLoading(message);
    try {
      const result = await fn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, startLoading, stopLoading, withLoading }}>
      {children}
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
