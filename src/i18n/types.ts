export type Language = 'zh-TW' | 'zh-CN' | 'en' | 'ja';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'zh-TW', label: '繁體中文 (Traditional Chinese)', nativeLabel: '繁體中文', flag: '🇹🇼' },
  { code: 'zh-CN', label: '简体中文 (Simplified Chinese)', nativeLabel: '简体中文', flag: '🇨🇳' },
  { code: 'en', label: 'English (US)', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語 (Japanese)', nativeLabel: '日本語', flag: '🇯🇵' },
];
