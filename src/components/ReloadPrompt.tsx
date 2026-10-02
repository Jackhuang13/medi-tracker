import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Sparkles, Star } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // eslint-disable-next-line no-console
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      // eslint-disable-next-line no-console
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-3xl bg-white/95 backdrop-blur-md shadow-2xl border-2 border-sky-200 ring-4 ring-sky-100/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-400 to-pink-400 text-white shrink-0 shadow-sm">
          {needRefresh ? <Sparkles className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-slate-800">
            {needRefresh ? '發現新版本更新 ✨' : '離線就緒 🌟'}
          </h4>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed font-bold">
            {needRefresh
              ? `發現新版本 v${appVersion}，是否立即更新以取得最新常備藥物管理功能？`
              : '應用程式已完成離線快取，無網路時亦可順暢記錄與查詢藥品。'}
          </p>

          <div className="mt-3 flex items-center gap-2">
            {needRefresh && (
              <button
                type="button"
                onClick={() => updateServiceWorker(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 active:scale-95 text-xs font-black text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                立即更新
              </button>
            )}
            <button
              type="button"
              onClick={close}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              關閉
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          aria-label="關閉通知"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
