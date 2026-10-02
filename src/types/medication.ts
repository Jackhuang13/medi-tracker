/**
 * MediTracker Types & Interfaces
 * 定義常備藥物管理助手的核心資料模型與枚舉
 */

export type MedicationCategory =
  | 'prescription' // 慢性病處方藥
  | 'otc'          // 常備成藥 / 西藥
  | 'supplement'   // 保健營養品 / 維他命
  | 'herbal'       // 中草藥 / 漢方
  | 'topical'      // 外用藥膏 / 貼片
  | 'other';       // 其他備用藥

/** 常見用法時段 (飯前 AC、飯後 PC、睡前 QN) */
export type UsageTimeSlot =
  | 'AC'           // 飯前 (Ante Cibum / Before Meals)
  | 'PC'           // 飯後 (Post Cibum / After Meals)
  | 'QN'           // 睡前 (Quaque Nocte / Bedtime)
  | 'PRN'          // 需要時使用 (Pro Re Nata / As Needed)
  | string;

export type RouteOfAdmin =
  | 'oral'         // 口服
  | 'topical'      // 外用塗抹
  | 'patch'        // 外敷貼片
  | 'eyedrop'      // 眼藥水 / 滴劑
  | 'inhaler'      // 吸入劑
  | 'injection'    // 皮下 / 肌肉注射
  | 'spray'        // 鼻噴劑 / 噴霧
  | 'other';       // 其他途徑

export type UnitType =
  | '粒'
  | '錠'
  | '膠囊'
  | '包'
  | 'ml'
  | '滴'
  | '片'
  | '匙'
  | '支'
  | '克';

export type PackageUnitName =
  | '盒'
  | '瓶'
  | 'PC'
  | '件'
  | '包'
  | '排'
  | '條'
  | '罐'
  | '袋';

export type DoseFrequency =
  | 'QD'           // 每日 1 次 (Once daily)
  | 'BID'          // 每日 2 次 (Twice daily)
  | 'TID'          // 每日 3 次 (Three times daily)
  | 'QID'          // 每日 4 次 (Four times daily)
  | 'QOD'          // 隔日 1 次 (Every other day)
  | 'WEEKLY'       // 每週固定天數
  | 'PRN';         // 需要時服用 (不依固定天數扣除)

export interface PackageSpec {
  /** 每一件/盒包裝包含的單量單位數 (例如 1 盒 = 12 粒) */
  unitsPerPackage: number;
  /** 單量單位 (如：粒、錠、包、ml) */
  unitName: string;
  /** 包裝單位名稱 (如：盒、瓶、PC、件) */
  packageUnitName: string;
}

export interface MedicationStock {
  /** 完整包裝件數 (例如 2 盒) */
  packages: number;
  /** 零散單量 (例如 6 粒) */
  units: number;
}

export interface StockAdjustment {
  id: string;
  timestamp: string; // ISO String
  changeAmount: number; // 單量增減值 (正數為增加，負數為減少)
  reason: string; // 微調原因 (如: 補買 1 盒、手動盤點校正、遺失補扣)
}

export interface Medication {
  id: string;
  name: string;                        // 藥物標題 (品名)
  brandOrGeneric?: string;            // 學名 / 廠牌
  category: MedicationCategory;        // 藥物類別
  usageTimeSlots: UsageTimeSlot[];    // 用藥用法時段 (如 AC 飯前、PC 飯後、QN 睡前)
  customUsageNote?: string;           // 用法備註說明
  route: RouteOfAdmin;                // 用藥途徑 (口服、外用、外敷、眼藥水等)
  imageUrl?: string;                  // 拍照照片或上傳圖片 (Base64 或 URL)
  iconPreset?: string;                // 預設藥品圖示 (略過拍照時使用)
  colorTheme?: string;                // 專屬識別色系

  packageSpec: PackageSpec;           // 包裝規格定義 (例如 1 PC = 12 粒)
  stock: MedicationStock;             // 目前庫存件數與零散單量

