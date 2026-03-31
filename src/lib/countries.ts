export interface Country {
  name: string;
  iso2: string;
  currency: string;
  dialCode?: string;
  languages?: string[];
}

export const COUNTRY_DATA: Country[] = [
  // North America
  { name: 'United States', iso2: 'US', currency: 'USD', dialCode: '+1', languages: ['English'] },
  { name: 'Canada', iso2: 'CA', currency: 'CAD', dialCode: '+1', languages: ['English', 'French'] },
  { name: 'Mexico', iso2: 'MX', currency: 'MXN', dialCode: '+52', languages: ['Spanish'] },

  // South America
  { name: 'Argentina', iso2: 'AR', currency: 'ARS', dialCode: '+54', languages: ['Spanish'] },
  { name: 'Brazil', iso2: 'BR', currency: 'BRL', dialCode: '+55', languages: ['Portuguese'] },
  { name: 'Chile', iso2: 'CL', currency: 'CLP', dialCode: '+56', languages: ['Spanish'] },
  { name: 'Colombia', iso2: 'CO', currency: 'COP', dialCode: '+57', languages: ['Spanish'] },
  { name: 'Peru', iso2: 'PE', currency: 'PEN', dialCode: '+51', languages: ['Spanish'] },

  // Europe
  { name: 'United Kingdom', iso2: 'GB', currency: 'GBP', dialCode: '+44', languages: ['English'] },
  { name: 'Germany', iso2: 'DE', currency: 'EUR', dialCode: '+49', languages: ['German'] },
  { name: 'France', iso2: 'FR', currency: 'EUR', dialCode: '+33', languages: ['French'] },
  { name: 'Italy', iso2: 'IT', currency: 'EUR', dialCode: '+39', languages: ['Italian'] },
  { name: 'Spain', iso2: 'ES', currency: 'EUR', dialCode: '+34', languages: ['Spanish'] },
  { name: 'Netherlands', iso2: 'NL', currency: 'EUR', dialCode: '+31', languages: ['Dutch'] },
  { name: 'Belgium', iso2: 'BE', currency: 'EUR', dialCode: '+32', languages: ['Dutch', 'French'] },
  { name: 'Switzerland', iso2: 'CH', currency: 'CHF', dialCode: '+41', languages: ['German', 'French', 'Italian'] },
  { name: 'Sweden', iso2: 'SE', currency: 'SEK', dialCode: '+46', languages: ['Swedish'] },
  { name: 'Norway', iso2: 'NO', currency: 'NOK', dialCode: '+47', languages: ['Norwegian'] },
  { name: 'Denmark', iso2: 'DK', currency: 'DKK', dialCode: '+45', languages: ['Danish'] },
  { name: 'Poland', iso2: 'PL', currency: 'PLN', dialCode: '+48', languages: ['Polish'] },
  { name: 'Czech Republic', iso2: 'CZ', currency: 'CZK', dialCode: '+420', languages: ['Czech'] },
  { name: 'Hungary', iso2: 'HU', currency: 'HUF', dialCode: '+36', languages: ['Hungarian'] },
  { name: 'Austria', iso2: 'AT', currency: 'EUR', dialCode: '+43', languages: ['German'] },
  { name: 'Portugal', iso2: 'PT', currency: 'EUR', dialCode: '+351', languages: ['Portuguese'] },
  { name: 'Greece', iso2: 'GR', currency: 'EUR', dialCode: '+30', languages: ['Greek'] },
  { name: 'Ireland', iso2: 'IE', currency: 'EUR', dialCode: '+353', languages: ['English', 'Irish'] },
  { name: 'Finland', iso2: 'FI', currency: 'EUR', dialCode: '+358', languages: ['Finnish'] },
  { name: 'Romania', iso2: 'RO', currency: 'EUR', dialCode: '+40', languages: ['Romanian'] },

  // Middle East
  { name: 'United Arab Emirates', iso2: 'AE', currency: 'AED', dialCode: '+971', languages: ['Arabic'] },
  { name: 'Saudi Arabia', iso2: 'SA', currency: 'SAR', dialCode: '+966', languages: ['Arabic'] },
  { name: 'Israel', iso2: 'IL', currency: 'ILS', dialCode: '+972', languages: ['Hebrew', 'Arabic'] },
  { name: 'Turkey', iso2: 'TR', currency: 'TRY', dialCode: '+90', languages: ['Turkish'] },
  { name: 'Egypt', iso2: 'EG', currency: 'EGP', dialCode: '+20', languages: ['Arabic'] },

  // Africa
  { name: 'South Africa', iso2: 'ZA', currency: 'ZAR', dialCode: '+27', languages: ['English', 'Afrikaans'] },
  { name: 'Nigeria', iso2: 'NG', currency: 'NGN', dialCode: '+234', languages: ['English'] },
  { name: 'Kenya', iso2: 'KE', currency: 'KES', dialCode: '+254', languages: ['English', 'Swahili'] },
  { name: 'Ghana', iso2: 'GH', currency: 'GHS', dialCode: '+233', languages: ['English'] },
  { name: 'Morocco', iso2: 'MA', currency: 'MAD', dialCode: '+212', languages: ['Arabic', 'French'] },

  // Asia
  { name: 'China', iso2: 'CN', currency: 'CNY', dialCode: '+86', languages: ['Chinese'] },
  { name: 'India', iso2: 'IN', currency: 'INR', dialCode: '+91', languages: ['Hindi', 'English'] },
  { name: 'Japan', iso2: 'JP', currency: 'JPY', dialCode: '+81', languages: ['Japanese'] },
  { name: 'South Korea', iso2: 'KR', currency: 'KRW', dialCode: '+82', languages: ['Korean'] },
  { name: 'Singapore', iso2: 'SG', currency: 'SGD', dialCode: '+65', languages: ['English', 'Malay', 'Chinese'] },
  { name: 'Malaysia', iso2: 'MY', currency: 'MYR', dialCode: '+60', languages: ['Malay', 'English'] },
  { name: 'Indonesia', iso2: 'ID', currency: 'IDR', dialCode: '+62', languages: ['Indonesian'] },
  { name: 'Philippines', iso2: 'PH', currency: 'PHP', dialCode: '+63', languages: ['Filipino', 'English'] },
  { name: 'Thailand', iso2: 'TH', currency: 'THB', dialCode: '+66', languages: ['Thai'] },
  { name: 'Vietnam', iso2: 'VN', currency: 'VND', dialCode: '+84', languages: ['Vietnamese'] },
  { name: 'Pakistan', iso2: 'PK', currency: 'PKR', dialCode: '+92', languages: ['Urdu', 'English'] },
  { name: 'Bangladesh', iso2: 'BD', currency: 'BDT', dialCode: '+880', languages: ['Bengali'] },
  { name: 'Hong Kong', iso2: 'HK', currency: 'HKD', dialCode: '+852', languages: ['Chinese', 'English'] },
  { name: 'Taiwan', iso2: 'TW', currency: 'TWD', dialCode: '+886', languages: ['Chinese'] },
  { name: 'Sri Lanka', iso2: 'LK', currency: 'LKR', dialCode: '+94', languages: ['Sinhala', 'Tamil'] },

  // Oceania
  { name: 'Australia', iso2: 'AU', currency: 'AUD', dialCode: '+61', languages: ['English'] },
  { name: 'New Zealand', iso2: 'NZ', currency: 'NZD', dialCode: '+64', languages: ['English', 'Maori'] },
].sort((a, b) => a.name.localeCompare(b.name));

export function iso2ToFlagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '🏳️';

  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

export function getCountries(): Country[] {
  return COUNTRY_DATA;
}

export function findCountryByIso2(iso2: string): Country | undefined {
  return COUNTRY_DATA.find(c => c.iso2.toLowerCase() === iso2.toLowerCase());
}

export function findCountryByName(name: string): Country | undefined {
  return COUNTRY_DATA.find(c => c.name.toLowerCase() === name.toLowerCase());
}

export function getCountryCurrency(iso2: string): string | undefined {
  return findCountryByIso2(iso2)?.currency;
}
