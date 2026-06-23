import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

const LANG_KEY = 'marketmax.lang'
export const getLang = () => localStorage.getItem(LANG_KEY) || 'fr'

export function setLang(lng) {
  localStorage.setItem(LANG_KEY, lng)
  i18n.changeLanguage(lng)
  document.documentElement.lang = lng
}

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: getLang(), // default French
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = getLang()

export default i18n
