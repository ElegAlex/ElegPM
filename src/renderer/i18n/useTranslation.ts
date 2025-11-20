import { useSettingsStore } from '../stores/settingsStore';
import { translations, TranslationKey } from './translations';

export const useTranslation = () => {
  const language = useSettingsStore((state) => state.language);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return { t, language };
};
