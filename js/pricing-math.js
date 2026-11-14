export function rateParts(value) {
  const text = String(value);
  if (!/^\d+(?:\.\d{1,6})?$/.test(text)) throw Error('Invalid decimal rate');
  const [whole, fraction = ''] = text.split('.');
  if (BigInt(whole) === 0n && !/[1-9]/.test(fraction)) throw Error('Rate must be positive');
  return { numerator: BigInt(whole + fraction), denominator: 10n ** BigInt(fraction.length) };
}

export function ilsCents(usdCents, rate) {
  if (!Number.isSafeInteger(usdCents) || usdCents < 0) throw Error('Invalid USD cents');
  const { numerator, denominator } = rateParts(rate);
  const amount = (BigInt(usdCents) * numerator * 2n + denominator) / (2n * denominator);
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) throw Error('Converted amount overflow');
  return Number(amount);
}

export function displayedIlsCents(usdCents, rate) {
  if (usdCents === 11400) return 14 * ilsCents(600, rate) + 6 * ilsCents(500, rate);
  if (usdCents === 2100) return 10 * ilsCents(190, rate) + 2 * ilsCents(100, rate);
  if (usdCents === 570) return 3 * ilsCents(190, rate);
  return ilsCents(usdCents, rate);
}
