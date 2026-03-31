export type Currency = 'ZAR' | 'USD' | 'GBP' | 'EUR' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'INR' | 'JPY' | 'NZD' | 'SEK' | 'NOK' | 'DKK' | 'MXN' | 'BRL' | 'AED' | 'SAR' | 'SGD' | 'HKD' | 'KRW' | 'TRY' | 'PLN' | 'THB' | 'IDR' | 'MYR' | 'PHP' | 'CZK' | 'HUF' | 'ILS' | 'CLP' | 'ARS' | 'COP' | 'PEN' | 'NGN' | 'EGP' | 'KES' | 'GHS';

export interface CurrencyOption {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso', locale: 'es-AR' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso', locale: 'es-CL' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso', locale: 'es-CO' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', locale: 'cs-CZ' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', locale: 'en-GH' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'zh-HK' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', locale: 'hu-HU' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', locale: 'he-IL' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', locale: 'es-PE' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', locale: 'ar-SA' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
];

export function getCurrencyInfo(code: Currency): CurrencyOption {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

export function formatCurrency(amount: number, currencyCode: Currency = 'ZAR'): string {
  const currency = getCurrencyInfo(currencyCode);

  try {
    const formatted = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${currency.symbol}${formatted}`;
  } catch (error) {
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
}
