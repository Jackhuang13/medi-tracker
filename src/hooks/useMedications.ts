import { useState, useEffect, useCallback } from 'react';
import { Medication, MedicationCategory, StockAdjustment, UsageTimeSlot } from '../types/medication';
import { INITIAL_MEDICATIONS } from '../data/initialMedications';
import { formatDate, getEffectiveDoseSlots } from '../utils/medicationMath';

const STORAGE_KEY = 'MEDITRACKER_STORE_V1';

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse saved medications from localStorage:', e);
    }
    return INITIAL_MEDICATIONS;
  });

  // 自動持久化至 LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error saving medications to localStorage:', e);
    }
  }, [medications]);

  /** 新增藥物 */
  const addMedication = useCallback((newMed: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const createdMed: Medication = {
      ...newMed,
      id,
      createdAt: now,
      updatedAt: now,
      doseCheckLogs: newMed.doseCheckLogs || {},
      adjustments: newMed.adjustments || [
        {
          id: `adj-${Date.now()}`,
          timestamp: now,
          changeAmount:
            (newMed.stock?.packages || 0) * (newMed.packageSpec?.unitsPerPackage || 1) +
            (newMed.stock?.units || 0),
          reason: '建立藥物初始建檔入庫',
        },
      ],
    };

    setMedications((prev) => [createdMed, ...prev]);
    return createdMed;
  }, []);

  /** 更新藥物 */
  const updateMedication = useCallback((id: string, updates: Partial<Medication>) => {
    setMedications((prev) =>
      prev.map((med) => {
        if (med.id !== id) return med;
        return {
          ...med,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  /** 刪除藥物 */
  const deleteMedication = useCallback((id: string) => {
    setMedications((prev) => prev.filter((med) => med.id !== id));
  }, []);

  /** 重置為初始範本資料 */
  const resetToSampleData = useCallback(() => {
    setMedications(INITIAL_MEDICATIONS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MEDICATIONS));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }, []);

  /**
   * 每日服藥打卡切換 (Check-in)
   */
  const toggleDoseCheck = useCallback((id: string, dateKey: string, slot: UsageTimeSlot | string) => {
    setMedications((prev) =>
      prev.map((med) => {
        if (med.id !== id) return med;

        // 防呆：不可在開始用藥日之前填寫使用量或打卡
        if (med.startDate && dateKey < med.startDate) {
          return med;
        }

        const currentLogs = med.doseCheckLogs || {};
        const dateLogs = currentLogs[dateKey] || {};
        const isChecked = !dateLogs[slot];

        const updatedDateLogs = {
          ...dateLogs,
          [slot]: isChecked,
        };

        return {
          ...med,
          updatedAt: new Date().toISOString(),
          doseCheckLogs: {
            ...currentLogs,
            [dateKey]: updatedDateLogs,
          },
        };
      })
    );
  }, []);

  /**
   * 一鍵完成指定日期的所有時段服藥打卡
   */
  const batchCheckDate = useCallback((id: string, dateKey: string, forceCheckAll = true) => {
    setMedications((prev) =>
      prev.map((med) => {
        if (med.id !== id) return med;

        // 防呆：不可在開始用藥日之前填寫使用量或打卡
        if (med.startDate && dateKey < med.startDate) {
          return med;
        }

        const currentLogs = med.doseCheckLogs || {};
        const dateLogs = { ...(currentLogs[dateKey] || {}) };
        const effectiveSlots = getEffectiveDoseSlots(med);

        effectiveSlots.forEach((slot) => {
          dateLogs[slot.key] = forceCheckAll;
        });

        return {
          ...med,
          updatedAt: new Date().toISOString(),
          doseCheckLogs: {
            ...currentLogs,
            [dateKey]: dateLogs,
          },
        };
      })
    );
  }, []);

  /**
   * 快速手動微調庫存數量 (單量增減)
   */
  const adjustStock = useCallback(
    (id: string, changeUnits: number, reason: string = '手動校正庫存') => {
      setMedications((prev) =>
        prev.map((med) => {
          if (med.id !== id) return med;

          const unitsPerPkg = Math.max(1, med.packageSpec.unitsPerPackage || 1);
          const currentTotalUnits =
            (med.stock.packages || 0) * unitsPerPkg + (med.stock.units || 0);
          const newTotalUnits = Math.max(0, currentTotalUnits + changeUnits);

          const newPackages = Math.floor(newTotalUnits / unitsPerPkg);
          const newUnits = newTotalUnits % unitsPerPkg;

          const adj: StockAdjustment = {
            id: `adj-${Date.now()}`,
            timestamp: new Date().toISOString(),
            changeAmount: changeUnits,
            reason,
          };

          const adjustments = [adj, ...(med.adjustments || [])].slice(0, 50); // 最多保留50筆紀錄

          return {
            ...med,
            updatedAt: new Date().toISOString(),
            stock: {
              packages: newPackages,
              units: newUnits,
            },
            adjustments,
          };
        })
      );
    },
    []
  );

  /**
   * 更新忘吃或多吃日數 (影響預估在庫藥量)
   */
  const updateAdherenceDays = useCallback((id: string, missedDays: number, extraDays: number) => {
    setMedications((prev) =>
      prev.map((med) => {
        if (med.id !== id) return med;
        return {
          ...med,
          missedDays: Math.max(0, Math.round(Number(missedDays) || 0)),
          extraDays: Math.max(0, Math.round(Number(extraDays) || 0)),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  /** 匯出 JSON 資料 */
  const exportDataAsJSON = useCallback(() => {
    const exportPayload = {
      app: 'MediTracker',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      medications,
    };
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediTracker_Backup_${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [medications]);

  /** 匯入 JSON 資料 */
  const importDataFromJSON = useCallback((jsonString: string): { success: boolean; message: string; count?: number } => {
    try {
      const parsed = JSON.parse(jsonString);
      let list: Medication[] = [];

      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && Array.isArray(parsed.medications)) {
        list = parsed.medications;
      } else {
        return { success: false, message: '無效的備份檔案格式：未包含藥物清單' };
      }

      if (list.length === 0) {
        return { success: false, message: '備份檔案中沒有藥物資料' };
      }

      // 驗證必要欄位結構
      const validatedList: Medication[] = list.map((item, index) => ({
        id: item.id || `imported-${Date.now()}-${index}`,
        name: item.name || '未命名藥物',
        brandOrGeneric: item.brandOrGeneric || '',
        category: (item.category as MedicationCategory) || 'prescription',
        usageTimeSlots: Array.isArray(item.usageTimeSlots) ? item.usageTimeSlots : ['PC'],
        customUsageNote: item.customUsageNote || '',
        route: item.route || 'oral',
        imageUrl: item.imageUrl || '',
        iconPreset: item.iconPreset || 'pill_prescription',
        colorTheme: item.colorTheme || 'teal',
        packageSpec: {
          unitsPerPackage: Math.max(1, Number(item.packageSpec?.unitsPerPackage) || 1),
          unitName: item.packageSpec?.unitName || '粒',
          packageUnitName: item.packageSpec?.packageUnitName || '盒',
        },
        stock: {
          packages: Math.max(0, Number(item.stock?.packages) || 0),
          units: Math.max(0, Number(item.stock?.units) || 0),
        },
        startDate: item.startDate || formatDate(new Date()),
        dosagePerTime: Math.max(0.1, Number(item.dosagePerTime) || 1),
        frequency: item.frequency || 'QD',
        dailyTimes: Math.max(1, Number(item.dailyTimes) || 1),
        selectedDaysOfWeek: item.selectedDaysOfWeek,
        expiryDate: item.expiryDate || '',
        hospitalOrPharmacy: item.hospitalOrPharmacy || '',
        doctorInstructions: item.doctorInstructions || '',
        storageCondition: item.storageCondition || 'room',
        status: item.status || 'active',
        missedDays: Math.max(0, Number(item.missedDays) || 0),
        extraDays: Math.max(0, Number(item.extraDays) || 0),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doseCheckLogs: item.doseCheckLogs || {},
        adjustments: item.adjustments || [],
      }));

      setMedications(validatedList);
      return {
        success: true,
        message: `成功匯入 ${validatedList.length} 筆藥物資料！`,
        count: validatedList.length,
      };
    } catch (e) {
      return { success: false, message: `解析 JSON 發生錯誤: ${(e as Error).message}` };
    }
  }, []);

  return {
    medications,
    addMedication,
    updateMedication,
    deleteMedication,
    resetToSampleData,
    toggleDoseCheck,
    batchCheckDate,
    adjustStock,
    updateAdherenceDays,
    exportDataAsJSON,
    importDataFromJSON,
  };
}
