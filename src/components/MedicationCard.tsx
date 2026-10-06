import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Clock,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Sparkles,
  Info,
  ShieldAlert,
  CalendarDays,
  Building2,
  Star,
  Scale,
  X,
} from 'lucide-react';
import { Medication, UsageTimeSlot } from '../types/medication';
import {
  calculateMedicationForecast,
  formatDate,
  getEffectiveDoseSlots,
} from '../utils/medicationMath';
import { CATEGORY_LABELS, ROUTE_LABELS, USAGE_SLOT_LABELS } from '../utils/labels';
import { MedicationIcon } from './MedicationIcon';
import { useTranslation } from '../i18n/LanguageContext';

interface MedicationCardProps {
  medication: Medication;
  selectedDate: Date;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
  onViewDetail: (med: Medication) => void;
  onToggleCheck: (id: string, dateKey: string, slot: UsageTimeSlot | string) => void;
  onBatchCheck: (id: string, dateKey: string, forceCheck: boolean) => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  selectedDate,
  onEdit,
  onDelete,
  onViewDetail,
  onToggleCheck,
  onBatchCheck,
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const dateKey = formatDate(selectedDate);
  const forecast = calculateMedicationForecast(medication, selectedDate);
  const categoryInfo = CATEGORY_LABELS[medication.category] || CATEGORY_LABELS.other;

  // 動態依頻率產生之嚴格打卡時段格數 (如 BID 必為 2 格)
  const effectiveSlots = getEffectiveDoseSlots(medication);
  const currentLogs = medication.doseCheckLogs?.[dateKey] || {};

  const checkedCount = effectiveSlots.filter((slot) => !!currentLogs[slot.key]).length;
  const isAllChecked = effectiveSlots.length > 0 && checkedCount === effectiveSlots.length;

  // 新海誠童趣漸層邊框樣式
  const getCardBorderClass = () => {
    if (forecast.isNotStartedYet) {
      return 'border-2 border-slate-200 bg-white/95 shadow-sm opacity-90';
    }
    if (forecast.stockWarningLevel === 'exhausted') {
      return 'border-2 border-rose-300 bg-gradient-to-b from-white via-rose-50/30 to-rose-50/50 shadow-md shadow-rose-100/50';
    }
    if (forecast.stockWarningLevel === 'critical') {
      return 'border-2 border-rose-300 ring-4 ring-rose-100/60 bg-gradient-to-b from-white via-white to-rose-50/30 shadow-md shadow-rose-100/40';
    }
    if (forecast.isUpcomingWeekendAlert) {
      return 'border-2 border-amber-300 ring-4 ring-amber-100/60 bg-gradient-to-b from-white via-white to-amber-50/30 shadow-md shadow-amber-100/40';
    }
    if (forecast.stockWarningLevel === 'warning') {
      return 'border-2 border-amber-200 bg-gradient-to-b from-white via-white to-amber-50/20 shadow-sm';
    }
    return 'border-2 border-sky-100 hover:border-sky-300 bg-white/95 shadow-sm hover:shadow-md';
  };

