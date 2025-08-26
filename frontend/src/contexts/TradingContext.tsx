import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

interface TradingContextType {
  isLiveMode: boolean;
  setIsLiveMode: (value: boolean) => void;
  showLiveWarning: boolean;
  setShowLiveWarning: (value: boolean) => void;
  exchangeStatus: { [key: string]: boolean };
}

const TradingContext = createContext<TradingContextType>({} as TradingContextType);

export const useTradingContext = () => useContext(TradingContext);

interface CustomWindow extends Window {
  logError?: (type: string, message: string, details?: string, component?: string) => void;
}

const logError = (type: 'error' | 'warning' | 'info', message: string, details?: string) => {
  console.log(`[${type.toUpperCase()}] ${message}`, details || '');
  if (typeof window !== 'undefined' && (window as CustomWindow).logError) {
    (window as CustomWindow).logError?.(type, message, details, 'Trading Context');
  }
};

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLiveMode, setIsLiveModeState] = useState(false);
  const [showLiveWarning, setShowLiveWarning] = useState(false);
  const [exchangeStatus, setExchangeStatus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const savedMode = localStorage.getItem('tradingMode');
    if (savedMode === 'live') {
      setIsLiveModeState(true);
      logError('info', 'Live trading mode restored from localStorage');
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/exchanges/status');
        if (!response.ok) {
          throw new Error('Failed to fetch exchange status');
        }
        const data = await response.json();
        setExchangeStatus(data);
        logError('info', 'Exchange status updated from backend');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logError('error', 'Failed to fetch exchange status', errorMessage);
        toast({ title: 'Error', description: 'Could not connect to backend.', variant: 'destructive' });
      }
    };

    fetchStatus();
    // Fetch status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const setIsLiveMode = (value: boolean) => {
    setIsLiveModeState(value);
    localStorage.setItem('tradingMode', value ? 'live' : 'paper');
    logError('info', `Trading mode changed to ${value ? 'LIVE' : 'PAPER'}`);
  };

  return (
    <TradingContext.Provider value={{
      isLiveMode, setIsLiveMode, showLiveWarning, setShowLiveWarning,
      exchangeStatus
    }}>
      {children}
    </TradingContext.Provider>
  );
};

export default TradingProvider;