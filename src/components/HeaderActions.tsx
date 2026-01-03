import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface HeaderActionsProps {
  children: ReactNode;
}

export const HEADER_ACTIONS_PORTAL_ID = 'header-actions-portal';

export function HeaderActions({ children }: HeaderActionsProps) {
  const container = document.getElementById(HEADER_ACTIONS_PORTAL_ID);

  if (!container) {
    return null;
  }

  return createPortal(children, container);
}
