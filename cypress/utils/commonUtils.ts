export function generatePhoneNumber(): string {
  // Create a new Uint8Array to store our random bytes
  const randomBytes = new Uint8Array(1);
  // Get a cryptographically secure random value
  crypto.getRandomValues(randomBytes);

  // First digit should be 6, 7, 8, or 9 for Indian mobile numbers
  const validFirstDigits = [6, 7, 8, 9];
  const firstDigit = validFirstDigits[randomBytes[0] % validFirstDigits.length];

  // Generate remaining 9 digits using crypto
  const remainingDigits = new Uint8Array(9);
  crypto.getRandomValues(remainingDigits);

  // Convert to string and ensure each digit is 0-9
  const remainingDigitsStr = Array.from(remainingDigits)
    .map((byte) => byte % 10)
    .join("");

  return `${firstDigit}${remainingDigitsStr}`;
}
