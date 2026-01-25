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