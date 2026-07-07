import { useState, useRef, useEffect } from 'react';
import { languages, defaultLang } from '../../i18n/ui';

interface Props {
  lang: string;
  currentPath: string;
}

export default function LanguageSwitcher({ lang, currentPath }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 构建切换语言的 URL
  function buildLangUrl(targetLang: string): string {
    let path = currentPath;
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0 && segments[0] in languages) {
      segments.shift();
      path = '/' + segments.join('/');
    }
    if (path === '/') path = '';
    return targetLang === defaultLang ? `/${path}` : `/${targetLang}${path}`;
  }

  // 用户手动选择语言时保存偏好
  function handleLangSelect(code: string) {
    try {
      localStorage.setItem('synochain-lang', code);
    } catch (e) {
      // localStorage 不可用时静默失败
    }
    setOpen(false);
  }

  const current = languages[lang as keyof typeof languages] || languages.en;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50"
        aria-label="Switch language"
      >
        <span className="text-base">{current.flag}</span>
        <span className="hidden sm:inline">{lang.toUpperCase()}</span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-lg">
          {Object.entries(languages).map(([code, info]) => (
            <a
              key={code}
              href={buildLangUrl(code)}
              onClick={() => handleLangSelect(code)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-medical-50 ${
                lang === code ? 'bg-medical-50 font-medium text-medical-700' : 'text-ink-700'
              }`}
            >
              <span className="text-base">{info.flag}</span>
              <span>{info.label}</span>
              {lang === code && (
                <svg className="ml-auto h-4 w-4 text-medical-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
