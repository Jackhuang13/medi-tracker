import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Pill,
  Calendar,
  AlertTriangle,
  Clock,
  Package,
  Check,
  Star,
} from 'lucide-react';
import {
  Medication,
  MedicationCategory,
  RouteOfAdmin,
  UsageTimeSlot,
  DoseFrequency,
} from '../types/medication';
import { formatDate, getFrequencyMultiplier } from '../utils/medicationMath';
import {
  CATEGORY_LABELS,
  ROUTE_LABELS,
  USAGE_SLOT_LABELS,
  FREQUENCY_LABELS,
  STORAGE_LABELS,
} from '../utils/labels';

interface MedicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Medication | null;
}

const DEFAULT_PACKAGE_UNITS = ['盒', '瓶', 'PC', '件', '包', '排', '條', '罐', '袋'];
const DEFAULT_DOSE_UNITS = ['粒', '錠', '膠囊', '包', 'ml', '滴', '片', '匙', '支', '克'];

export const MedicationFormModal: React.FC<MedicationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 表單狀態
  const [name, setName] = useState('');
  const [brandOrGeneric, setBrandOrGeneric] = useState('');
  const [category, setCategory] = useState<MedicationCategory>('prescription');
  const [route, setRoute] = useState<RouteOfAdmin>('oral');
  const [usageTimeSlots, setUsageTimeSlots] = useState<UsageTimeSlot[]>(['PC']);
  const [customUsageNote, setCustomUsageNote] = useState('');

  // 圖片與圖示
  const [imageUrl, setImageUrl] = useState('');
  const [iconPreset, setIconPreset] = useState('pill_prescription');

  // 包裝規格
  const [packageUnitName, setPackageUnitName] = useState('盒');
  const [unitName, setUnitName] = useState('粒');
  const [unitsPerPackage, setUnitsPerPackage] = useState<number | string>(12);

  // 初始庫存
  const [stockPackages, setStockPackages] = useState<number | string>(2);
  const [stockUnits, setStockUnits] = useState<number | string>(0);

  // 服用排程
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [dosagePerTime, setDosagePerTime] = useState<number | string>(1);
  const [frequency, setFrequency] = useState<DoseFrequency>('QD');
  const [dailyTimes, setDailyTimes] = useState<number | string>(1);
  const [missedDays, setMissedDays] = useState<number | string>(0);
  const [extraDays, setExtraDays] = useState<number | string>(0);

  // 額外資訊
  const [expiryDate, setExpiryDate] = useState('');
  const [hospitalOrPharmacy, setHospitalOrPharmacy] = useState('');
  const [doctorInstructions, setDoctorInstructions] = useState('');
  const [storageCondition, setStorageCondition] = useState<'room' | 'refrigerated' | 'dark' | 'dry'>('room');
  const [status, setStatus] = useState<'active' | 'paused' | 'exhausted' | 'archived'>('active');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 載入編輯資料
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setBrandOrGeneric(initialData.brandOrGeneric || '');
      setCategory(initialData.category || 'prescription');
      setRoute(initialData.route || 'oral');
      setUsageTimeSlots(initialData.usageTimeSlots?.length ? initialData.usageTimeSlots : ['PC']);
      setCustomUsageNote(initialData.customUsageNote || '');
      setImageUrl(initialData.imageUrl || '');
      setIconPreset(initialData.iconPreset || 'pill_prescription');
      setPackageUnitName(initialData.packageSpec?.packageUnitName || '盒');
      setUnitName(initialData.packageSpec?.unitName || '粒');
      setUnitsPerPackage(initialData.packageSpec?.unitsPerPackage || 12);
      setStockPackages(initialData.stock?.packages ?? 2);
      setStockUnits(initialData.stock?.units ?? 0);
      setStartDate(initialData.startDate || formatDate(new Date()));
      setDosagePerTime(initialData.dosagePerTime || 1);
      setFrequency(initialData.frequency || 'QD');
      setDailyTimes(initialData.dailyTimes || 1);
      setMissedDays(initialData.missedDays ?? 0);
      setExtraDays(initialData.extraDays ?? 0);
      setExpiryDate(initialData.expiryDate || '');
      setHospitalOrPharmacy(initialData.hospitalOrPharmacy || '');
      setDoctorInstructions(initialData.doctorInstructions || '');
      setStorageCondition(initialData.storageCondition || 'room');
      setStatus(initialData.status || 'active');
    } else {
      setName('');
      setBrandOrGeneric('');
      setCategory('prescription');
      setRoute('oral');
      setUsageTimeSlots(['PC']);
      setCustomUsageNote('');
      setImageUrl('');
      setIconPreset('pill_prescription');
      setPackageUnitName('盒');
      setUnitName('粒');
      setUnitsPerPackage(12);
      setStockPackages(2);
      setStockUnits(0);
      setStartDate(formatDate(new Date()));
      setDosagePerTime(1);
      setFrequency('QD');
      setDailyTimes(1);
      setMissedDays(0);
      setExtraDays(0);
      setExpiryDate('');
      setHospitalOrPharmacy('');
      setDoctorInstructions('');
      setStorageCondition('room');
      setStatus('active');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // 圖片讀取處理
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImageUrl(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleSlot = (slot: UsageTimeSlot) => {
    if (usageTimeSlots.includes(slot)) {
      if (usageTimeSlots.length > 1) {
        setUsageTimeSlots(usageTimeSlots.filter((s) => s !== slot));
      }
    } else {
      setUsageTimeSlots([...usageTimeSlots, slot]);
    }
  };

  // 核心公式即時計算
  const numUnitsPerPkg = Math.max(1, Number(unitsPerPackage) || 1);
  const numStockPkgs = Math.max(0, Number(stockPackages) || 0);
  const numStockUnits = Math.max(0, Number(stockUnits) || 0);
  const totalUnits = numStockPkgs * numUnitsPerPkg + numStockUnits;
  const numDosagePerTime = Math.max(0, Number(dosagePerTime) || 1);

  // 每日使用總量（每日消耗率）= 每次用量 * 頻率每日次數（係數）
  const multiplier = getFrequencyMultiplier(frequency);
  const dailyRate = frequency === 'PRN' ? 0 : Math.round(numDosagePerTime * multiplier * 100) / 100;

  // 預估剩餘天數 = 目前總庫存量 / 每日總量
  const estimatedDays = dailyRate > 0 ? Math.floor(totalUnits / dailyRate) : 0;
  const forecastDate = new Date();
  forecastDate.setDate(forecastDate.getDate() + estimatedDays);
  const forecastDateStr = formatDate(forecastDate);
  const dayOfWeek = forecastDate.getDay();
  const isWeekendForecast = dayOfWeek === 0 || dayOfWeek === 6;
  const isUpcomingWeekendAlert = isWeekendForecast && estimatedDays > 0 && estimatedDays <= 14;
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = '請輸入藥物標題 (品名)';
    }
    if (Number(unitsPerPackage) <= 0) {
      newErrors.unitsPerPackage = '每件包裝單量必須大於 0';
    }
    if (Number(dosagePerTime) <= 0) {
      newErrors.dosagePerTime = '每次服用劑量必須大於 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      brandOrGeneric: brandOrGeneric.trim(),
      category,
      route,
      usageTimeSlots,
      customUsageNote: customUsageNote.trim(),
      imageUrl,
      iconPreset,
      colorTheme: 'sky',
      packageSpec: {
        unitsPerPackage: Number(unitsPerPackage),
        unitName: unitName.trim() || '粒',
        packageUnitName: packageUnitName.trim() || '盒',
      },
      stock: {
        packages: Number(stockPackages),
        units: Number(stockUnits),
      },
      startDate,
      dosagePerTime: Number(dosagePerTime),
      frequency,
      dailyTimes: frequency === 'QD' ? 1 : frequency === 'BID' ? 2 : frequency === 'TID' ? 3 : frequency === 'QID' ? 4 : Number(dailyTimes),
      missedDays: Math.max(0, Math.floor(Number(missedDays) || 0)),
      extraDays: Math.max(0, Math.floor(Number(extraDays) || 0)),
      expiryDate,
      hospitalOrPharmacy: hospitalOrPharmacy.trim(),
      doctorInstructions: doctorInstructions.trim(),
      storageCondition,
      status,
      doseCheckLogs: initialData?.doseCheckLogs || {},
      adjustments: initialData?.adjustments || [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border-2 border-sky-100 overflow-hidden">
        {/* Modal 標頭 */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-sky-100 bg-gradient-to-r from-sky-50 via-blue-50 to-pink-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center shadow-sm">
              <Pill className="w-5 h-5 rotate-45" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-sky-950">
                {initialData ? '編輯藥物資訊與排程' : '新增常備藥物 / 處方建檔'}
              </h2>
              <p className="text-xs text-sky-700 font-bold">支援拍照拍照建檔、包裝單量推算與預估用罄日 ✨</p>
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

        {/* Modal 內容表單 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-800">
          {/* 1. 拍照上傳與外觀 */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-50/80 via-blue-50/40 to-pink-50/30 border-2 border-sky-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-sky-600" />
                藥物實體照片 (拍照/相簿上傳，亦可略過使用可愛圖示)
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
                >
                  清除照片
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* 圖片預覽 */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-2 border-dashed border-sky-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {imageUrl ? (
                  <img src={imageUrl} alt="藥物預覽" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-sky-500 text-center p-2">
                    <Pill className="w-8 h-8 opacity-40 mb-1" />
                    <span className="text-[10px] font-bold text-sky-600">無照片 (預設圖示)</span>
                  </div>
                )}
              </div>

              {/* 拍照與上傳按鈕 */}
              <div className="flex-1 flex flex-wrap gap-2 w-full">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-xs font-bold hover:from-sky-600 hover:to-blue-600 active:scale-95 shadow-sm transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  相機拍照 📷
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border-2 border-sky-200 text-sky-800 text-xs font-bold hover:bg-sky-50 active:scale-95 transition cursor-pointer shadow-2xs"
                >
                  <Upload className="w-4 h-4 text-sky-600" />
                  相簿上傳 🖼️
                </button>
              </div>
            </div>
          </div>

          {/* 2. 基本資訊 */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                藥物標題 (品名) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：立普妥膜衣錠 20mg / 普拿疼速效"
                className={`w-full px-4 py-2.5 rounded-2xl border-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition ${
                  errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-sky-100 bg-sky-50/30'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1 font-bold">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  學名 / 廠牌成分說明 (選填)
                </label>
                <input
                  type="text"
                  value={brandOrGeneric}
                  onChange={(e) => setBrandOrGeneric(e.target.value)}
                  placeholder="例如：Atorvastatin 20mg / 解熱鎮痛"
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  藥物類別
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MedicationCategory)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold text-slate-800"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.icon} {val.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. 用藥途徑與常見用法時段 (飯前、飯後、睡前、需要時使用) */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  用藥途徑
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value as RouteOfAdmin)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold text-slate-800"
                >
                  {Object.entries(ROUTE_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  服用頻率
                </label>
                <select
                  value={frequency}
                  onChange={(e) => {
                    const val = e.target.value as DoseFrequency;
                    setFrequency(val);
                    if (val === 'QD') setDailyTimes(1);
                    if (val === 'BID') setDailyTimes(2);
                    if (val === 'TID') setDailyTimes(3);
                    if (val === 'QID') setDailyTimes(4);
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold text-slate-800"
                >
                  {Object.entries(FREQUENCY_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 用法時段選擇 (飯前、飯後、睡前) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                用法時段
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['AC', 'PC', 'QN'] as const).map((key) => {
                  const val = USAGE_SLOT_LABELS[key];
                  const isSelected = usageTimeSlots.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSlot(key)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-sky-200'
                          : 'bg-white hover:bg-sky-50 text-slate-700 border-2 border-sky-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{val.icon} {val.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                用法特別備註 (選填)
              </label>
              <input
                type="text"
                value={customUsageNote}
                onChange={(e) => setCustomUsageNote(e.target.value)}
                placeholder="例如：配溫開水服用、不可咬碎、有痛才吃"
                className="w-full px-4 py-2 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          {/* 4. 包裝規格與庫存換算定義 */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-50/70 to-blue-50/40 border-2 border-sky-100 space-y-3">
            <h4 className="text-xs font-black text-sky-950 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-600" />
              包裝規格與初始庫存 (件數與單量精確換算)
            </h4>

            {/* 規格定義：1 [包裝] = X [單量] */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-sky-800 mb-1">
                  包裝單位 (PC)
                </label>
                <input
                  type="text"
                  list="pkg-units"
                  value={packageUnitName}
                  onChange={(e) => setPackageUnitName(e.target.value)}
                  placeholder="盒 / 瓶 / PC"
                  className="w-full px-3 py-2 rounded-2xl border-2 border-sky-100 bg-white text-xs focus:ring-2 focus:ring-sky-400 font-black text-slate-800"
                />
                <datalist id="pkg-units">
                  {DEFAULT_PACKAGE_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-800 mb-1">
                  1 件包含單量
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={unitsPerPackage}
                  onChange={(e) => setUnitsPerPackage(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border-2 border-sky-100 bg-white text-xs font-black text-slate-800 focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-800 mb-1">
                  單量單位
                </label>
                <input
                  type="text"
                  list="dose-units"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="粒 / 錠 / 包 / ml"
                  className="w-full px-3 py-2 rounded-2xl border-2 border-sky-100 bg-white text-xs font-black text-slate-800 focus:ring-2 focus:ring-sky-400"
                />
                <datalist id="dose-units">
                  {DEFAULT_DOSE_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* 目前庫存 */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-200/60">
              <div>
                <label className="block text-[11px] font-bold text-sky-800 mb-1">
                  目前完整件數 ({packageUnitName || '盒'})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stockPackages}
                  onChange={(e) => setStockPackages(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border-2 border-sky-100 bg-white text-xs font-black text-slate-800 focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-800 mb-1">
                  散裝單量 ({unitName || '粒'})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stockUnits}
                  onChange={(e) => setStockUnits(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border-2 border-sky-100 bg-white text-xs font-black text-slate-800 focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            <div className="text-xs text-sky-900 font-bold bg-white/80 p-2.5 rounded-2xl flex items-center justify-between border border-sky-100">
              <span>目前總庫存換算：</span>
              <span className="font-black text-sky-700">
                {numStockPkgs} {packageUnitName} + {numStockUnits} {unitName} = 共 {totalUnits} {unitName}
              </span>
            </div>
          </div>

          {/* 5. 服用排程與精準消耗推算 */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  開始服用日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-xs font-bold focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  每次服用劑量 ({unitName})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={dosagePerTime}
                  onChange={(e) => setDosagePerTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-xs font-black focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            {/* 忘吃或多吃日數 (影響預估在庫藥量) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-1">
                  忘吃日數（少吃天數）
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={missedDays}
                    onChange={(e) => setMissedDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-indigo-100 bg-white text-xs font-black text-slate-800 focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-500">
                    天 (庫存增加)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  多吃日數（超服天數）
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={extraDays}
                    onChange={(e) => setExtraDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-amber-100 bg-white text-xs font-black text-slate-800 focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">
                    天 (加速消耗)
                  </span>
                </div>
              </div>
            </div>

            {/* 即時推算卡片 (依據核心公式) */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-50/80 to-orange-50/60 border-2 border-amber-200 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between font-black text-amber-950">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  公式推算結果
                </span>
                <span>每日使用總量：約 {dailyRate} {unitName} / 天</span>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-1 border-t border-amber-200/80 text-amber-900 font-bold">
                <span>預估剩餘天數：<strong className="text-amber-950 font-black">{frequency === 'PRN' ? '不固定 (PRN)' : `${estimatedDays} 天`}</strong></span>
                <span>
                  預測用罄日：
                  <strong className={`ml-1 ${isUpcomingWeekendAlert ? 'text-rose-600 font-black' : 'text-slate-900 font-black'}`}>
                    {frequency === 'PRN' ? '需要時使用' : `${forecastDateStr}（${dayNames[dayOfWeek]}）`}
                  </strong>
                </span>
              </div>

              {isUpcomingWeekendAlert && (
                <div className="pt-1 flex items-center gap-1.5 text-rose-600 text-[11px] font-black">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>即期預警：用罄日落在週末（星期{dayNames[dayOfWeek]}），診所可能休假，請提前補藥喔！</span>
                </div>
              )}
            </div>
          </div>

          {/* 6. 其他醫療叮嚀 */}
          <div className="space-y-3 pt-2 border-t border-sky-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  開立機構 / 購買藥局 (選填)
                </label>
                <input
                  type="text"
                  value={hospitalOrPharmacy}
                  onChange={(e) => setHospitalOrPharmacy(e.target.value)}
                  placeholder="例如：台大醫院 心臟內科 / 大樹藥局"
                  className="w-full px-4 py-2 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-xs focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  有效期限 / 到期日 (選填)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-xs focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                保存方式
              </label>
              <select
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value as any)}
                className="w-full px-4 py-2 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-xs focus:ring-2 focus:ring-sky-400 font-bold"
              >
                {Object.entries(STORAGE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                醫師/藥師特別叮嚀與注意事項 (選填)
              </label>
              <textarea
                rows={2}
                value={doctorInstructions}
                onChange={(e) => setDoctorInstructions(e.target.value)}
                placeholder="例如：定期抽血檢測、服藥期間忌食葡萄柚、注意過敏等"
                className="w-full px-4 py-2 rounded-2xl border-2 border-sky-100 bg-sky-50/30 text-xs focus:ring-2 focus:ring-sky-400 resize-none"
              />
            </div>
          </div>

          {/* 表單按鈕 */}
          <div className="pt-4 border-t border-sky-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border-2 border-sky-100 hover:bg-sky-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 active:scale-95 text-white text-xs font-black shadow-md shadow-sky-400/30 transition cursor-pointer"
            >
              {initialData ? '儲存修改 ✨' : '建立藥物並開始追蹤 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
