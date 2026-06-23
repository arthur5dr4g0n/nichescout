import { useTranslation } from 'react-i18next'

// Returns the metric-tooltip glossary in the active language.
// Keeps the `METRICS.bsr` call sites unchanged across components.
export function useMetrics() {
  const { t } = useTranslation()
  return {
    asin: t('metrics.asin'),
    price: t('metrics.price'),
    bsr: t('metrics.bsr'),
    sales: t('metrics.sales'),
    revenue: t('metrics.revenue'),
    reviews: t('metrics.reviews'),
    rating: t('metrics.rating'),
    sellers: t('metrics.sellers'),
    fba: t('metrics.fba'),
    niche: t('metrics.niche'),
    volume: t('metrics.volume'),
    competition: t('metrics.competition'),
    cpc: t('metrics.cpc'),
    trend: t('metrics.trend'),
  }
}
