import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Palette, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeControls: React.FC = () => {
  const { mode, toggleMode, setTheme, availableThemes, colorScheme } = useTheme();
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const themeSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeSelectorRef.current && !themeSelectorRef.current.contains(event.target as Node)) {
        setIsThemeSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Theme Selector - Shows only color schemes */}
      <div className="relative" ref={themeSelectorRef} style={{ minWidth: '140px' }}>
        <button
          onClick={() => setIsThemeSelectorOpen(!isThemeSelectorOpen)}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all duration-200 hover:bg-elevation-2 text-left"
          style={{ 
            backgroundColor: 'var(--elevation-1)',
            border: '1px solid var(--border-subtle)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
            e.currentTarget.style.borderColor = 'var(--border-default)';
          }}
          onMouseLeave={(e) => {
            if (!isThemeSelectorOpen) {
              e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Palette className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {colorScheme.charAt(0).toUpperCase() + colorScheme.slice(1)}
            </span>
          </div>
          {isThemeSelectorOpen ? (
            <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          )}
        </button>

        {/* Theme Dropdown - Only 7 color schemes */}
        {isThemeSelectorOpen && (
          <div 
            className="absolute top-full left-0 mt-2 rounded-lg border shadow-xl z-50"
            style={{
              backgroundColor: 'var(--elevation-4)',
              borderColor: 'var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
              minWidth: '180px',
              width: '100%'
            }}
          >
            <div className="p-2">
              {['neutral', 'emerald', 'monochrome', 'blue', 'plum'].map((scheme) => {
                // Get any version of the theme (prefer light, fallback to dark)
                const themeForScheme = availableThemes.find(t => t.colorScheme === scheme && t.mode === 'light') 
                  || availableThemes.find(t => t.colorScheme === scheme);
                if (!themeForScheme) return null;
                
                const isActive = colorScheme === scheme;
                const schemeDisplayNames: Record<string, string> = {
                  neutral: 'Neutral',
                  emerald: 'Emerald',
                  monochrome: 'Monochrome',
                  blue: 'Cool Blue',
                  plum: 'Plum & Sand',
                };
                
                // Determine which theme to apply based on scheme availability
                const getThemeToApply = () => {
                  // Check if both light and dark exist
                  const hasLight = availableThemes.some(t => t.colorScheme === scheme && t.mode === 'light');
                  const hasDark = availableThemes.some(t => t.colorScheme === scheme && t.mode === 'dark');
                  
                  if (hasLight && hasDark) {
                    // Both exist, use current mode
                    return `${mode}-${scheme}` as any;
                  } else if (hasLight) {
                    // Only light exists
                    return `light-${scheme}` as any;
                  } else if (hasDark) {
                    // Only dark exists
                    return `dark-${scheme}` as any;
                  }
                  return themeForScheme.id;
                };
                
                return (
                  <button
                    key={scheme}
                    onClick={() => {
                      const newTheme = getThemeToApply();
                      setTheme(newTheme);
                      setIsThemeSelectorOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors mb-0.5"
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
                    <span className="flex-1 text-left">{schemeDisplayNames[scheme]}</span>
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

      {/* Light/Dark Mode Toggle - Compact with icons only */}
      <button
        onClick={toggleMode}
        className="flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:bg-elevation-2"
        style={{ 
          backgroundColor: 'var(--elevation-1)',
          border: '1px solid var(--border-subtle)'
        }}
        title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
          e.currentTarget.style.borderColor = 'var(--border-default)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }}
      >
        {mode === 'dark' ? (
          <Sun className="h-4 w-4" style={{ color: 'var(--text-primary)' }} />
        ) : (
          <Moon className="h-4 w-4" style={{ color: 'var(--text-primary)' }} />
        )}
      </button>
    </div>
  );
};

