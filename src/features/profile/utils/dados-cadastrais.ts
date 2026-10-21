const onlyDigits = (value: string) => value.replace(/\D/g, '');

// Mostra só o começo e o fim do CPF (ex.: 084.***.***-21), como pede a LGPD.
export function maskCpf(cpf: string): string {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) {
    return cpf;
  }
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
}

// Máscara de digitação DD/MM/AAAA.
export function formatDateInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Máscara de digitação (81) 98765-4321, também aceita fixo com 8 dígitos.
export function formatPhoneInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function phoneDigits(value: string): string {
  return onlyDigits(value);
}

// "1988-07-14" -> "14/07/1988"
export function isoToBrDate(iso: string | undefined): string {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

// "14/07/1988" -> "1988-07-14" (sem validar; use parseBrDate para isso)
export function brToIsoDate(br: string): string {
  const match = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

// Data real no calendário (rejeita 31/02, por exemplo).
export function parseBrDate(br: string): Date | null {
  const match = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const isSameDay = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isSameDay ? date : null;
}
