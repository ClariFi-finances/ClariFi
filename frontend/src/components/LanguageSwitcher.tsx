import { useI18n } from '@/hooks/useI18n'
import { Language } from '@/utils/i18n'
import './LanguageSwitcher.css'

export function LanguageSwitcher() {
  const { language, changeLanguage, getAllLanguages, getLanguageLabel } = useI18n()

  return (
    <div className="language-switcher">
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value as Language)}
        className="language-select"
      >
        {getAllLanguages().map((lang: Language) => (
          <option key={lang} value={lang}>
            {getLanguageLabel(lang)}
          </option>
        ))}
      </select>
    </div>
  )
}

