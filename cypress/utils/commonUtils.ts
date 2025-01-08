export function generatePhoneNumber(): string {
  // First digit should be 6, 7, 8, or 9 for Indian mobile numbers
  const validFirstDigits = [6, 7, 8, 9];
  const firstDigit =
    validFirstDigits[Math.floor(Math.random() * validFirstDigits.length)];

  // Generate remaining 9 digits
  const remainingDigits = Math.random().toString().slice(2, 11);

  return `${firstDigit}${remainingDigits}`;
}
