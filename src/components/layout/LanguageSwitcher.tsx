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

  // 构建切换语言的 URL，带回退机制
  function buildLangUrl(targetLang: string): string {
    let path = currentPath;
    const segments = path.split('/').filter(Boolean);
    
    // 移除现有的语言前缀
    if (segments.length > 0 && segments[0] in languages) {
      segments.shift();
      path = '/' + segments.join('/');
    }
    
    // 确保路径不为空
    if (path === '/') path = '';
    
    // 如果是英文，直接返回路径；否则添加语言前缀
    if (targetLang === defaultLang) {
      return `/${path}`;
    }
    
    // 对于非英文，检查是否有二级路径（如 /zh/conditions/sinusitis）
    // 如果有且不是索引页，添加回退机制
    if (path && !isIndexPage(path)) {
      // 返回带语言前缀的路径，但如果该路径不存在会404
      // 服务器端会处理回退
      return `/${targetLang}${path}`;
    }
    
    return `/${targetLang}${path}`;
  }
  
  // 判断是否为索引页
  function isIndexPage(path: string): boolean {
    const cleanPath = path.replace(/^\/|\/$/g, '');
    // 如果路径为空或只有一个段且没有文件扩展名，视为索引页
    const parts = cleanPath.split('/');
    return parts.length <= 1 || (parts.length === 2 && parts[1] === '');
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
