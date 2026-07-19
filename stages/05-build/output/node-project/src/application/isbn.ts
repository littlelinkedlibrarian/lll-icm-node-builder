export function normalizeIsbn(value: string | null | undefined): string | null {
  const normalized = value?.toUpperCase().replace(/[^0-9X]/g, "") ?? "";
  return normalized.length === 10 || normalized.length === 13 ? normalized : null;
}

export function validIsbn(value: string | null | undefined): boolean {
  const isbn = normalizeIsbn(value);
  if (!isbn) return false;
  if (isbn.length === 13) return isbn.split("").reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0) % 10 === 0;
  const total = isbn.split("").reduce((sum, digit, index) => sum + (digit === "X" ? 10 : Number(digit)) * (10 - index), 0);
  return total % 11 === 0;
}

export function validatedIsbn(value: string | null | undefined): string | null {
  const normalized = normalizeIsbn(value);
  return validIsbn(normalized) ? normalized : null;
}
