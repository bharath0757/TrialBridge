import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'pure-dark' | 'pure-light' | 'white-glow' | 'dark-glow';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  icon: string;
}

export const THEME_CONFIGS: Record<ThemeMode, ThemeConfig> = {
  'pure-dark': {
    id: 'pure-dark',
    name: 'Pure Dark',
    subtitle: 'Primary Black & Secondary White',
    description: 'Deep OLED black background, pure white text, and sleek dark cards.',
    badge: 'OLED Dark',
    icon: 'Moon',
  },
  'pure-light': {
    id: 'pure-light',
    name: 'Pure Light',
    subtitle: 'Primary White & Secondary Black',
    description: 'Crisp clinical white canvas with deep black high-contrast text and clean borders.',
    badge: 'Pure Light',
    icon: 'Sun',
  },
  'white-glow': {
    id: 'white-glow',
    name: 'White Nav Glow',
    subtitle: 'White Side Nav + Glowing Buttons & Reicons',
    description: 'Pristine white sidebar, radiant neon active buttons, and colorful re-icon micro-badges.',
    badge: 'Luminous Nav',
    icon: 'Sparkles',
  },
  'dark-glow': {
    id: 'dark-glow',
    name: 'Dark Cyber Glow',
    subtitle: 'Pure Dark + Glowing Buttons & Reicons',
    description: 'Pure black workspace and pure white text combined with neon glowing re-icons and active aura.',
    badge: 'Cyber Glow',
    icon: 'Zap',
  },
};

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  isWhiteNav: boolean;
  hasGlowingNav: boolean;
  hasReicons: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'trailbridge_theme_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved && (saved in THEME_CONFIGS)) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'pure-light';
  });

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    
    // Toggle Tailwind dark class
    if (mode === 'pure-dark' || mode === 'dark-glow') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore localStorage errors
    }
    applyTheme(mode);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const isDark = theme === 'pure-dark' || theme === 'dark-glow';
  const isWhiteNav = theme === 'white-glow';
  const hasGlowingNav = theme === 'white-glow' || theme === 'dark-glow';
  const hasReicons = theme === 'white-glow' || theme === 'dark-glow';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        isWhiteNav,
        hasGlowingNav,
        hasReicons,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
