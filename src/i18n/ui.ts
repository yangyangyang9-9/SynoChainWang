import en from './en.json';
import zh from './zh.json';
import es from './es.json';
import ja from './ja.json';
import de from './de.json';
import fr from './fr.json';
import ko from './ko.json';
import pt from './pt.json';

export const languages = {
  en: { label: 'English', flag: '🇺🇸', dir: 'ltr' },
  zh: { label: '中文', flag: '🇨🇳', dir: 'ltr' },
  es: { label: 'Español', flag: '🇪🇸', dir: 'ltr' },
  ja: { label: '日本語', flag: '🇯🇵', dir: 'ltr' },
  de: { label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  fr: { label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  ko: { label: '한국어', flag: '🇰🇷', dir: 'ltr' },
  pt: { label: 'Português', flag: '🇵🇹', dir: 'ltr' },
};

export const defaultLang = 'en';

export const translations = { en, zh, es, ja, de, fr, ko, pt };

// 浏览器语言到支持语言的映射
const browserLangMap: Record<string, Lang> = {
  'zh': 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 'zh-hk': 'zh',
  'es': 'es', 'es-es': 'es', 'es-mx': 'es', 'es-ar': 'es',
  'ja': 'ja', 'ja-jp': 'ja',
  'de': 'de', 'de-de': 'de', 'de-at': 'de', 'de-ch': 'de',
  'fr': 'fr', 'fr-fr': 'fr', 'fr-ca': 'fr', 'fr-be': 'fr',
  'ko': 'ko', 'ko-kr': 'ko',
  'pt': 'pt', 'pt-pt': 'pt', 'pt-br': 'pt',
  'en': 'en', 'en-us': 'en', 'en-gb': 'en', 'en-au': 'en', 'en-ca': 'en',
};

// 从浏览器 navigator.language 检测最佳匹配语言
export function detectBrowserLanguage(): Lang {
  if (typeof navigator === 'undefined') return defaultLang;

  const langs = navigator.languages || [navigator.language];
  for (const browserLang of langs) {
    const lower = browserLang.toLowerCase();
    // 精确匹配
    if (lower in browserLangMap) return browserLangMap[lower];
    // 前缀匹配（如 "zh-CN" → "zh"）
    const prefix = lower.split('-')[0];
    if (prefix in browserLangMap) return browserLangMap[prefix];
  }
  return defaultLang;
}

// 获取存储的语言偏好
export function getStoredLang(): Lang | null {
  if (typeof localStorage === 'undefined') return null;
  const stored = localStorage.getItem('synochain-lang');
  if (stored && stored in languages) return stored as Lang;
  return null;
}

// 保存语言偏好
export function storeLang(lang: Lang): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('synochain-lang', lang);
}

// 是否需要重定向到用户语言（首次访问且未手动选择语言时）
export function shouldRedirect(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return !localStorage.getItem('synochain-lang');
}

export type Lang = keyof typeof languages;

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: string): string {
    const keys = key.split('.');
    let value: any = translations[lang];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // 回退到英语
        value = translations[defaultLang];
        for (const kk of keys) {
          value = value?.[kk];
          if (value === undefined) return key;
        }
        return value;
      }
    }
    return typeof value === 'string' ? value : key;
  };
}

export function getLocalizedPath(path: string, lang: Lang): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return cleanPath;
  return `/${lang}${cleanPath}`;
}
