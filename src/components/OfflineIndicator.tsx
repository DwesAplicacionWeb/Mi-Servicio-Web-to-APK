import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 lg:bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-600 text-white px-3 py-2 text-xs font-semibold shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Modo sin conexión · Datos locales activos</span>
    </div>
  );
};
