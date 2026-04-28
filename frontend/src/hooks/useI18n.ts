import { useState, useEffect, useCallback } from 'react'
import {I18n, type Language} from "@/utils/i18n.ts";

// Create event system for language changes
const languageChangeListeners: Set<() => void> = new Set()

export function notifyLanguageChange() {
  languageChangeListeners.forEach(listener => listener())
}

export function useI18n() {
  const [language, setLanguage] = useState<Language>(() => {
    I18n.initLanguage()
    return I18n.getLanguage()
  })

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(I18n.getLanguage())
    }

    languageChangeListeners.add(handleLanguageChange)
    return () => {
      languageChangeListeners.delete(handleLanguageChange)
    }
  }, [])

  const t = useCallback((key: string, defaultValue?: string) => {
    return I18n.t(key, defaultValue)
  }, [language])

  const changeLanguage = useCallback((lang: Language) => {
    I18n.setLanguage(lang)
    notifyLanguageChange()
  }, [])

  const getAllLanguages = useCallback(() => {
    return I18n.getAllLanguages()
  }, [])

  const getLanguageLabel = useCallback((lang: Language) => {
    return I18n.getLanguageLabel(lang)
  }, [])

  return {
    t,
    language,
    changeLanguage,
    getAllLanguages,
    getLanguageLabel,
  }
}

