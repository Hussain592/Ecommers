/** Digits of a Pakistani mobile number in local form (03XXXXXXXXX), or null. */
function localMobileDigits(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(4);
  else if (digits.startsWith("92")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("3")) digits = `0${digits}`;
  return /^03\d{9}$/.test(digits) ? digits : null;
}

/** Accepts 0300-1234567, 03001234567, +92 300 1234567 and similar. */
export function isPakistaniMobile(value: string): boolean {
  return localMobileDigits(value) !== null;
}

/** Formats a valid number as 0300-1234567; returns the trimmed input otherwise. */
export function normalizePakistaniMobile(value: string): string {
  const digits = localMobileDigits(value);
  return digits ? `${digits.slice(0, 4)}-${digits.slice(4)}` : value.trim();
}
