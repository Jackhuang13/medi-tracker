import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  Pill,
  Sparkles,
  ChevronRight,
  Sun,
  Star,
  CloudSun,
} from 'lucide-react';
import { Medication } from '../types/medication';
import { calculateMedicationForecast, formatDate, getEffectiveDoseSlots } from '../utils/medicationMath';
import { useTranslation } from '../i18n/LanguageContext';

interface DashboardStatsProps {
  medications: Medication[];
  selectedDate: Date;
  onOpenWeekendSchedule?: () => void;
  onFilterChange?: (filter: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  medications,
  selectedDate,
  onOpenWeekendSchedule,
  onFilterChange,
}) => {
  const { t } = useTranslation();
  const dateKey = formatDate(selectedDate);

  let totalActiveMedsCount = 0;
  let completedMedsCount = 0;

  const weekendMeds: Medication[] = [];
  const criticalMeds: Medication[] = [];
  const exhaustedMeds: Medication[] = [];

  medications.forEach((med) => {
    if (med.status !== 'archived') {
      const isStarted = !med.startDate || med.startDate <= dateKey;
      const forecast = calculateMedicationForecast(med, selectedDate);

      if (isStarted) {
        totalActiveMedsCount += 1;
        const effectiveSlots = getEffectiveDoseSlots(med);
        const logs = med.doseCheckLogs?.[dateKey] || {};

        const checkedSlotsCount = effectiveSlots.filter((slot) => !!logs[slot.key]).length;
        if (effectiveSlots.length > 0 && checkedSlotsCount === effectiveSlots.length) {
          completedMedsCount += 1;
        }

        if (forecast.stockWarningLevel === 'exhausted') {
          exhaustedMeds.push(med);
        } else if (forecast.stockWarningLevel === 'critical') {
          criticalMeds.push(med);
        }

        if (forecast.isUpcomingWeekendAlert) {
          weekendMeds.push(med);
        }
      }
    }
  });

  const completionRate =
    totalActiveMedsCount > 0
      ? Math.round((completedMedsCount / totalActiveMedsCount) * 100)
      : 100;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. 今日服藥元氣 (分子: 今日已服用藥物, 分母: 全部使用中藥物) */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-white via-sky-50/70 to-blue-50/50 border-2 border-sky-100/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-sky-200/30 blur-lg pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-sky-800 flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            {t('statAdherence')}
          </span>
          <div className="w-8 h-8 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-sky-950">
              {completionRate}%
            </span>
            <span className="text-xs font-bold text-sky-600">
              {completedMedsCount}/{totalActiveMedsCount} {t('statMedsUnit')}
            </span>
          </div>
          {/* 糖果色彩進度條 */}
          <div className="w-full h-2.5 rounded-full bg-sky-100/80 mt-2 overflow-hidden p-0.5 border border-sky-200/50">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-teal-400 rounded-full transition-all duration-700 shadow-xs"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. 即期週末用罄預警 (夕陽金燦 - 僅即期14天內) */}
      <div
        onClick={onOpenWeekendSchedule}
        className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] active:scale-98 ${
          weekendMeds.length > 0
            ? 'bg-gradient-to-br from-white via-amber-50/90 to-orange-50/60 border-amber-300 shadow-md shadow-amber-100/50'
            : 'bg-gradient-to-br from-white via-slate-50 to-blue-50/30 border-slate-100 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-twinkle" />
            {t('statWeekendAlert')}
          </span>
          <div
            className={`w-8 h-8 rounded-2xl flex items-center justify-center shadow-xs ${
              weekendMeds.length > 0
                ? 'bg-gradient-to-tr from-amber-400 to-orange-400 text-white animate-bounce'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                weekendMeds.length > 0 ? 'text-amber-900' : 'text-slate-800'
              }`}
            >
              {weekendMeds.length} {t('statItemsUnit')}
            </span>
            <span className="text-[11px] font-bold text-amber-700 flex items-center gap-0.5 bg-amber-100/80 px-2 py-0.5 rounded-full">
              {weekendMeds.length > 0 ? t('statNeedAttention') : t('statSafe')}
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-amber-800/80 truncate mt-1">
            {weekendMeds.length > 0
              ? `${weekendMeds[0].name.slice(0, 10)}...`
              : t('statNoWeekendRisk')}
          </p>
        </div>
      </div>

      {/* 3. 庫存偏低警示 (櫻花粉霞 - <=3天) */}
      <div
        onClick={() => onFilterChange?.('low_stock')}
        className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] active:scale-98 ${
          criticalMeds.length > 0
            ? 'bg-gradient-to-br from-white via-rose-50/90 to-pink-50/60 border-rose-300 shadow-md shadow-rose-100/50'
            : 'bg-gradient-to-br from-white via-slate-50 to-blue-50/30 border-slate-100 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            {t('statLowStock')}
          </span>
          <div
            className={`w-8 h-8 rounded-2xl flex items-center justify-center shadow-xs ${
              criticalMeds.length > 0
                ? 'bg-gradient-to-tr from-rose-400 to-pink-500 text-white'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                criticalMeds.length > 0 ? 'text-rose-900' : 'text-slate-800'
              }`}
            >
              {criticalMeds.length} {t('statMedsUnit')}
            </span>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
              {criticalMeds.length > 0 ? t('statAboutToExhaust') : t('statStockPlenty')}
            </span>
          </div>
          <p className="text-[11px] text-rose-800/80 truncate mt-1">
            {criticalMeds.length > 0 ? t('statLowStock') : t('statStockSafeDesc')}
          </p>
        </div>
      </div>

      {/* 4. 全部使用中藥品數 (暮光紫羅蘭) */}
      <div
        onClick={() => onFilterChange?.('active')}
        className="p-4 rounded-3xl bg-gradient-to-br from-white via-indigo-50/70 to-purple-50/50 border-2 border-indigo-100/90 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] active:scale-98"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
            <CloudSun className="w-3.5 h-3.5 text-indigo-500" />
            {t('statActiveMeds')}
          </span>
          <div className="w-8 h-8 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
            <Pill className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-indigo-950">
              {totalActiveMedsCount} {t('statMedsUnit')}
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
              {t('statTakeCare')}
            </span>
          </div>
          <p className="text-[11px] text-indigo-700/80 truncate mt-1">
            {medications.length > totalActiveMedsCount
              ? `有 ${medications.length - totalActiveMedsCount} 款尚未到達開始日`
              : t('appHeroBadge')}
          </p>
        </div>
      </div>
    </div>
  );
};
