import React, { useRef, useState } from 'react';
import {
  X,
  Settings,
  Globe,
  Database,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  ShieldCheck,
  HardDrive,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Language } from '../i18n/types';
import { Medication } from '../types/medication';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  onOpenBackupModal: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonString: string) => { success: boolean; message: string; count?: number };
  onResetToSampleData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  medications,
  onOpenBackupModal,
  onExportJSON,
  onImportJSON,
  onResetToSampleData,
}) => {
  const { language, setLanguage, languages, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = onImportJSON(content);
      if (res.success) {
        setImportStatus({ type: 'success', message: res.message });
      } else {
        setImportStatus({ type: 'error', message: res.message });
      }
    };
    reader.onerror = () => {
      setImportStatus({ type: 'error', message: '讀取檔案失敗' });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border-2 border-sky-100 overflow-hidden">
        {/* 標頭 */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-sky-100 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-sky-300/40 animate-spin-slow">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
                <span>{t('settingsTitle')}</span>
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                {t('settingsSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition cursor-pointer"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容區塊 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-800">
          {/* 1. 語系切換區塊 */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-50/60 to-blue-50/40 border-2 border-sky-100 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {t('languageSectionTitle')}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t('languageSectionDesc')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {languages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 shadow-2xs ${
                      isSelected
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400 font-black shadow-md shadow-sky-200'
                        : 'bg-white hover:bg-sky-50/80 border-sky-100 text-slate-700 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <span className="text-xs">{lang.nativeLabel}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 資料備份與還原管理 */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border-2 border-indigo-100 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {t('backupSectionTitle')}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t('backupSectionDesc')}
                </p>
              </div>
            </div>

            {/* 開啟完整備份中心按鈕 */}
            <button
              onClick={() => {
                onClose();
                onOpenBackupModal();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-indigo-200 hover:border-indigo-400 text-indigo-950 font-black text-xs transition cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <span>{t('openBackupModal')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* 快速匯出 / 匯入按鈕 */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onExportJSON}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-200 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('quickExportJSON')}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white border-2 border-indigo-200 hover:bg-indigo-50 active:scale-95 text-indigo-900 text-xs font-black transition cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('quickImportJSON')}</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {importStatus.message}
              </div>
            )}
          </div>

          {/* 3. 資料重置危險區 */}
          <div className="p-4 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-800">
                  {t('dangerZoneTitle')}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {t('dangerZoneDesc')}
                </p>
              </div>

              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-slate-600 text-xs font-bold transition cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('resetToSample')}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-white"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetConfirm(false);
                      onResetToSampleData();
                      setImportStatus({ type: 'success', message: '已成功重置為範本資料！' });
                    }}
                    className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black shadow-xs hover:bg-rose-700"
                  >
                    確認重置
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4. 關於資訊 */}
          <div className="p-3.5 rounded-2xl bg-sky-50/40 border border-sky-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>MediTracker v1.0.0 (PWA)</span>
            </div>
            <span>目前已建檔 {medications.length} 款常備藥物</span>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-5 py-3.5 border-t-2 border-sky-100 bg-sky-50/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
