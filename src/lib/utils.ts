export function formatCurrency(amount: number): string {
  const formatted = amount.toFixed(2);
  const [integerPart, decimalPart] = formatted.split('.');

  const withSpaces = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${withSpaces}.${decimalPart}`;
}
