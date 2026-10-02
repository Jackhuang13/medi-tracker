import React from 'react';
import {
  X,
  AlertTriangle,
  Star,
  CheckCircle2,
  Flame,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Medication } from '../types/medication';
import { calculateMedicationForecast } from '../utils/medicationMath';
import { MedicationIcon } from './MedicationIcon';
import { CATEGORY_LABELS } from '../utils/labels';

interface RefillScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  onSelectMedication: (med: Medication) => void;
  onAdjustStock: (id: string, changeUnits: number, reason: string) => void;
}

export const RefillScheduleModal: React.FC<RefillScheduleModalProps> = ({
  isOpen,
  onClose,
  medications,
  onSelectMedication,
  onAdjustStock,
}) => {
  if (!isOpen) return null;

  // 僅篩選出具有「即期預警」之項目 (即期週末用罄預警、即期庫存告急 <=3 天、或已用罄)
  const warningList = medications
    .filter((m) => m.status !== 'archived')
    .map((med) => {
      const forecast = calculateMedicationForecast(med);
      return { med, forecast };
    })
    .filter(
      (item) =>
        item.forecast.isUpcomingWeekendAlert ||
        item.forecast.isUpcomingCriticalAlert ||
        item.forecast.stockWarningLevel === 'critical' ||
        item.forecast.stockWarningLevel === 'exhausted'
    )
    .sort((a, b) => a.forecast.daysRemaining - b.forecast.daysRemaining);

  const weekendAlertCount = warningList.filter((item) => item.forecast.isUpcomingWeekendAlert).length;
  const criticalCount = warningList.filter((item) => item.forecast.isUpcomingCriticalAlert).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border-2 border-amber-200 overflow-hidden">
        {/* 標頭 */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-amber-200 bg-gradient-to-r from-amber-100/80 via-orange-50 to-yellow-100/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 text-white flex items-center justify-center shadow-sm animate-twinkle">
              <Star className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-950">
                即期用藥預警中心
              </h2>
              <p className="text-xs text-amber-800 font-bold">
                {warningList.length > 0
                  ? `共發現 ${warningList.length} 筆即期預警項目（${weekendAlertCount} 項週末休診預警、${criticalCount} 項庫存告急）`
                  : '目前各項常備藥品庫存皆充足安全 ✨'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-amber-700 hover:bg-white/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容列表：僅呈現即期預警項目 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3 text-slate-800">
          {warningList.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-emerald-50/60 border-2 border-emerald-200 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-emerald-950">太棒了！目前無任何即期預警項目</h3>
              <p className="text-xs text-emerald-800 font-bold">
                所有日常用藥庫存充足，近期（14天內）無週末斷藥或庫存不足之風險。
              </p>
            </div>
          ) : (
            warningList.map(({ med, forecast }) => {
              const categoryInfo = CATEGORY_LABELS[med.category] || CATEGORY_LABELS.other;

              return (
                <div
                  key={med.id}
                  className={`p-4 rounded-3xl border-2 transition shadow-2xs ${
                    forecast.isUpcomingWeekendAlert
                      ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/60 border-amber-300 ring-2 ring-amber-200/50'
                      : forecast.stockWarningLevel === 'critical' || forecast.stockWarningLevel === 'exhausted'
                      ? 'bg-gradient-to-br from-rose-50/90 to-pink-50/50 border-rose-300 ring-2 ring-rose-200/50'
                      : 'bg-white border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <MedicationIcon
                        imageUrl={med.imageUrl}
                        category={med.category}
                        route={med.route}
                        iconPreset={med.iconPreset}
                        name={med.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-xl text-[10px] font-bold border ${categoryInfo.bg} ${categoryInfo.text} ${categoryInfo.border}`}
                          >
                            {categoryInfo.icon} {categoryInfo.label}
                          </span>

                          {forecast.isUpcomingWeekendAlert && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 shadow-2xs animate-pulse">
                              <Star className="w-3 h-3 text-amber-700 fill-amber-600" />
                              即期週末休診預警 ({forecast.dayOfWeekShort})
                            </span>
                          )}

                          {forecast.stockWarningLevel === 'critical' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                              <Flame className="w-3 h-3 text-rose-600" />
                              庫存告急 (剩 {forecast.daysRemaining} 天)
                            </span>
                          )}

                          {forecast.stockWarningLevel === 'exhausted' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900">
                              <ShieldAlert className="w-3 h-3 text-rose-700" />
                              已用罄
                            </span>
                          )}
                        </div>

                        <h4
                          onClick={() => {
                            onClose();
                            onSelectMedication(med);
                          }}
                          className="text-sm font-black text-slate-900 truncate hover:text-sky-600 cursor-pointer"
                        >
                          {med.name}
                        </h4>

                        <div className="text-xs text-slate-600 font-bold mt-1 flex flex-wrap items-center gap-2">
                          <span>目前剩餘：<strong className="text-slate-900">{forecast.formattedStock.displayString}</strong></span>
                          <span>|</span>
                          <span>每日總量: {forecast.dailyConsumptionRate} {med.packageSpec.unitName}</span>
                        </div>
                      </div>
                    </div>

                    {/* 右側用罄日期 */}
                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm sm:text-base font-black ${
                          forecast.isUpcomingWeekendAlert
                            ? 'text-amber-900'
                            : forecast.stockWarningLevel === 'critical'
                            ? 'text-rose-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {forecast.exhaustionDate}
                      </div>
                      <div className="text-xs font-black text-slate-600">
                        {forecast.dayOfWeekName} ({forecast.daysRemaining} 天後)
                      </div>
                    </div>
                  </div>

                  {/* 預警說明與快速補貨按鈕 */}
                  <div className="mt-2.5 p-3 rounded-2xl bg-white/90 border border-amber-200 text-xs text-slate-800 leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-medium shadow-2xs">
                    <div className="flex-1">
                      {forecast.isUpcomingWeekendAlert ? (
                        <span>
                          ⚠️ <strong>週末休診提示：</strong>將於 {forecast.dayOfWeekName} 用罄。診所與特約藥局週末休息，請於<strong>週五前</strong>提前備藥！
                        </span>
                      ) : (
                        <span>
                          🚨 <strong>庫存告急提示：</strong>剩餘存量僅供使用 {forecast.daysRemaining} 天，建議儘速完成領藥或補貨。
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        onAdjustStock(
                          med.id,
                          med.packageSpec.unitsPerPackage,
                          `預警中心快速補貨 1 ${med.packageSpec.packageUnitName}`
                        );
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black hover:from-amber-600 hover:to-orange-600 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-all"
                    >
                      +1 {med.packageSpec.packageUnitName} (+{med.packageSpec.unitsPerPackage} {med.packageSpec.unitName})
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部 */}
        <div className="px-5 py-3.5 border-t-2 border-amber-200 bg-amber-50/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
