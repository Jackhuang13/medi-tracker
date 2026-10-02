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
  onAdjustStock: (id: string, changeUnits: number, reason: string) => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  selectedDate,
  onEdit,
  onDelete,
  onViewDetail,
  onToggleCheck,
  onBatchCheck,
  onAdjustStock,
}) => {
  const { t } = useTranslation();
  const [showQuickAdjust, setShowQuickAdjust] = useState(false);
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
                        setShowQuickAdjust(!showQuickAdjust);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-amber-50 hover:text-amber-800 text-left font-bold cursor-pointer transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      {t('quickAdjustStock', { unit: medication.packageSpec.unitName })}
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

          {/* 核心數據區塊：現存剩餘量 vs 應剩餘用量 (預算差異考慮 1 天用藥容許範圍) */}
          <div className="mt-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-sky-50/70 via-blue-50/50 to-teal-50/40 border-2 border-sky-100 space-y-2.5">
            {/* 1. 現存剩餘量 (實際扣除已打卡服用消耗量) */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div>
                <div className="text-[11px] font-black text-sky-900 flex items-center gap-1">
                  <span>現存剩餘量</span>
                  {forecast.totalConsumedUnits > 0 && (
                    <span className="text-[10px] text-teal-700 font-bold bg-teal-100/70 px-1.5 py-0.2 rounded-md">
                      已打卡服用 -{forecast.totalConsumedUnits}{medication.packageSpec.unitName}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base sm:text-lg font-black text-sky-950">
                    {forecast.formattedActualStock.displayString}
                  </span>
                  <span className="text-xs text-sky-700 font-bold">
                    ({forecast.formattedActualStock.totalUnitsString})
                  </span>
                </div>
              </div>

              {/* 2. 應剩餘用量 */}
              <div className="sm:text-right pt-1.5 sm:pt-0 border-t sm:border-t-0 border-sky-200/50">
                <div className="text-[11px] font-bold text-slate-600 flex items-center sm:justify-end gap-1">
                  <Scale className="w-3 h-3 text-sky-600" />
                  <span>應剩餘用量</span>
                </div>
                <div className="flex items-baseline sm:justify-end gap-1.5 mt-0.5">
                  <span className="text-sm font-black text-slate-700">
                    {forecast.formattedTheoreticalStock.displayString}
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold">
                    ({forecast.formattedTheoreticalStock.totalUnitsString})
                  </span>
                </div>
              </div>
            </div>

            {/* 差異比較條 */}
            <div className="pt-2 border-t border-sky-200/60 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-1.5 font-bold">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500">預算差異：</span>
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${getVarianceBadgeStyle()}`}
                  title="若差距在 1 天用藥量 (頻次*單劑量) 範圍內視為正常"
                >
                  {forecast.varianceText}
                </span>
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

          {/* 每日服藥打卡區塊 (防呆：若尚未到達開始用藥日，禁止打卡與填寫使用量) */}
          <div className="mt-3.5 pt-3 border-t border-sky-100/80">
            {forecast.isNotStartedYet ? (
              <div className="p-3 rounded-2xl bg-amber-50/90 border-2 border-amber-200 text-amber-950 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>尚未到達開始用藥日 (防呆保護中)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  此藥物預計於 <strong>{medication.startDate}</strong> 開始使用，今日（{dateKey}）尚未啟用，無法填入使用量與進行打卡。
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                    <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
                    <span>今日打卡 ({dateKey})・共 {effectiveSlots.length} 次</span>
                  </div>

                  <button
                    onClick={() => onBatchCheck(medication.id, dateKey, !isAllChecked)}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
                  >
                    {isAllChecked ? '取消打卡' : '一鍵完成打卡 ✨'}
                  </button>
                </div>

                {/* 打卡按鈕群組 */}
                <div className="flex flex-wrap gap-2">
                  {effectiveSlots.map((slot) => {
                    const isChecked = !!currentLogs[slot.key];

                    return (
                      <button
                        key={slot.key}
                        onClick={() => onToggleCheck(medication.id, dateKey, slot.key)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs ${
                          isChecked
                            ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-sky-200/60'
                            : 'bg-white hover:bg-sky-50 text-slate-700 border-2 border-sky-100'
                        }`}
                        title={`${slot.label} (每次 ${medication.dosagePerTime} ${medication.packageSpec.unitName})`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white animate-in zoom-in-75" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-300" />
                        )}
                        <span>
                          {slot.icon} {slot.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 快捷微調庫存面板 */}
          {showQuickAdjust && (
            <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 to-orange-50/70 border-2 border-amber-200 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-2">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  微調庫存數量 ({medication.packageSpec.unitName})
                </span>
                <button
                  onClick={() => setShowQuickAdjust(false)}
                  className="text-[11px] text-amber-700 hover:underline cursor-pointer font-bold"
                >
                  收合
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onAdjustStock(medication.id, -1, '手動服用扣減 1 單位')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-slate-700 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 cursor-pointer shadow-2xs"
                >
                  <Minus className="w-3 h-3 text-rose-500" /> 1 {medication.packageSpec.unitName}
                </button>
                <button
                  onClick={() => onAdjustStock(medication.id, 1, '手動增補 1 單位')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-slate-700 text-xs font-bold hover:bg-teal-50 hover:text-teal-700 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-teal-600" /> 1 {medication.packageSpec.unitName}
                </button>
                <button
                  onClick={() =>
                    onAdjustStock(
                      medication.id,
                      medication.packageSpec.unitsPerPackage,
                      `補貨 1 ${medication.packageSpec.packageUnitName}`
                    )
                  }
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3" /> +1 {medication.packageSpec.packageUnitName} ({medication.packageSpec.unitsPerPackage} {medication.packageSpec.unitName})
                </button>
              </div>
            </div>
          )}
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
