import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ResolvedTheme, highContrast: boolean) {
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark', 'high-contrast');
  
  // Add new theme class
  root.classList.add(theme);
  
  // Add high contrast if enabled
  if (highContrast) {
    root.classList.add('high-contrast');
  }
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#1e40af');
  }
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      highContrast: false,

      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        set({ theme, resolvedTheme });
        applyTheme(resolvedTheme, get().highContrast);
      },

      setHighContrast: (enabled: boolean) => {
        set({ highContrast: enabled });
        applyTheme(get().resolvedTheme, enabled);
      },
    }),
    {
      name: 'fleetguard-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolvedTheme = state.theme === 'system' ? getSystemTheme() : state.theme;
          state.resolvedTheme = resolvedTheme;
          applyTheme(resolvedTheme, state.highContrast);
        }
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useTheme.getState();
    if (state.theme === 'system') {
      const resolvedTheme = e.matches ? 'dark' : 'light';
      useTheme.setState({ resolvedTheme });
      applyTheme(resolvedTheme, state.highContrast);
    }
  });
}
