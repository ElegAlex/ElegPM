import React from 'react';
import { Settings, Globe, Palette, Sun, Moon } from 'lucide-react';
import { useSettingsStore, Language, Theme } from '../stores/settingsStore';
import { useTranslation } from '../i18n/useTranslation';

export const SettingsView: React.FC = () => {
  const { language, theme, setLanguage, setTheme } = useSettingsStore();
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-gray-700 dark:text-gray-300" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settingsTitle')}</h1>
      </div>

      {/* Settings Sections */}
      <div className="max-w-3xl space-y-6">
        {/* Language Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('language')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('languageDescription')}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setLanguage('fr')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                language === 'fr'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🇫🇷</span>
                <span className={`font-medium ${
                  language === 'fr'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('french')}
                </span>
              </div>
            </button>

            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                language === 'en'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🇬🇧</span>
                <span className={`font-medium ${
                  language === 'en'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('english')}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Theme Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('appearance')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('themeDescription')}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Sun className={`w-5 h-5 ${
                  theme === 'light'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
                <span className={`font-medium ${
                  theme === 'light'
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('lightMode')}
                </span>
              </div>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Moon className={`w-5 h-5 ${
                  theme === 'dark'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
                <span className={`font-medium ${
                  theme === 'dark'
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('darkMode')}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            ℹ️ {t('settingsSaved')}
          </p>
        </div>
      </div>
    </div>
  );
};
