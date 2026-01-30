import { ReactNode } from 'react';

interface FormErrorAlertProps {
  children: ReactNode;
}

export function FormErrorAlert({ children }: FormErrorAlertProps) {
  return (
    <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-600">
      {children}
    </p>
  );
}
