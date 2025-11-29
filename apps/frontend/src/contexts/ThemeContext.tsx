import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ColorScheme = 'orange' | 'violet' | 'emerald' | 'minimal' | 'blue';
export type ThemeMode = 'light' | 'dark';
export type Theme = `${ThemeMode}-${ColorScheme}`;

export interface ThemeInfo {
  id: Theme;
  name: string;
  mode: ThemeMode;
  colorScheme: ColorScheme;
  description?: string;
}

export const AVAILABLE_THEMES: ThemeInfo[] = [
  { id: 'light-orange', name: 'Light (Orange)', mode: 'light', colorScheme: 'orange', description: 'Classic orange theme' },
  { id: 'dark-orange', name: 'Dark (Orange)', mode: 'dark', colorScheme: 'orange', description: 'Classic orange theme' },
  { id: 'light-violet', name: 'Light (Violet Pro)', mode: 'light', colorScheme: 'violet', description: 'Violet pro/dev theme' },
  { id: 'dark-violet', name: 'Dark (Violet Pro)', mode: 'dark', colorScheme: 'violet', description: 'Violet pro/dev theme' },
  { id: 'light-emerald', name: 'Light (Emerald)', mode: 'light', colorScheme: 'emerald', description: 'Security/infra theme' },
  { id: 'dark-emerald', name: 'Dark (Emerald)', mode: 'dark', colorScheme: 'emerald', description: 'Security/infra theme' },
  { id: 'light-minimal', name: 'Light (Minimal)', mode: 'light', colorScheme: 'minimal', description: 'Minimal grayscale + subtle accent' },
  { id: 'dark-minimal', name: 'Dark (Minimal)', mode: 'dark', colorScheme: 'minimal', description: 'Minimal grayscale + subtle accent' },
  { id: 'light-blue', name: 'Light (Cool Blue)', mode: 'light', colorScheme: 'blue', description: 'Cool blue cloud theme' },
  { id: 'dark-blue', name: 'Dark (Cool Blue)', mode: 'dark', colorScheme: 'blue', description: 'Cool blue cloud theme' },
];

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  colorScheme: ColorScheme;
  themeInfo: ThemeInfo;
  setTheme: (theme: Theme) => void;
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleMode: () => void;
  availableThemes: ThemeInfo[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const DEFAULT_THEME: Theme = 'dark-orange';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved && AVAILABLE_THEMES.some(t => t.id === saved)) {
        return saved;
      }
      // Check system preference and default to orange
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark-orange' : 'light-orange';
    }
    return DEFAULT_THEME;
  });

  const themeInfo = AVAILABLE_THEMES.find(t => t.id === theme) || AVAILABLE_THEMES[0];
  const mode = themeInfo.mode;
  const colorScheme = themeInfo.colorScheme;

  // Initialize theme on mount and update on change
  useEffect(() => {
    const root = window.document.documentElement;
    // Set data-theme attribute with combined theme (e.g., "dark-violet")
    root.setAttribute('data-theme', theme);
    // Also set separate attributes for easier CSS targeting
    root.setAttribute('data-theme-mode', mode);
    root.setAttribute('data-theme-scheme', colorScheme);
    // Persist theme preference
    localStorage.setItem('theme', theme);
  }, [theme, mode, colorScheme]);

  // Initialize theme immediately on mount (before first render to prevent flash)
  useEffect(() => {
    const root = window.document.documentElement;
    const saved = localStorage.getItem('theme') as Theme;
    const initialTheme = (saved && AVAILABLE_THEMES.some(t => t.id === saved))
      ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-orange' : 'light-orange');
    root.setAttribute('data-theme', initialTheme);
    const initialInfo = AVAILABLE_THEMES.find(t => t.id === initialTheme) || AVAILABLE_THEMES[0];
    root.setAttribute('data-theme-mode', initialInfo.mode);
    root.setAttribute('data-theme-scheme', initialInfo.colorScheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setMode = (newMode: ThemeMode) => {
    const newTheme = `${newMode}-${colorScheme}` as Theme;
    setThemeState(newTheme);
  };

  const setColorScheme = (newScheme: ColorScheme) => {
    const newTheme = `${mode}-${newScheme}` as Theme;
    setThemeState(newTheme);
  };

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      mode, 
      colorScheme, 
      themeInfo,
      setTheme, 
      setMode, 
      setColorScheme,
      toggleMode,
      availableThemes: AVAILABLE_THEMES,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

