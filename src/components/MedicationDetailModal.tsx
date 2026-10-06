import React, { useState } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Clock,
  Package,
  Edit2,
  Trash2,
  Building2,
  Sparkles,
  Star,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { Medication } from '../types/medication';
import {
  calculateMedicationForecast,
  generateConsumptionTimeline,
} from '../utils/medicationMath';
import {
  CATEGORY_LABELS,
  ROUTE_LABELS,
  USAGE_SLOT_LABELS,
  FREQUENCY_LABELS,
} from '../utils/labels';
import { MedicationIcon } from './MedicationIcon';

interface MedicationDetailModalProps {
  medication: Medication | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
  selectedDate?: Date;
}

export const MedicationDetailModal: React.FC<MedicationDetailModalProps> = ({
  medication,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  selectedDate = new Date(),
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');

  if (!isOpen || !medication) return null;

  const forecast = calculateMedicationForecast(medication, selectedDate);
  const timeline = generateConsumptionTimeline(medication, 14, selectedDate);
  const categoryInfo = CATEGORY_LABELS[medication.category] || CATEGORY_LABELS.other;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border-2 border-sky-100 overflow-hidden">
        {/* 頂部標頭 */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-sky-100 bg-gradient-to-r from-sky-50 via-blue-50 to-pink-50 shrink-0">
          <div className="flex items-center gap-3">
            <MedicationIcon
              imageUrl={medication.imageUrl}
              category={medication.category}
              route={medication.route}
              iconPreset={medication.iconPreset}
              colorTheme={medication.colorTheme}
              name={medication.name}
              size="md"
            />
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold border ${categoryInfo.bg} ${categoryInfo.text} ${categoryInfo.border}`}
                >
                  <span>{categoryInfo.icon}</span>
                  {categoryInfo.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
                  {ROUTE_LABELS[medication.route] || '口服'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {medication.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 標籤頁切換 */}
        <div className="flex border-b border-sky-100 px-5 bg-sky-50/40 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-black border-b-2 transition cursor-pointer ${
              activeTab === 'overview'
                ? 'border-sky-500 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            總覽與用藥計畫
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 text-xs font-black border-b-2 transition cursor-pointer ${
              activeTab === 'timeline'
                ? 'border-sky-500 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            14天消耗預測曲線
          </button>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-800">
          {activeTab === 'overview' && (
            <>
              {/* 核心預估數據看板 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. 預估在庫藥量 (含今日) */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-50 via-blue-50 to-teal-50 border-2 border-sky-100 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-sky-900 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-sky-600" />
                      預估在庫藥量 (含今日)
                    </div>
                    <div className="mt-2 text-lg sm:text-xl font-black text-sky-950">
                      {forecast.formattedTheoreticalStock.displayString}
                    </div>
                  </div>
                  <div className="text-[11px] text-sky-700 font-bold mt-1 pt-1 border-t border-sky-200/60">
                    總計: {forecast.theoreticalUnitsRemaining} {medication.packageSpec.unitName} (1 {medication.packageSpec.packageUnitName} = {medication.packageSpec.unitsPerPackage} {medication.packageSpec.unitName})
                  </div>
                </div>

                {/* 2. 手頭持有量 + 今日用量 */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-100 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      手頭持有與今日用量
                    </div>
                    <div className="mt-2 text-base sm:text-lg font-black text-indigo-950 flex flex-wrap items-baseline gap-1">
                      {forecast.theoreticalUnitsRemaining <= 0 ? (
                        <span className="text-rose-600 font-black text-xs">已用罄 (0 錠)</span>
                      ) : (
                        <>
                          <span>{forecast.holdingUnits > 0 || medication.frequency === 'PRN' ? forecast.formattedHoldingStock.displayString : ''}</span>
                          {medication.frequency !== 'PRN' && forecast.todayDoseUnits > 0 && forecast.theoreticalUnitsRemaining >= forecast.todayDoseUnits && (
                            <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                              +{forecast.todayDoseUnits} {medication.packageSpec.unitName} (今日)
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-indigo-700 font-bold mt-1 pt-1 border-t border-indigo-200/60">
                    扣除今日用量後的實體持有量
                  </div>
                </div>

                {/* 3. 預測用罄日 */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      預測餘藥用罄日
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span
                        className={`text-lg sm:text-xl font-black ${
                          forecast.isUpcomingWeekendAlert ? 'text-amber-900' : 'text-slate-900'
                        }`}
                      >
                        {forecast.exhaustionDate}
                      </span>
                      {forecast.dailyConsumptionRate > 0 && (
                        <span className="text-xs font-black text-amber-800">
                          （{forecast.dayOfWeekShort}）
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-amber-800 font-bold mt-1 pt-1 border-t border-amber-200/60">
                    每日總量: {forecast.dailyConsumptionRate} {medication.packageSpec.unitName} (剩 {forecast.daysRemaining} 天)
                  </div>
                </div>
              </div>

              {/* ⚠️ 即期週末休診預警 */}
              {forecast.isUpcomingWeekendAlert && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-900 space-y-1 shadow-sm">
                  <div className="flex items-center gap-2 font-black text-sm text-amber-950">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400 animate-twinkle" />
                    <span>即期週末休診預警（預估 {forecast.daysRemaining} 天後【{forecast.dayOfWeekName}】餘藥用罄）</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    此藥物為即期用藥且將在週末用完。由於一般診所與健保藥局週末休息，強烈建議您在<strong>本週五之前</strong>提前領取慢箋處方或完成備藥，避免週末斷藥！
                  </p>
                </div>
              )}

              {/* 🚨 即期庫存告急預警 (<=3天) */}
              {forecast.isUpcomingCriticalAlert && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-300 text-rose-950 space-y-1 shadow-sm">
                  <div className="flex items-center gap-2 font-black text-sm text-rose-900">
                    <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span>即期庫存告急預警（剩餘僅 {forecast.daysRemaining} 天份）</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed font-medium">
                    目前庫存已低於 3 天安全存量，請儘速安排回診取藥或至藥局補貨！
                  </p>
                </div>
              )}

              {/* 🕒 即期過期預警 (30天內) */}
              {forecast.isExpiringSoon && !forecast.isExpired && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 text-yellow-950 space-y-1 shadow-sm">
                  <div className="flex items-center gap-2 font-black text-sm text-yellow-900">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span>即期藥品有效期限預警</span>
                  </div>
                  <p className="text-xs text-yellow-800 leading-relaxed font-medium">
                    此藥品將於 30 天內到期（到期日：{medication.expiryDate}），請注意用藥時效與藥品保存品質。
                  </p>
                </div>
              )}

              {/* 用藥指引與排程明細 */}
              <div className="p-4 rounded-3xl bg-sky-50/40 border-2 border-sky-100 space-y-3">
                <h4 className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  用藥指引與排程
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-white border border-sky-100">
                    <span className="text-slate-400 block mb-0.5 font-bold">用法時段</span>
                    <span className="font-black text-slate-800">
                      {medication.usageTimeSlots
                        .map((s) => USAGE_SLOT_LABELS[s]?.name || s)
                        .join('、')}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-sky-100">
                    <span className="text-slate-400 block mb-0.5 font-bold">每次劑量 / 頻率</span>
                    <span className="font-black text-slate-800">
                      每次 {medication.dosagePerTime} {medication.packageSpec.unitName} (
                      {FREQUENCY_LABELS[medication.frequency] || medication.frequency})
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-sky-100">
                    <span className="text-slate-400 block mb-0.5 font-bold">開始服用日</span>
                    <span className="font-black text-slate-800">{medication.startDate}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-sky-100">
                    <span className="text-slate-400 block mb-0.5 font-bold">有效期限 (到期日)</span>
                    <span className="font-black text-slate-800">
                      {medication.expiryDate || '未註記'}
                    </span>
                  </div>
                </div>

                {medication.customUsageNote && (
                  <div className="p-3 rounded-2xl bg-sky-100/60 text-xs text-sky-900 font-bold">
                    <strong>用法叮嚀：</strong> {medication.customUsageNote}
                  </div>
                )}

                {medication.doctorInstructions && (
                  <div className="p-3 rounded-2xl bg-blue-100/60 text-xs text-blue-900 font-bold">
                    <strong>醫師/藥師叮嚀：</strong> {medication.doctorInstructions}
                  </div>
                )}

                {medication.hospitalOrPharmacy && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 font-bold">
                    <Building2 className="w-3.5 h-3.5 text-sky-500" />
                    <span>開立/購買處：{medication.hospitalOrPharmacy}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                <span>未來 14 天用藥消耗模擬推估：</span>
                <span className="text-sky-700">每日消耗率: {forecast.dailyConsumptionRate} {medication.packageSpec.unitName}/天</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {timeline.map((item) => (
                  <div
                    key={item.dateStr}
                    className={`p-3 rounded-2xl border-2 text-xs transition ${
                      item.isExhaustionDay
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                        : item.isWeekend
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-sky-50/40 border-sky-100'
                    }`}
                  >
                    <div className="flex items-center justify-between font-black text-slate-800 mb-1">
                      <span>{item.dateStr.slice(5)}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          item.isWeekend ? 'bg-amber-200 text-amber-900' : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        週{item.dayName}
                      </span>
                    </div>

                    <div className="text-slate-400 text-[11px] font-bold">剩餘:</div>
                    <div className="font-black text-slate-900 truncate">
                      {item.remainingFormatted}
                    </div>

                    {item.isExhaustionDay && (
                      <div className="mt-1 text-[10px] font-black text-rose-600 flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> 當日用罄
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal 底部 */}
        <div className="px-5 py-3.5 border-t-2 border-sky-100 bg-sky-50/30 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              if (confirm(`確定要刪除「${medication.name}」嗎？`)) {
                onDelete(medication.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            刪除藥品
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(medication);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 active:scale-95 text-xs font-black shadow-sm transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              編輯資訊
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
