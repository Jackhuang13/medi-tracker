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

  const criticalTotalCount = criticalMeds.length + exhaustedMeds.length;
  const totalWarningCount = weekendMeds.length + criticalTotalCount;

  return (
    <div className="w-full">
      {/* 整合型即期用藥預警中心入口卡片 */}
      <div
        onClick={onOpenWeekendSchedule}
        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] active:scale-98 shadow-sm ${
          totalWarningCount > 0
            ? 'bg-gradient-to-br from-white via-amber-50/95 to-rose-50/70 border-amber-300 shadow-md shadow-amber-100/50 ring-2 ring-amber-200/40'
            : 'bg-gradient-to-br from-white via-sky-50/60 to-emerald-50/40 border-emerald-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-black flex items-center gap-1.5 ${totalWarningCount > 0 ? 'text-amber-950' : 'text-emerald-900'}`}>
            {totalWarningCount > 0 ? (
              <>
                <Star className="w-4 h-4 text-amber-500 fill-amber-400 animate-twinkle" />
                即期用藥安全監控中心（需留意預警）
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                即期用藥安全監控中心（各項存量安全）
              </>
            )}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs ${
            totalWarningCount > 0
              ? 'bg-amber-500 text-white animate-pulse'
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {totalWarningCount > 0 ? `🚨 發現 ${totalWarningCount} 項預警` : '✨ 存量充足・安心無虞'}
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalWarningCount} <span className="text-base font-bold text-slate-600">項預警項目</span>
            </div>
            <p className="text-xs text-slate-600 font-bold mt-1">
              {totalWarningCount > 0
                ? `包含 ${weekendMeds.length} 項週末休診預警、${criticalTotalCount} 款庫存告急/已用罄`
                : '近期 14 天內無週末斷藥風險，各項常備藥品庫存皆高於 3 天安全存量。'}
            </p>
          </div>

          <div className="text-xs font-extrabold text-sky-700 underline underline-offset-2 flex items-center gap-1 shrink-0 self-start sm:self-auto">
            <span>點擊開啟預警中心與補藥排程</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
