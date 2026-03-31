import { COUNTRY_DATA, iso2ToFlagEmoji } from './countries';

export interface CountryData {
  name: string;
  code: string; // ISO2
  flag: string; // Emoji flag
  currencyCode: string;
  languages: string[];
}

// Generate emoji flag from ISO2 country code (re-export for compatibility)
export function getCountryFlag(iso2Code: string): string {
  return iso2ToFlagEmoji(iso2Code);
}

// Map local country data to our format
export const COUNTRIES: CountryData[] = COUNTRY_DATA.map(country => ({
  name: country.name,
  code: country.iso2,
  flag: iso2ToFlagEmoji(country.iso2),
  currencyCode: country.currency,
  languages: country.languages || [],
}));

// Get country by ISO2 code
export function getCountryByCode(code: string): CountryData | undefined {
  return COUNTRIES.find(c => c.code.toLowerCase() === code.toLowerCase());
}

// Get country by name
export function getCountryByName(name: string): CountryData | undefined {
  return COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
}

// Get primary language for a country
export function getPrimaryLanguage(countryCode: string): string | undefined {
  const country = getCountryByCode(countryCode);
  return country?.languages[0];
}

// Get all countries
export function getCountries(): CountryData[] {
  return COUNTRIES;
}

// Get currency for a country by code
export function getCountryCurrency(code: string): string | undefined {
  const country = getCountryByCode(code);
  return country?.currencyCode;
}
