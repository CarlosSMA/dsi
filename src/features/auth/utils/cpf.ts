const CPF_LENGTH = 11;

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, CPF_LENGTH);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== CPF_LENGTH || /^\d$/.test(digits) || /^([0-9])\1+$/.test(digits)) {
    return false;
  }

  const firstDigit = calculateCheckDigit(digits.slice(0, 9));
  const secondDigit = calculateCheckDigit(digits.slice(0, 9) + firstDigit);

  return digits === `${digits.slice(0, 9)}${firstDigit}${secondDigit}`;
}

function calculateCheckDigit(digits: string): number {
  const weight = digits.length + 1;
  const sum = digits
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (weight - index), 0);

  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}