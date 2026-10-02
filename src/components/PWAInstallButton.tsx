import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop 安裝流程
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-pink-200 transition-all cursor-pointer"
        title="安裝為桌面/手機 App 離線使用"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span className="hidden sm:inline">安裝 App ✨</span>
        <span className="sm:hidden">安裝</span>
      </button>
    );
  }

  // iOS Safari 安裝指引流程
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 active:scale-95 text-sky-900 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
          title="加入 iPhone/iPad 主畫面"
        >
          <Smartphone className="w-4 h-4 text-sky-600" />
          <span className="hidden sm:inline">加到主畫面 ✨</span>
          <span className="sm:hidden">加到桌面</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/40 p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-sky-100">
              <div className="flex items-center justify-between pb-3 border-b-2 border-sky-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-slate-800">在 iPhone / iPad 安裝</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/70 border border-sky-100">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="font-bold text-xs text-sky-950">
                    點擊 Safari 下方工具列的
                    <span className="inline-flex items-center gap-1 font-black text-sky-600 mx-1">
                      <Share className="w-3.5 h-3.5 inline" /> 分享
                    </span>
                    按鈕
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/70 border border-sky-100">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="font-bold text-xs text-sky-950">
                    向下捲動選單，點選
                    <span className="inline-flex items-center gap-1 font-black text-sky-600 mx-1">
                      <PlusSquare className="w-3.5 h-3.5 inline" /> 加入主畫面
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/70 border border-sky-100">
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="font-bold text-xs text-sky-950">
                    點擊右上角<strong>「新增」</strong>，即可在桌面享受全螢幕與離線用藥管理！✨
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 py-3 text-sm font-black text-white hover:from-sky-600 hover:to-blue-600 active:scale-98 transition shadow-md shadow-sky-200 cursor-pointer"
              >
                我知道了 ✨
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
