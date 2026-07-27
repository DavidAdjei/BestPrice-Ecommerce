// Approximate, hand-set conversion rates to GHS (Ghanaian Cedi), the only
// currency Paystack actually charges in here. These are NOT live rates —
// swap this for a real provider (e.g. exchangerate.host, Open Exchange
// Rates) before relying on this for real transactions. Without this,
// checkout was previously summing raw price numbers regardless of
// currency, so a $20 USD item and a GH₵20 item were charged identically.
const STATIC_RATES_TO_GHS: Record<string, number> = {
  GHS: 1,
  USD: 15.5,
  IDR: 0.00095,
  MXN: 0.8,
  MYR: 3.3,
};

export const convertToGHS = (amount: number, currency: string | null | undefined): number => {
  const rate = STATIC_RATES_TO_GHS[currency ?? "GHS"] ?? 1;
  return amount * rate;
};
