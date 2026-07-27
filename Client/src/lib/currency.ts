const SYMBOLS: Record<string, string> = {
  GHS: "GH\u20B5",
  USD: "$",
  IDR: "Rp",
  MXN: "MX$",
  MYR: "RM",
};

export const formatPrice = (amount: number, currency?: string | null) => {
  const code = currency || "GHS";
  const symbol = SYMBOLS[code] ?? `${code} `;
  const formatted =
    code === "IDR"
      ? Math.round(amount).toLocaleString() // IDR isn't typically shown with decimals
      : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbol}${formatted}`;
};

export const discountPercent = (price: number, originalPrice?: number | null) => {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};
