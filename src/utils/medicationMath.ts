/**
 * MediTracker Calculation Engine
 * 遵循核心計算公式：
 * 1. 每日使用總量（每日消耗率）= 每次用量 * 頻率每日次數（係數）
 * 2. 指定天數的總消耗量 = 每日總量 * N = (每次用量 * 頻率每日次數) * N
 * 3. 應剩餘用量（理論預算當前量）= 初始總庫存量 - (自開始日至今經過天數 * 每日總量)
 * 4. 現存剩餘量（實際扣除已使用量）= 初始總庫存量 - 累計已打卡服用消耗量
 * 5. 差異量 = 現存剩餘量 - 應剩餘用量
 * 6. 打卡格數生成：BID 必為 2 格、TID 必為 3 格、QID 必為 4 格、QD 必為 1 格
 * 7. 開始用藥日防呆：若基準日早於開始日，標記 isNotStartedYet 為 true
 */

import { Medication, MedicationForecast, DoseFrequency, UsageTimeSlot } from '../types/medication';
import { FREQUENCY_FACTORS, USAGE_SLOT_LABELS } from './labels';

const DAY_NAMES_FULL = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const DAY_NAMES_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

export interface DoseSlotInfo {
  key: string;       // slot identifier for doseCheckLogs, e.g. "PC_1", "PC_2" or "AC", "PC", "QN"
  label: string;     // display label, e.g. "早 飯後", "晚 飯後"
  shortLabel: string;// e.g. "早 飯後"
  icon: string;      // e.g. "🍱"
  slotType: string;  // e.g. "PC"
}

/**
 * 取得格式化的 YYYY-MM-DD 字串
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 解析 YYYY-MM-DD 為當地時間 Date 物件 (避免時區偏移)
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * 計算兩日期相差天數 (d2 - d1)
 */
