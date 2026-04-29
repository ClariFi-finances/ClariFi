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

  static t(key: string, defaultValue?: string): string {
    const keys = key.split('.')
    let value: any = translations[this.currentLanguage]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return defaultValue || key
      }
    }

    return typeof value === 'string' ? value : defaultValue || key
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