  const getWarningBadge = () => {
    if (forecast.isNotStartedYet) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          尚未啟用（{medication.startDate} 開始）
        </span>
      );
    }
    if (forecast.stockWarningLevel === 'exhausted') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          庫存已用罄 (0{medication.packageSpec.unitName})
        </span>
      );
    }
    if (forecast.stockWarningLevel === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          庫存告急 剩 {forecast.daysRemaining} 天
        </span>
      );
    }
    if (forecast.isUpcomingWeekendAlert) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          即期週末用罄預警 ({forecast.dayOfWeekShort})
        </span>
      );
    }
    if (forecast.stockWarningLevel === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          提醒 剩 {forecast.daysRemaining} 天
        </span>
      );
    }
    return null;
  };

  const getVarianceBadgeStyle = () => {
    switch (forecast.varianceLevel) {
      case 'upcoming':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'normal':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'excess':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'deficit':
        return 'bg-rose-100 text-rose-800 border border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <>
      <div
        className={`group relative rounded-3xl transition-all duration-300 backdrop-blur-xs flex flex-col justify-between ${getCardBorderClass()}`}
      >
        {/* 頂部主內容 */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            {/* 左側圖示與標題 */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <MedicationIcon
                imageUrl={medication.imageUrl}
                category={medication.category}
                route={medication.route}
                iconPreset={medication.iconPreset}
                colorTheme={medication.colorTheme}
                name={medication.name}
                size="md"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold border ${categoryInfo.bg} ${categoryInfo.text} ${categoryInfo.border}`}
                  >
                    <span>{categoryInfo.icon}</span>
                    {categoryInfo.label}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                    {ROUTE_LABELS[medication.route] || '口服'}
                  </span>
                  {getWarningBadge()}
                </div>

                <h3
                  onClick={() => onViewDetail(medication)}
                  className="text-base sm:text-lg font-bold text-slate-900 truncate hover:text-sky-600 cursor-pointer flex items-center gap-1.5 transition-colors"
                  title={medication.name}
                >
                  {medication.name}
                </h3>

                {medication.brandOrGeneric && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {medication.brandOrGeneric}
                  </p>
                )}
              </div>
            </div>

            {/* 右側操作選單 */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                aria-label="操作選單"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-30 w-40 rounded-2xl bg-white/95 p-1.5 shadow-xl border border-sky-100 backdrop-blur-md text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onViewDetail(medication);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-sky-50 hover:text-sky-700 text-left font-bold cursor-pointer transition"
                    >
                      <Info className="w-3.5 h-3.5 text-sky-600" />
                      {t('viewDetail')}
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(medication);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 text-left font-bold cursor-pointer transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                      {t('editMedication')}
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-rose-50 text-rose-600 text-left font-bold cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('deleteMedication')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 核心數據區塊：應剩餘用量 + 1 天用藥量 (今天該用量變色處理) */}
          <div className="mt-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-sky-50/70 via-blue-50/50 to-teal-50/40 border-2 border-sky-100 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <div className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  <span>預估在庫藥量（含今日用量）</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-1.5 mt-1">
                  {forecast.theoreticalUnitsRemaining <= 0 ? (
                    <span className="text-base sm:text-lg font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-xl border border-rose-200">
                      已用罄 (0 {medication.packageSpec.unitName}) - 庫存已空
                    </span>
                  ) : (
                    <>
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        {forecast.holdingUnits > 0 || medication.frequency === 'PRN' ? forecast.formattedHoldingStock.displayString : ''}
                      </span>
                      {medication.frequency !== 'PRN' && forecast.todayDoseUnits > 0 && forecast.theoreticalUnitsRemaining >= forecast.todayDoseUnits && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs" title="今日用藥量 (頻次*單劑量)">
                          + {forecast.todayDoseUnits} {medication.packageSpec.unitName} (今日用量)
                        </span>
                      )}
                      {medication.frequency !== 'PRN' && forecast.theoreticalUnitsRemaining < forecast.todayDoseUnits && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs" title="庫存不足今日完整用量">
                          僅剩 {forecast.theoreticalUnitsRemaining} {medication.packageSpec.unitName} (不足今日完整用量)
                        </span>
                      )}
                    </>
                  )}
                  <span className="text-xs text-slate-600 font-bold ml-1">
                    ({forecast.formattedTheoreticalStock.totalUnitsString})
                  </span>
                </div>
              </div>
            </div>

            {/* 預估用罄日 (取消預算差異比較) */}
            <div className="pt-2 border-t border-sky-200/60 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-1.5 font-bold">
              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                <span>每日用藥量：{medication.frequency === 'PRN' ? '需要時使用' : `${forecast.dailyConsumptionRate} ${medication.packageSpec.unitName}/天`}</span>
              </div>

              {/* 預估用罄日 */}
              <div className="flex items-center gap-1 text-[11px]">
                <Calendar className="w-3 h-3 text-sky-600" />
                <span>用罄日：</span>
                {medication.frequency === 'PRN' ? (
                  <span className="font-black text-slate-800">需要時使用</span>
                ) : (
                  <span
                    className={`font-black ${
                      forecast.isUpcomingWeekendAlert ? 'text-amber-800' : 'text-slate-900'
                    }`}
                  >
                    {forecast.exhaustionDate} ({forecast.dayOfWeekShort})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 假日警示機制 (僅在即期 <=14 天且用罄落在週末時顯示) */}
          {forecast.isUpcomingWeekendAlert && (
            <div className="mt-2.5 flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border-2 border-amber-300 text-amber-900 text-xs leading-relaxed shadow-xs">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 animate-twinkle" />
              <div className="flex-1">
                <span className="font-extrabold text-amber-900">
                  ⚠️ 即期週末休診預警：預計於 {forecast.dayOfWeekName} 用罄！
                </span>
                <span className="block sm:inline sm:ml-1 text-amber-800">
                  診所或藥局週末休診，建議在週五前提前回診或補領藥物喔 ✨
                </span>
              </div>
            </div>
          )}

          {/* 用法叮嚀與服藥途徑說明 */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>
                用法：
                {medication.usageTimeSlots.map((s) => USAGE_SLOT_LABELS[s]?.name || s).join('、')}
              </span>
              <span className="text-slate-300">|</span>
              <span>
                每次 {medication.dosagePerTime} {medication.packageSpec.unitName}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-bold">
              開始日：{medication.startDate}
            </div>
          </div>
        </div>

        {/* 底部行動條 */}
        <div
          onClick={() => onViewDetail(medication)}
          className="px-4 py-2.5 bg-gradient-to-r from-sky-50/80 to-blue-50/50 rounded-b-3xl border-t border-sky-100 flex items-center justify-between text-xs text-slate-500 hover:text-sky-700 transition cursor-pointer"
        >
          <span className="flex items-center gap-1">
            {medication.hospitalOrPharmacy ? (
              <span className="flex items-center gap-1 truncate max-w-[200px] text-slate-600 font-bold">
                <Building2 className="w-3.5 h-3.5 text-sky-500" />
                {medication.hospitalOrPharmacy}
              </span>
            ) : (
              <span className="font-bold">點擊查看完整用藥指引與消耗預測</span>
            )}
          </span>
          <span className="flex items-center font-black text-sky-600 gap-0.5">
            詳細
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* 刪除確認彈窗 (防止誤刪) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-rose-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                {t('deleteConfirmTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t('deleteConfirmDesc', { name: medication.name })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-2.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(medication.id);
                }}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-xs shadow-md shadow-rose-200 hover:from-rose-600 hover:to-red-700 active:scale-95 transition cursor-pointer"
              >
                {t('confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