export function diffDays(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * 根據頻率與用法時段，嚴格生成正確數量之打卡時段格數清單
 * 例如：BID (每日 2 次) 必產生 2 格、TID 必產生 3 格、QID 必產生 4 格
 */
export function getEffectiveDoseSlots(med: Medication): DoseSlotInfo[] {
  const freq = med.frequency;
  const userSlots = med.usageTimeSlots && med.usageTimeSlots.length > 0 ? med.usageTimeSlots : ['PC'];
  
  const doseTimes =
    freq === 'QD'
      ? 1
      : freq === 'BID'
      ? 2
      : freq === 'TID'
      ? 3
      : freq === 'QID'
      ? 4
      : freq === 'QOD'
      ? 1
      : freq === 'PRN'
      ? 1
      : Math.max(1, med.dailyTimes || 1);

  if (freq === 'PRN') {
    return [
      {
        key: 'PRN',
        label: '需要時服用 (PRN)',
        shortLabel: '需要時',
        icon: '⭐',
        slotType: 'PRN',
      },
    ];
  }

  // 若使用者在表單選取了多個不同時段且數量足夠 (如 ['AC', 'PC', 'QN'])
  if (userSlots.length >= doseTimes) {
    return userSlots.slice(0, doseTimes).map((slotKey) => {
      const slotDef = USAGE_SLOT_LABELS[slotKey] || { name: slotKey, shortName: slotKey, icon: '💊' };
      return {
        key: slotKey,
        label: slotDef.name,
        shortLabel: slotDef.shortName,
        icon: slotDef.icon,
        slotType: slotKey,
      };
    });
  }

  // 若使用者選取的時段數少於每日次數 (如 BID 僅選了 ['PC'])，自動擴展為對應次數格數！
  const timeLabels = ['早', '中', '晚', '睡前'];
  const slots: DoseSlotInfo[] = [];

  for (let i = 0; i < doseTimes; i++) {
    const baseSlot = userSlots[i % userSlots.length] || 'PC';
    const slotDef = USAGE_SLOT_LABELS[baseSlot] || { name: baseSlot, shortName: baseSlot, icon: '💊' };
    const prefix = timeLabels[i] || `第 ${i + 1} 次`;
    const key = doseTimes === 1 ? baseSlot : `${baseSlot}_${i + 1}`;

    slots.push({
      key,
      label: `${prefix} ${slotDef.shortName}`,
      shortLabel: `${prefix} ${slotDef.shortName}`,
      icon: slotDef.icon,
      slotType: baseSlot,
    });
  }

  return slots;
}

/**
 * 取得服用頻率之每日等效次數（係數）
 */
export function getFrequencyMultiplier(frequency: DoseFrequency, selectedDaysOfWeek?: number[]): number {
  if (frequency === 'PRN') return 0;
  if (frequency === 'QD') return 1;
  if (frequency === 'BID') return 2;
  if (frequency === 'TID') return 3;
  if (frequency === 'QID') return 4;
  if (frequency === 'QOD') return 0.5;
  if (frequency === 'WEEKLY') {
    const activeDays = selectedDaysOfWeek && selectedDaysOfWeek.length > 0 ? selectedDaysOfWeek.length : 1;
    return activeDays / 7;
  }
  return FREQUENCY_FACTORS[frequency] ?? 1;
}

/**
 * 每日使用總量（每日消耗率）
 * 每日總量 = 每次用量 * 頻率每日次數（係數）
 */
export function calculateDailyRate(med: Medication): number {
  if (med.frequency === 'PRN') {
    return 0; // 需要時服用，不扣除日常推算
  }

  const dose = Math.max(0, Number(med.dosagePerTime) || 1);
  const multiplier = getFrequencyMultiplier(med.frequency, med.selectedDaysOfWeek);

  return Math.round(dose * multiplier * 100) / 100;
}

/**
 * 指定天數的總消耗量（已知共 N 天）
 * 總消耗量 = 每日總量 * N = (每次用量 * 頻率每日次數) * N
 */
export function calculateTotalConsumption(med: Medication, days: number): number {
  const dailyRate = calculateDailyRate(med);
  return Math.round(dailyRate * Math.max(0, days) * 100) / 100;
}

/**
 * 計算基礎總庫存單量 (完整包裝件數 * 每件單量 + 散裝單量)
 */
export function calculateBaseUnits(med: Medication): number {
  const unitsPerPkg = Math.max(1, Number(med.packageSpec?.unitsPerPackage) || 1);
  const pkgs = Math.max(0, Number(med.stock?.packages) || 0);
  const extraUnits = Math.max(0, Number(med.stock?.units) || 0);
  return pkgs * unitsPerPkg + extraUnits;
}

/**
 * 計算累計已打卡服用消耗之總單量 (粒/錠/包)
 */
export function calculateTotalCheckedUnits(med: Medication): number {
  const dose = Math.max(0, Number(med.dosagePerTime) || 1);
  const logs = med.doseCheckLogs || {};
  let totalCheckedCount = 0;

  Object.values(logs).forEach((daySlots) => {
    if (daySlots && typeof daySlots === 'object') {
      Object.values(daySlots).forEach((isChecked) => {
        if (isChecked) {
          totalCheckedCount += 1;
        }
      });
    }
  });

  return Math.round(totalCheckedCount * dose * 10) / 10;
}

/**
 * 將總單量格式化為「X 件/盒 + Y 粒 (共 Z 粒)」
 */
export function formatStockDisplay(
  totalUnits: number,
  unitsPerPackage: number,
  unitName: string,
  packageUnitName: string
): { packages: number; units: number; displayString: string; totalUnitsString: string } {
  const safeUnitsPerPkg = Math.max(1, unitsPerPackage || 1);
  const safeTotal = Math.max(0, Math.round(totalUnits * 10) / 10);

  if (safeTotal <= 0) {
    return {
      packages: 0,
      units: 0,
      displayString: `已用罄 (0 ${unitName})`,
      totalUnitsString: `共 0 ${unitName}`,
    };
  }

  const packages = Math.floor(safeTotal / safeUnitsPerPkg);
  const units = Math.round((safeTotal % safeUnitsPerPkg) * 10) / 10;

  let displayString = '';
  if (packages > 0 && units > 0) {
    displayString = `${packages} ${packageUnitName} + ${units} ${unitName}`;
  } else if (packages > 0 && units === 0) {
    displayString = `${packages} ${packageUnitName}`;
  } else {
    displayString = `${units} ${unitName}`;
  }

  return {
    packages,
    units,
    displayString,
    totalUnitsString: `共 ${safeTotal} ${unitName}`,
  };
}

/**
 * 核心預測函數：計算藥品實際現存剩餘量、理論應剩餘用量、用罄日期、週末休診預警與即期庫存警戒
 * @param med 藥物資料
 * @param referenceDate 基準日期 (預設為今日)
 */
export function calculateMedicationForecast(
  med: Medication,
  referenceDate: Date = new Date()
): MedicationForecast {
  const unitsPerPackage = Math.max(1, Number(med.packageSpec?.unitsPerPackage) || 1);
  const unitName = med.packageSpec?.unitName || '粒';
  const packageUnitName = med.packageSpec?.packageUnitName || '盒';

  const baseUnits = calculateBaseUnits(med);
  const totalConsumedUnits = calculateTotalCheckedUnits(med);

  // 1. 現存剩餘量（實際扣除已打卡使用量）
  const actualUnitsRemaining = Math.max(0, Math.round((baseUnits - totalConsumedUnits) * 10) / 10);
  const formattedActualStock = formatStockDisplay(
    actualUnitsRemaining,
    unitsPerPackage,
    unitName,
    packageUnitName
  );

  const dailyRate = calculateDailyRate(med);

  // 檢查基準日是否尚未到達開始用藥日
  const startD = parseDate(med.startDate || formatDate(referenceDate));
  const daysSinceStart = diffDays(startD, referenceDate);
  const isNotStartedYet = daysSinceStart < 0;

  // 2. 應剩餘用量（理論預算當前量 = 初始總庫存量 - (自開始日至今經過天數 * 每日總量)）
  const elapsedDays = isNotStartedYet ? 0 : Math.max(0, daysSinceStart);
  const theoreticalConsumed = calculateTotalConsumption(med, elapsedDays);
  const theoreticalUnitsRemaining = Math.max(
    0,
    Math.round((baseUnits - theoreticalConsumed) * 10) / 10
  );
  const formattedTheoreticalStock = formatStockDisplay(
    theoreticalUnitsRemaining,
    unitsPerPackage,
    unitName,
    packageUnitName
  );

  // 3. 差異量 (實際現存量 - 理論應剩餘量)
  // 核心規則：預算差異應考慮當日用藥 (頻次*單劑量)，若差距在一天用藥 (dailyRate) 範圍內，可視為正常
  const varianceUnits = Math.round((actualUnitsRemaining - theoreticalUnitsRemaining) * 10) / 10;
  const isWithinDailyTolerance = dailyRate > 0 ? Math.abs(varianceUnits) <= dailyRate : varianceUnits === 0;

  let varianceText = '符合預期進度';
  let varianceLevel: 'normal' | 'excess' | 'deficit' | 'upcoming' = 'normal';

  if (isNotStartedYet) {
    varianceText = `預計於 ${med.startDate} 啟用`;
    varianceLevel = 'upcoming';
  } else if (isWithinDailyTolerance) {
    // 差距在一天用藥 (頻次 * 單劑量) 範圍內，視為正常
    if (varianceUnits === 0) {
      varianceText = '進度完全吻合 (正常)';
    } else if (varianceUnits > 0) {
      varianceText = `正常進度 (+${varianceUnits} ${unitName})`;
    } else {
      varianceText = `正常進度 (${varianceUnits} ${unitName})`;
    }
    varianceLevel = 'normal';
  } else if (varianceUnits > dailyRate) {
    varianceText = `多 ${varianceUnits} ${unitName} (少服/漏服)`;
    varianceLevel = 'excess';
  } else {
    varianceText = `少 ${Math.abs(varianceUnits)} ${unitName} (超服/提前)`;
    varianceLevel = 'deficit';
  }

  // 檢查是否過期
  let isExpiringSoon = false;
  let isExpired = false;
  if (med.expiryDate) {
    const exp = parseDate(med.expiryDate);
    const daysToExp = diffDays(referenceDate, exp);
    if (daysToExp < 0) {
      isExpired = true;
    } else if (daysToExp <= 30) {
      isExpiringSoon = true;
    }
  }

  // PRN 視需要用藥處理 (無固定每日消耗)
  if (med.frequency === 'PRN' || dailyRate <= 0) {
    return {
      actualUnitsRemaining,
      formattedActualStock,
      theoreticalUnitsRemaining,
      formattedTheoreticalStock,
      varianceUnits: 0,
      varianceText: isNotStartedYet ? `預計於 ${med.startDate} 啟用` : '需要時使用',
      varianceLevel: isNotStartedYet ? 'upcoming' : 'normal',
      isWithinDailyTolerance: true,
      totalConsumedUnits,
      totalUnitsRemaining: actualUnitsRemaining,
      formattedStock: formattedActualStock,
      dailyConsumptionRate: 0,
      daysRemaining: 9999,
      exhaustionDate: '需要時使用 (無固定消耗日)',
      dayOfWeekName: '常備備用',
      dayOfWeekShort: '備用',
      isWeekend: false,
      isUpcomingWeekendAlert: false,
      isUpcomingCriticalAlert: false,
      stockWarningLevel: actualUnitsRemaining <= 0 ? 'exhausted' : 'prn',
      isExpiringSoon,
      isExpired,
      isNotStartedYet,
    };
  }

  // 已用罄狀態
  if (actualUnitsRemaining <= 0) {
    const todayStr = formatDate(referenceDate);
    const dayOfWeekIdx = referenceDate.getDay();
    return {
      actualUnitsRemaining: 0,
      formattedActualStock,
      theoreticalUnitsRemaining,
      formattedTheoreticalStock,
      varianceUnits,
      varianceText,
      varianceLevel,
      isWithinDailyTolerance,
      totalConsumedUnits,
      totalUnitsRemaining: 0,
      formattedStock: formattedActualStock,
      dailyConsumptionRate: dailyRate,
      daysRemaining: 0,
      exhaustionDate: todayStr,
      dayOfWeekName: DAY_NAMES_FULL[dayOfWeekIdx],
      dayOfWeekShort: DAY_NAMES_SHORT[dayOfWeekIdx],
      isWeekend: dayOfWeekIdx === 0 || dayOfWeekIdx === 6,
      isUpcomingWeekendAlert: false,
      isUpcomingCriticalAlert: true,
      stockWarningLevel: 'exhausted',
      isExpiringSoon,
      isExpired,
      isNotStartedYet,
    };
  }

  // 預估剩餘天數 = 目前實際剩餘量 / 每日總量
  const daysRemaining = Math.floor(actualUnitsRemaining / dailyRate);

  // 推算精確用罄日期 (若尚未開始，從開始日開始推算；若已開始，從基準日推算)
  const calculationBaseDate = isNotStartedYet ? startD : referenceDate;
  const targetDate = new Date(calculationBaseDate.getTime());
  targetDate.setDate(targetDate.getDate() + daysRemaining);

  const exhaustionDateStr = formatDate(targetDate);
  const dayOfWeekIdx = targetDate.getDay();
  const dayOfWeekName = DAY_NAMES_FULL[dayOfWeekIdx];
  const dayOfWeekShort = DAY_NAMES_SHORT[dayOfWeekIdx];
  const isWeekend = dayOfWeekIdx === 0 || dayOfWeekIdx === 6; // 0 是週日，6 是週六

  // 即期預警邏輯：僅當用罄日落在 14 天內且為週末時，才觸發「週末休診即期預警」
  const isUpcomingWeekendAlert = isWeekend && daysRemaining > 0 && daysRemaining <= 14 && !isNotStartedYet;
  const isUpcomingCriticalAlert = daysRemaining > 0 && daysRemaining <= 3 && !isNotStartedYet;

  // 庫存警戒等級
  let stockWarningLevel: 'safe' | 'warning' | 'critical' | 'exhausted' | 'prn' = 'safe';
  if (actualUnitsRemaining <= 0) {
    stockWarningLevel = 'exhausted';
  } else if (isNotStartedYet) {
    stockWarningLevel = 'safe';
  } else if (daysRemaining <= 3) {
    stockWarningLevel = 'critical'; // <= 3 天即期紅色高亮
  } else if (daysRemaining <= 7) {
    stockWarningLevel = 'warning';  // <= 7 天即期黃色提醒
  } else {
    stockWarningLevel = 'safe';
  }

  return {
    actualUnitsRemaining,
    formattedActualStock,
    theoreticalUnitsRemaining,
    formattedTheoreticalStock,
    varianceUnits,
    varianceText,
    varianceLevel,
    isWithinDailyTolerance,
    totalConsumedUnits,
    totalUnitsRemaining: actualUnitsRemaining,
    formattedStock: formattedActualStock,
    dailyConsumptionRate: dailyRate,
    daysRemaining,
    exhaustionDate: exhaustionDateStr,
    dayOfWeekName,
    dayOfWeekShort,
    isWeekend,
    isUpcomingWeekendAlert,
    isUpcomingCriticalAlert,
    stockWarningLevel,
    isExpiringSoon,
    isExpired,
    isNotStartedYet,
  };
}

/**
 * 產生未來 N 天的消耗時間軸數據，供視覺化呈現
 */
export function generateConsumptionTimeline(
  med: Medication,
  daysCount = 14,
  startDate: Date = new Date()
): Array<{
  dateStr: string;
  dayName: string;
  isWeekend: boolean;
  remainingUnits: number;
  remainingFormatted: string;
  isExhaustionDay: boolean;
}> {
  const dailyRate = calculateDailyRate(med);
  const forecast = calculateMedicationForecast(med, startDate);
  const totalUnits = forecast.actualUnitsRemaining;
  const unitsPerPkg = Math.max(1, Number(med.packageSpec?.unitsPerPackage) || 1);
  const unitName = med.packageSpec?.unitName || '粒';
  const pkgName = med.packageSpec?.packageUnitName || '盒';

  const timeline = [];
  let currentUnits = totalUnits;

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(startDate.getTime());
    d.setDate(d.getDate() + i);
    const dateStr = formatDate(d);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isExhaustionDay = currentUnits > 0 && currentUnits - dailyRate <= 0;

    const formatted = formatStockDisplay(currentUnits, unitsPerPkg, unitName, pkgName);

    timeline.push({
      dateStr,
      dayName: DAY_NAMES_SHORT[dayOfWeek],
      isWeekend,
      remainingUnits: Math.max(0, Math.round(currentUnits * 10) / 10),
      remainingFormatted: formatted.displayString,
      isExhaustionDay,
    });

    if (med.frequency !== 'PRN') {
      currentUnits = Math.max(0, currentUnits - dailyRate);
    }
  }

  return timeline;
}
