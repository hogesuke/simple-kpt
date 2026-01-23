import { createContext, ReactNode, RefCallback, useCallback, useContext, useState } from 'react';

interface HeaderPortalContextValue {
  portalElement: HTMLDivElement | null;
  setPortalRef: RefCallback<HTMLDivElement>;
}

const HeaderPortalContext = createContext<HeaderPortalContextValue | null>(null);

interface HeaderPortalProviderProps {
  children: ReactNode;
}

export function HeaderPortalProvider({ children }: HeaderPortalProviderProps) {
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);

  const setPortalRef = useCallback((element: HTMLDivElement | null) => {
    setPortalElement(element);
  }, []);

  return <HeaderPortalContext.Provider value={{ portalElement, setPortalRef }}>{children}</HeaderPortalContext.Provider>;
}

export function useHeaderPortal(): HeaderPortalContextValue {
  const context = useContext(HeaderPortalContext);
  if (!context) {
    throw new Error('useHeaderPortal must be used within a HeaderPortalProvider');
  }
  return context;
}
