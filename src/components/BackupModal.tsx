import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (jsonStr: string) => { success: boolean; message: string; count?: number };
  onResetToSample: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onImport,
  onResetToSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = onImport(content);
      setImportStatus(res);
      if (res.success) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border-2 border-sky-100 overflow-hidden">
        {/* 標頭 */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-sky-100 bg-gradient-to-r from-sky-50 via-blue-50 to-pink-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-500 text-white flex items-center justify-center shadow-sm">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-sky-950">資料備份與還原</h3>
              <p className="text-xs text-sky-700 font-bold">本機儲存、JSON 匯出與還原</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容選項 */}
        <div className="p-5 sm:p-6 space-y-4 text-slate-800 text-xs">
          {importStatus && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
                importStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-2 border-rose-200'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* 1. 匯出備份 */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-50 via-blue-50/50 to-teal-50/30 border-2 border-sky-100 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-sky-600" />
                匯出 JSON 備份檔
              </h4>
              <p className="text-[11px] text-sky-800 font-bold mt-0.5">
                將目前所有的藥物清單與服藥紀錄下載保存至電腦或手機
              </p>
            </div>
            <button
              onClick={onExport}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 active:scale-95 text-white font-black transition shadow-sm shrink-0 cursor-pointer"
            >
              立即匯出
            </button>
          </div>

          {/* 2. 匯入還原 */}
          <div className="p-4 rounded-3xl bg-sky-50/40 border-2 border-sky-100 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-slate-700" />
                匯入 JSON 備份檔
              </h4>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                選擇先前匯出的 .json 備份檔案，還原藥物資料
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-2xl bg-white border-2 border-sky-200 text-slate-800 font-black hover:bg-sky-50 active:scale-95 transition shadow-2xs shrink-0 cursor-pointer"
            >
              選擇檔案
            </button>
          </div>

          {/* 3. 重置為示範資料 */}
          <div className="p-4 rounded-3xl bg-rose-50/50 border-2 border-rose-200 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                重置為預設示範藥物
              </h4>
              <p className="text-[11px] text-rose-800 font-bold mt-0.5">
                回復包含慢箋、普拿疼、維他命等 5 款示範資料
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('確定要重置所有資料為初始示範資料嗎？現有資料將被覆蓋。')) {
                  onResetToSample();
                  setImportStatus({ success: true, message: '已成功重置為初始示範資料！' });
                  setTimeout(() => onClose(), 1200);
                }
              }}
              className="px-4 py-2.5 rounded-2xl bg-white border-2 border-rose-300 text-rose-700 font-black hover:bg-rose-50 active:scale-95 transition shadow-2xs shrink-0 cursor-pointer"
            >
              重置資料
            </button>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-5 py-3.5 border-t-2 border-sky-100 bg-sky-50/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer text-xs"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
