import React from 'react';
import { Sun, Moon, Monitor, Eye } from 'lucide-react';
import { useTheme, Theme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';

interface ThemeSelectorProps {
  compact?: boolean;
}

export function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const { theme, setTheme, highContrast, setHighContrast } = useTheme();
  const { t } = useI18n();

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'system', icon: <Monitor className="w-4 h-4" />, label: t('theme.system') },
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: t('theme.light') },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: t('theme.dark') },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
        {themes.map(({ value, icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
              ${theme === value 
                ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }
            `}
            aria-label={label}
            aria-pressed={theme === value}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          {t('settings.theme')}
        </label>
        <div className="flex items-center gap-2">
          {themes.map(({ value, icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${theme === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500'
                }
              `}
              aria-pressed={theme === value}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          role="switch"
          aria-checked={highContrast}
          onClick={() => setHighContrast(!highContrast)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${highContrast ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${highContrast ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
          <Eye className="w-4 h-4" />
          <span>High Contrast Mode</span>
        </div>
      </div>
    </div>
  );
}