  startDate: string;                  // 開始服用日期 (YYYY-MM-DD)
  dosagePerTime: number;              // 每次服用劑量 (單量單位，例如每次 1 粒)
  frequency: DoseFrequency;           // 服用頻率 (QD, BID, TID, QID, QOD, PRN)
  dailyTimes: number;                 // 每日服用次數
  selectedDaysOfWeek?: number[];      // 當 frequency 為 WEEKLY 時，0=週日, 1=週一 ... 6=週六

  expiryDate?: string;                // 有效期限 (YYYY-MM-DD)
  hospitalOrPharmacy?: string;        // 開立醫院 / 診所 / 購買藥局
  doctorInstructions?: string;        // 醫師/藥師叮嚀與注意事項
  storageCondition?: 'room' | 'refrigerated' | 'dark' | 'dry'; // 保存方式

  status: 'active' | 'paused' | 'exhausted' | 'archived'; // 狀態
  createdAt: string;                  // 建立時間
  updatedAt: string;                  // 更新時間

  // 打卡紀錄: { [dateYYYYMMDD]: { [slot]: boolean } }
  doseCheckLogs?: Record<string, Record<string, boolean>>;

  // 手動庫存微調紀錄
  adjustments?: StockAdjustment[];
}

/** 計算結果：用罄預測與庫存推算資訊 */
export interface MedicationForecast {
  // 現存剩餘量 (實際扣除已使用/打卡量後之在手庫存)
  actualUnitsRemaining: number;
  formattedActualStock: {
    packages: number;
    units: number;
    displayString: string;
    totalUnitsString: string;
  };

  // 應剩餘用量 (理論預算剩餘量 = 初始總庫存 - (天數 * 每日總量))
  theoreticalUnitsRemaining: number;
  formattedTheoreticalStock: {
    packages: number;
    units: number;
    displayString: string;
    totalUnitsString: string;
  };

  // 差異量 (實際現存量 - 理論應剩餘量)
  varianceUnits: number; // 正數表示多於理論 (漏服/少吃)，負數表示少於理論 (超服/提前用完)，0 表示完全吻合
  varianceText: string;
  varianceLevel: 'normal' | 'excess' | 'deficit' | 'upcoming';
  isWithinDailyTolerance: boolean; // 是否在當日 1 天用藥量 (頻次 * 單劑量) 正常容許範圍內

  // 累計已打卡服用量 (粒/錠/包)
  totalConsumedUnits: number;

  totalUnitsRemaining: number;        // 目前剩餘總單量 (同 actualUnitsRemaining)
  formattedStock: {
    packages: number;                 // 剩餘整包裝數
    units: number;                    // 剩餘零散單量
    displayString: string;            // 例如: "1 盒 + 6 粒" 或 "2 盒" 或 "8 粒"
    totalUnitsString: string;         // 例如: "共 18 粒"
  };
  dailyConsumptionRate: number;       // 每日平均消耗單量 = 每次用量 * 頻率每日次數（係數）
  daysRemaining: number;              // 預估還可服用天數 = 目前總庫存量 / 每日總量
  exhaustionDate: string;             // 餘藥為 0 的精準預測日期 (YYYY-MM-DD)
  dayOfWeekName: string;              // 星期幾 (例如: "星期日" 或 "週日")
  dayOfWeekShort: string;             // 例如: "日"、"六"
  isWeekend: boolean;                 // 是否落在週末 (六、日)
  isUpcomingWeekendAlert: boolean;    // 是否屬於「即期週末用罄預警」(即用罄落在週末且剩餘天數 <= 14 天)
  isUpcomingCriticalAlert: boolean;   // 是否屬於「即期庫存告急預警」(剩餘天數 <= 3 天)
  stockWarningLevel: 'safe' | 'warning' | 'critical' | 'exhausted' | 'prn'; // 警戒等級
  isExpiringSoon: boolean;            // 是否在 30 天內即期過期
  isExpired: boolean;                 // 是否已過期
  isNotStartedYet: boolean;           // 基準日是否尚未到達開始用藥日 (如今日10/01，藥物10/02才開始)
}
