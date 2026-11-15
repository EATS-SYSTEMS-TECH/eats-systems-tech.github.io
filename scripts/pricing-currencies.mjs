// Future local-currency defaults. Only the VISIBLE_CURRENCIES are offered in the UI.
export const LOCAL_CURRENCY = Object.freeze({
  en: 'USD', es: 'EUR', fr: 'EUR', de: 'EUR', he: 'ILS', nl: 'EUR', it: 'EUR', pt: 'EUR',
  pl: 'PLN', no: 'NOK', cs: 'CZK', ru: 'RUB', uk: 'UAH', tr: 'TRY', ar: 'AED',
  hi: 'INR', bn: 'INR', mr: 'INR', te: 'INR', 'zh-Hans': 'CNY', 'zh-Hant': 'TWD',
  ja: 'JPY', ko: 'KRW', da: 'DKK', sv: 'SEK', el: 'EUR', ro: 'RON', hr: 'EUR',
  fi: 'EUR', bg: 'EUR', sr: 'RSD', sk: 'EUR', sl: 'EUR', id: 'IDR', th: 'THB',
  vi: 'VND', ms: 'MYR', fil: 'PHP', hu: 'HUF',
});
// Owner decision 2026-11-15: USD only for now; add 'ILS' back to show the selector.
export const VISIBLE_CURRENCIES = Object.freeze(['USD']);
export const defaultPricingCurrency = locale => VISIBLE_CURRENCIES.includes('ILS') && locale === 'he' ? 'ILS' : 'USD';
