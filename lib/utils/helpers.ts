export function formatMoney(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const n = typeof value === 'string' ? Number(value) : value;

  if (!Number.isFinite(n)) {
    // At this point value is string | number
    return String(value);
  }

  return n.toFixed(0);
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCellValue(value: unknown, key?: string) {
  if (value === null || value === undefined || value === '') return '—';

  // Default formatting fallbacks (helps when you add columns later)
  if (key === 'total' || key === 'pagado') return formatMoney(value as string | number);
  if (key === 'creado_en') return formatDateTime(value as string);

  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;

  // For objects/arrays (e.g. JSON columns), show a compact representation
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function requireNonEmpty(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? '').trim();
  if (!value) throw new Error(`Campo requerido: ${key}`);
  return value;
}

export function parseMoney(formData: FormData, key: string): number {
  const raw = String(formData.get(key) ?? '').trim().replace(',', '.');
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Valor inválido para ${key}`);
  }
  return n;
}

export function parseBoolean(formData: FormData, key: string): boolean {
  // Checkbox: if checked -> "on", else null
  return formData.get(key) === 'on';
}

export function parseIntAllowSign(formData: FormData, key: string): number {
  const raw = String(formData.get(key) ?? '').trim();
  const n = Number(raw);
  if (!Number.isInteger(n)) {
    throw new Error(`Cantidad inválida para ${key}`);
  }
  return n;
}