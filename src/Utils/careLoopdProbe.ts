/**
 * Sums a list of numeric line amounts.
 *
 * Temporary utility added to validate the care-loopd headless orchestrator's CI round-trip
 * (push → poll → triage). Safe to remove; not wired into any screen.
 */
export function sumAmounts(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}
