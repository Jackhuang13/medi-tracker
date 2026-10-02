import React, { useState, useMemo } from 'react';
import {
  Pill,
  Plus,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Upload,
  Sparkles,
  Heart,
  ShieldCheck,
  Sun,
  Flame,
  CalendarDays,
  Cloud,
  Star,
  Settings,
} from 'lucide-react';
import { Medication, MedicationCategory } from './types/medication';
import { useMedications } from './hooks/useMedications';
import {
  calculateMedicationForecast,
  diffDays,
  formatDate,
} from './utils/medicationMath';
import { CATEGORY_LABELS } from './utils/labels';
import { MedicationCard } from './components/MedicationCard';
import { MedicationFormModal } from './components/MedicationFormModal';
import { MedicationDetailModal } from './components/MedicationDetailModal';
import { RefillScheduleModal } from './components/RefillScheduleModal';
import { BackupModal } from './components/BackupModal';
import { SettingsModal } from './components/SettingsModal';
import { DashboardStats } from './components/DashboardStats';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ReloadPrompt } from './components/ReloadPrompt';
import { useTranslation } from './i18n/LanguageContext';

export default function App() {
  const { t } = useTranslation();
  const {
    medications,
    addMedication,
    updateMedication,
    deleteMedication,
    resetToSampleData,
    toggleDoseCheck,
    batchCheckDate,
    adjustStock,
    exportDataAsJSON,
    importDataFromJSON,
  } = useMedications();

  // 當前檢視日期 (預設為今日)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 篩選與搜尋
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  // Modal 狀態
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [detailedMedication, setDetailedMedication] = useState<Medication | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRefillScheduleOpen, setIsRefillScheduleOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 日期導覽
  const handlePrevDay = () => {
    const prev = new Date(selectedDate.getTime());
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate.getTime());
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = diffDays(new Date(), selectedDate) === 0;

  // 篩選後藥物清單
  const filteredMedications = useMemo(() => {
    const dateKey = formatDate(selectedDate);

    return medications.filter((med) => {
      // 搜尋字詞
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = med.name.toLowerCase().includes(query);
        const matchBrand = med.brandOrGeneric?.toLowerCase().includes(query) ?? false;
        const matchNote = med.customUsageNote?.toLowerCase().includes(query) ?? false;
        const matchDoc = med.doctorInstructions?.toLowerCase().includes(query) ?? false;
        const matchHosp = med.hospitalOrPharmacy?.toLowerCase().includes(query) ?? false;
        if (!matchName && !matchBrand && !matchNote && !matchDoc && !matchHosp) {
          return false;
        }
      }

      // 類別
      if (selectedCategory !== 'all' && med.category !== selectedCategory) {
        return false;
      }

      // 狀態篩選 (防呆：預設「使用中」僅顯示已到達開始用藥日之藥品)
      const forecast = calculateMedicationForecast(med, selectedDate);
      const isStarted = !med.startDate || med.startDate <= dateKey;

      if (statusFilter === 'active') {
        if (!isStarted || forecast.stockWarningLevel === 'exhausted') {
          return false;
        }
      } else if (statusFilter === 'upcoming') {
        if (isStarted) {
          return false;
        }
      } else if (statusFilter === 'low_stock') {
        if (forecast.stockWarningLevel !== 'critical') {
          return false;
        }
      } else if (statusFilter === 'weekend_warning') {
        if (!forecast.isUpcomingWeekendAlert) {
          return false;
        }
      } else if (statusFilter === 'exhausted') {
        if (forecast.stockWarningLevel !== 'exhausted') {
          return false;
        }
      }

      return true;
    });
  }, [medications, searchQuery, selectedCategory, statusFilter, selectedDate]);

  // 即期週末用罄總數量
  const weekendWarningCount = useMemo(() => {
    return medications.filter((m) => {
      if (m.status === 'archived' || m.frequency === 'PRN') return false;
      const forecast = calculateMedicationForecast(m, selectedDate);
      return forecast.isUpcomingWeekendAlert;
    }).length;
  }, [medications, selectedDate]);

  // 開啟編輯
  const handleOpenEdit = (med: Medication) => {
    setEditingMedication(med);
    setIsFormOpen(true);
  };

  // 開啟詳情
  const handleOpenDetail = (med: Medication) => {
    setDetailedMedication(med);
    setIsDetailOpen(true);
  };

  // 儲存藥物
  const handleSaveMedication = (
    medData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingMedication) {
      updateMedication(editingMedication.id, medData);
    } else {
      addMedication(medData);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* 離線提示與 PWA 更新提示 */}
      <OfflineIndicator />
      <ReloadPrompt />

      {/* 頂部導覽列 Header (新海誠天空玻璃質感 - RWD 防破版排版) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b-2 border-sky-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo 與名稱 */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-pink-400 text-white flex items-center justify-center shadow-md shadow-sky-300/40 animate-float shrink-0">
              <Pill className="w-5 h-5 sm:w-6 sm:h-6 rotate-45" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight bg-gradient-to-r from-sky-700 via-blue-600 to-pink-600 bg-clip-text text-transparent truncate">
                  {t('appName')}
                </h1>
                <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100/80 text-sky-800 border border-sky-200 shrink-0">
                  <Sparkles className="w-3 h-3 text-amber-500 animate-twinkle" />
                  {t('appSubtitle')}
                </span>
              </div>
              <p className="text-xs text-sky-800/70 hidden sm:block truncate">
                {t('appHeroDesc')}
              </p>
            </div>
          </div>

          {/* 右側操作按鈕群組 (更換資料備份為「設置」分頁) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 週末用罄預警按鈕 */}
            <button
              onClick={() => setIsRefillScheduleOpen(true)}
              className={`relative flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-2xl border-2 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 shrink-0 ${
                weekendWarningCount > 0
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                  : 'bg-white border-sky-100 text-slate-700 hover:bg-sky-50'
              }`}
              title={
                weekendWarningCount > 0
                  ? `發現 ${weekendWarningCount} 項即期週末休診預警，點擊查看排程`
                  : '查看藥品預計用罄排程與週末休診預警'
              }
              aria-label={t('weekendAlert')}
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 ${weekendWarningCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="hidden md:inline whitespace-nowrap">{t('weekendAlert')}</span>
              {weekendWarningCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black leading-tight animate-pulse">
                  {weekendWarningCount}
                </span>
              )}
            </button>

            {/* 設置按鈕 (更換資料備份還原為「設置」分頁) */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-2xl bg-white border-2 border-sky-100 hover:bg-sky-50 text-sky-900 text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title={t('settings')}
              aria-label={t('settings')}
            >
              <Settings className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="hidden lg:inline whitespace-nowrap">{t('settings')}</span>
            </button>

            {/* PWA 安裝按鈕 */}
            <PWAInstallButton />

            {/* 新增藥物按鈕 */}
            <button
              onClick={() => {
                setEditingMedication(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-400/30 transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{t('addMedication')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主內容區 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* 新海誠風溫馨歡迎橫幅 */}
        <div className="relative p-4 sm:p-5 rounded-3xl overflow-hidden bg-gradient-to-r from-sky-400 via-blue-400 to-pink-400 text-white shadow-lg shadow-sky-200/50">
          {/* 背景雲朵星光裝飾 */}
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-20 pointer-events-none">
            <Cloud className="w-40 h-40" />
          </div>
          <div className="absolute left-1/3 bottom-0 opacity-15 pointer-events-none">
            <Star className="w-20 h-20 animate-twinkle" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-1.5">
                <Sun className="w-3.5 h-3.5 text-yellow-200" />
                {t('appHeroBadge')}
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight drop-shadow-xs">
                {t('appHeroTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl leading-relaxed">
                {t('appHeroDesc')}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/25 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/30 text-xs font-bold shrink-0">
              <Sparkles className="w-4 h-4 text-yellow-200 animate-spin-slow" />
              <span>{t('appGuardian')}</span>
            </div>
          </div>
        </div>

        {/* 日期導覽列 */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white/90 backdrop-blur-md border-2 border-sky-100 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 text-sky-700 flex items-center justify-center shadow-2xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-sky-800 font-bold">{t('dateProgressTitle')}</div>
              <div className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <span>{formatDate(selectedDate)}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                  {['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][selectedDate.getDay()]}
                </span>
                {isToday && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-2xs animate-pulse">
                    {t('todayBadge')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-xl border-2 border-sky-100 hover:bg-sky-50 text-sky-700 transition cursor-pointer active:scale-95"
              title="前一天"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs ${
                isToday
                  ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-sky-200'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              {t('backToToday')}
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 rounded-xl border-2 border-sky-100 hover:bg-sky-50 text-sky-700 transition cursor-pointer active:scale-95"
              title="後一天"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 總覽統計看板 (Dashboard Stats) */}
        <DashboardStats
          medications={medications}
          selectedDate={selectedDate}
          onOpenWeekendSchedule={() => setIsRefillScheduleOpen(true)}
          onFilterChange={(f) => setStatusFilter(f)}
        />

        {/* 搜尋列與分類篩選器 */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* 搜尋框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-sky-100 bg-white/95 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-300 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  {t('clearSearch')}
                </button>
              )}
            </div>

            {/* 狀態快捷篩選 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shadow-2xs ${
                  statusFilter === 'active'
                    ? 'bg-sky-600 text-white shadow-sky-200'
                    : 'bg-white border-2 border-sky-100 text-sky-900 hover:bg-sky-50'
                }`}
              >
                {t('filterActive')} ({medications.filter((m) => m.status !== 'archived' && (!m.startDate || m.startDate <= formatDate(selectedDate))).length})
              </button>
              <button
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shadow-2xs ${
                  statusFilter === 'upcoming'
                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                    : 'bg-white border-2 border-indigo-100 text-indigo-900 hover:bg-indigo-50'
                }`}
              >
                {t('filterUpcoming')} ({medications.filter((m) => m.status !== 'archived' && m.startDate && m.startDate > formatDate(selectedDate)).length})
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shadow-2xs ${
                  statusFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-slate-200'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t('filterAll')} ({medications.length})
              </button>
              <button
                onClick={() => setStatusFilter('low_stock')}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shadow-2xs ${
                  statusFilter === 'low_stock'
                    ? 'bg-rose-500 text-white shadow-rose-200'
                    : 'bg-white border-2 border-rose-200 text-rose-700 hover:bg-rose-50'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                {t('filterLowStock')}
              </button>
              <button
                onClick={() => setStatusFilter('weekend_warning')}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shadow-2xs ${
                  statusFilter === 'weekend_warning'
                    ? 'bg-amber-500 text-white shadow-amber-200'
                    : 'bg-white border-2 border-amber-200 text-amber-800 hover:bg-amber-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('filterWeekendWarning')}
              </button>
              <button
                onClick={() => setStatusFilter('exhausted')}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shadow-2xs ${
                  statusFilter === 'exhausted'
                    ? 'bg-slate-700 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('filterExhausted')}
              </button>
            </div>
          </div>

          {/* 藥品類別標籤列 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shadow-2xs ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-sky-200'
                  : 'bg-white border-2 border-sky-100 text-sky-900 hover:bg-sky-50'
              }`}
            >
              {t('filterAllCategories')}
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shadow-2xs ${
                  selectedCategory === key
                    ? 'bg-sky-600 text-white shadow-sky-200 border-2 border-sky-700'
                    : 'bg-white border-2 border-sky-100 text-slate-700 hover:bg-sky-50'
                }`}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 藥品清單展示卡片區 */}
        {filteredMedications.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-white/90 backdrop-blur-md border-2 border-sky-100 shadow-sm space-y-3">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-sky-50 text-sky-400 flex items-center justify-center animate-float">
              <Pill className="w-8 h-8 rotate-45" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                ? '沒有找到符合條件的常備藥物'
                : '目前尚未建立任何常備藥物紀錄'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                ? '試試調整搜尋關鍵字、類別或狀態標籤'
                : '點擊上方「新增藥物」，記錄您的慢性病處方、保健品或備用成藥吧！'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              {(searchQuery || selectedCategory !== 'all' || statusFilter !== 'active') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setStatusFilter('active');
                  }}
                  className="px-4 py-2 rounded-2xl border-2 border-sky-100 text-sky-800 text-xs font-bold hover:bg-sky-50 transition cursor-pointer"
                >
                  重置篩選條件
                </button>
              )}
              <button
                onClick={() => {
                  setEditingMedication(null);
                  setIsFormOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-xs font-bold transition shadow-md shadow-sky-300/30 cursor-pointer active:scale-95"
              >
                + {t('addMedication')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredMedications.map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                selectedDate={selectedDate}
                onEdit={handleOpenEdit}
                onDelete={deleteMedication}
                onViewDetail={handleOpenDetail}
                onToggleCheck={toggleDoseCheck}
                onBatchCheck={batchCheckDate}
                onAdjustStock={adjustStock}
              />
            ))}
          </div>
        )}
      </main>

      {/* 各功能彈窗 Modals */}
      <MedicationFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveMedication}
        initialData={editingMedication}
      />

      <MedicationDetailModal
        medication={detailedMedication}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleOpenEdit}
        onDelete={deleteMedication}
        onAdjustStock={adjustStock}
      />

      <RefillScheduleModal
        isOpen={isRefillScheduleOpen}
        onClose={() => setIsRefillScheduleOpen(false)}
        medications={medications}
        onSelectMedication={handleOpenDetail}
        onAdjustStock={adjustStock}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        medications={medications}
        onOpenBackupModal={() => setIsBackupOpen(true)}
        onExportJSON={exportDataAsJSON}
        onImportJSON={importDataFromJSON}
        onResetToSampleData={resetToSampleData}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onExport={exportDataAsJSON}
        onImport={importDataFromJSON}
        onResetToSample={resetToSampleData}
      />
    </div>
  );
}
