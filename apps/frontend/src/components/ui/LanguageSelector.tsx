import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronUp, ChevronDown } from 'lucide-react';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ko' | 'ar';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

interface LanguageSelectorProps {
  /** Current selected language */
  currentLanguage?: Language;
  /** Callback when language changes */
  onLanguageChange?: (language: Language) => void;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Icon only mode - shows just the globe icon */
  iconOnly?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  currentLanguage = 'en',
  onLanguageChange,
  compact = false,
  iconOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  const handleLanguageSelect = (lang: Language) => {
    onLanguageChange?.(lang);
    setIsOpen(false);
    // TODO: Implement actual language switching logic
    // This would typically involve:
    // 1. Loading translation files
    // 2. Updating i18n context
    // 3. Persisting preference to localStorage
  };

  if (iconOnly) {
    return (
      <div className="relative flex items-center justify-center" ref={selectorRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="transition-colors flex items-center justify-center"
          aria-label="Select language"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <Globe className="w-5 h-5" />
        </button>

        {/* Language Dropdown */}
        {isOpen && (
          <div 
            className="absolute top-full right-0 mt-2 rounded-lg border shadow-xl z-50 max-h-[300px] overflow-y-auto"
            style={{
              backgroundColor: 'var(--elevation-4)',
              borderColor: 'var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
              minWidth: '200px',
              width: 'max-content'
            }}
          >
            <div className="p-2">
              {languages.map((lang) => {
                const isActive = lang.code === currentLanguage;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs transition-colors mb-0.5 text-left"
                    style={{
                      backgroundColor: isActive ? 'var(--accent-primary-glow)' : 'transparent',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--elevation-3)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{lang.nativeName}</span>
                      <span className="text-[10px] opacity-70">{lang.name}</span>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={selectorRef} style={{ minWidth: compact ? '80px' : '120px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all duration-200 hover:bg-elevation-2"
        style={{ 
          backgroundColor: 'var(--elevation-1)',
          border: '1px solid var(--border-subtle)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
          e.currentTarget.style.borderColor = 'var(--border-default)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }
        }}
        aria-label="Select language"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
          {!compact && (
            <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {currentLang.code.toUpperCase()}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        )}
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 rounded-lg border shadow-xl z-50 max-h-[300px] overflow-y-auto"
          style={{
            backgroundColor: 'var(--elevation-4)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-xl)',
            minWidth: '200px',
            width: 'max-content'
          }}
        >
          <div className="p-2">
            {languages.map((lang) => {
              const isActive = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs transition-colors mb-0.5 text-left"
                  style={{
                    backgroundColor: isActive ? 'var(--accent-primary-glow)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--elevation-3)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-[10px] opacity-70">{lang.name}</span>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

