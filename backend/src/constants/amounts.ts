export const MIN_AMOUNTS = {
  TRANSFER: 5,
  DEPOSIT: 10,
  WITHDRAWAL: 10,
} as const;

export const MIN_AMOUNT_MESSAGES = {
  TRANSFER: `Minimum transfer amount is £${MIN_AMOUNTS.TRANSFER}`,
  DEPOSIT: `Minimum deposit is £${MIN_AMOUNTS.DEPOSIT}`,
  WITHDRAWAL: `Minimum withdrawal amount is £${MIN_AMOUNTS.WITHDRAWAL}`,
} as const;