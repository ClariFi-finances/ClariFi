import ptBR from '@/translations/pt-BR.json'
import enUS from '@/translations/en-US.json'

export type Language = 'pt-BR' | 'en-US'

const translations: Record<Language, typeof ptBR> = {
  'pt-BR': ptBR,
  'en-US': enUS,
}

export class I18n {
  private static currentLanguage: Language = 'en-US'

  static setLanguage(lang: Language) {
    this.currentLanguage = lang
    localStorage.setItem('language', lang)
  }

  static getLanguage(): Language {
    return this.currentLanguage
  }

  static initLanguage() {
    const savedLanguage = localStorage.getItem('language') as Language | null
    if (savedLanguage && (savedLanguage === 'pt-BR' || savedLanguage === 'en-US')) {
      this.currentLanguage = savedLanguage
    }
  }

  static t(key: string, options?: Record<string, string | number>, defaultValue?: string): string {
    const keys = key.split('.')
    let value: unknown = translations[this.currentLanguage] as Record<string, unknown>

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return defaultValue || key
      }
    }

    let text = typeof value === 'string' ? value : defaultValue || key

    if (options && typeof text === 'string') {
      for (const [k, v] of Object.entries(options)) {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v))
      }
    }

    return text
  }

  static getTranslations() {
    return translations[this.currentLanguage]
  }

  static getAllLanguages(): Language[] {
    return ['pt-BR', 'en-US']
  }

  static getLanguageLabel(lang: Language): string {
    return lang === 'pt-BR' ? 'Português' : 'English'
  }
}
