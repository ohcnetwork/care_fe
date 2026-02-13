/**
 * Masks a person's name by keeping the first letter of each word
 * and replacing the rest with asterisks.
 *
 * @example maskName("John Doe") => "J** D**"
 */
export function maskName(name: string): string {
  return name
    .split(" ")
    .map((part) =>
      part.length > 0 ? part[0] + "*".repeat(Math.max(part.length - 1, 2)) : "",
    )
    .join(" ");
}

/**
 * Masks a phone number by replacing all but the last 4 digits with asterisks.
 *
 * @example maskPhone("+919876543210") => "*********3210"
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return "*".repeat(phone.length - 4) + phone.slice(-4);
}
