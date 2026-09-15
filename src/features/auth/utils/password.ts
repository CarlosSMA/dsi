const MIN_LENGTH = 6;
const HAS_LETTER = /[a-zA-Z]/;
const HAS_NUMBER = /\d/;
const HAS_SYMBOL = /[^a-zA-Z0-9]/;

export function isValidPassword(value: string): boolean {
  return (
    value.length >= MIN_LENGTH &&
    HAS_LETTER.test(value) &&
    HAS_NUMBER.test(value) &&
    HAS_SYMBOL.test(value)
  );
}
