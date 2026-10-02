import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type FontSizeOption = 'normal' | 'large' | 'extra-large';
export type FontFamilyOption = 'iansui' | 'zen-maru' | 'noto-sans' | 'noto-serif' | 'system';

export interface FontOptionDef {
  id: FontFamilyOption;
  name: string;
  nameEn: string;
  previewText: string;
  fontFamilyCSS: string;
  badge: string;
}

export const FONT_OPTIONS: FontOptionDef[] = [
  {
    id: 'iansui',
    name: '芫荽字體 (Iansui)',
    nameEn: 'Iansui Hand-drawn',
    previewText: '晴空與星光，守護每日健康服藥',
    fontFamilyCSS: "'Iansui', 'PingFang TC', 'Microsoft JhengHei', sans-serif",
    badge: '推薦・手寫溫度',
  },
  {
    id: 'zen-maru',
    name: '源泉圓體 (Zen Maru)',
    nameEn: 'Zen Maru Gothic',
    previewText: '晴空與星光，守護每日健康服藥',
    fontFamilyCSS: "'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'PingFang TC', sans-serif",
    badge: '童趣・溫柔圓角',
  },
  {
    id: 'noto-sans',
    name: '思源黑體 (Noto Sans)',
    nameEn: 'Noto Sans TC',
    previewText: '晴空與星光，守護每日健康服藥',
    fontFamilyCSS: "'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    badge: '現代・清晰易讀',
  },
  {
    id: 'noto-serif',
    name: '思源宋體 (Noto Serif)',
    nameEn: 'Noto Serif TC',
    previewText: '晴空與星光，守護每日健康服藥',
    fontFamilyCSS: "'Noto Serif TC', 'Songti TC', 'SimSun', serif",
    badge: '優雅・經典襯線',
  },
  {
    id: 'system',
    name: '系統預設字體',
    nameEn: 'System Default',
    previewText: '晴空與星光，守護每日健康服藥',
    fontFamilyCSS: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang TC', sans-serif",
    badge: '原生・極致效能',
  },
];

interface PreferencesContextType {
  fontSize: FontSizeOption;
  fontFamily: FontFamilyOption;
  setFontSize: (size: FontSizeOption) => void;
  setFontFamily: (font: FontFamilyOption) => void;
  currentFontDef: FontOptionDef;
}

const STORAGE_PREFS_KEY = 'MEDITRACKER_PREFS_V1';

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFS_KEY}_FONT_SIZE`) as FontSizeOption;
      if (saved && (saved === 'normal' || saved === 'large' || saved === 'extra-large')) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'normal';
  });

  const [fontFamily, setFontFamilyState] = useState<FontFamilyOption>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFS_KEY}_FONT_FAMILY`) as FontFamilyOption;
      if (
        saved &&
        (saved === 'iansui' ||
          saved === 'zen-maru' ||
          saved === 'noto-sans' ||
          saved === 'noto-serif' ||
          saved === 'system')
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'iansui';
  });

  const setFontSize = useCallback((size: FontSizeOption) => {
    setFontSizeState(size);
    try {
      localStorage.setItem(`${STORAGE_PREFS_KEY}_FONT_SIZE`, size);
    } catch {
      // ignore
    }
  }, []);

  const setFontFamily = useCallback((font: FontFamilyOption) => {
    setFontFamilyState(font);
    try {
      localStorage.setItem(`${STORAGE_PREFS_KEY}_FONT_FAMILY`, font);
    } catch {
      // ignore
    }
  }, []);

  const currentFontDef =
    FONT_OPTIONS.find((f) => f.id === fontFamily) || FONT_OPTIONS[0];

  // 套用根層級樣式 (CSS 變數與根字級比例)
  useEffect(() => {
    const root = document.documentElement;

    // 套用字型
    root.style.setProperty('--app-font-family', currentFontDef.fontFamilyCSS);
    document.body.style.fontFamily = currentFontDef.fontFamilyCSS;

    // 套用字型大小比例
    if (fontSize === 'large') {
      root.style.fontSize = '17.5px';
      root.classList.add('font-size-large');
      root.classList.remove('font-size-extra-large');
    } else if (fontSize === 'extra-large') {
      root.style.fontSize = '19px';
      root.classList.add('font-size-extra-large');
      root.classList.remove('font-size-large');
    } else {
      root.style.fontSize = '16px';
      root.classList.remove('font-size-large', 'font-size-extra-large');
    }
  }, [fontSize, currentFontDef]);

  return (
    <PreferencesContext.Provider
      value={{
        fontSize,
        fontFamily,
        setFontSize,
        setFontFamily,
        currentFontDef,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
