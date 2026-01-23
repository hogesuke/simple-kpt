import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useHeaderPortal } from '@/contexts/HeaderPortalContext';

interface HeaderActionsProps {
  children: ReactNode;
}

export function HeaderActions({ children }: HeaderActionsProps) {
  const { portalElement } = useHeaderPortal();

  if (!portalElement) {
    return null;
  }

  return createPortal(children, portalElement);
}
