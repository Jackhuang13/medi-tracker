import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/95 text-white shadow-lg backdrop-blur-xs border border-slate-700 text-xs font-medium animate-in fade-in slide-in-from-top-2">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>離線模式中 — 資料保存在本機，可正常記錄與查詢</span>
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
    </div>
  );
};
