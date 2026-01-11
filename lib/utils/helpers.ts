export function formatMoney(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : (value as number);
  if (!Number.isFinite(n)) return String(value);
  return n.toFixed(0);
}

export function formatDateTime(value: unknown) {
  if (!value) return '—';
  // Keep it simple and stable server-side; you can localize later if desired.
  // Works if 'creado_en' is an ISO string or Postgres timestamp string.
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

export function formatCellValue(value: unknown, key?: string) {
  if (value === null || value === undefined || value === '') return '—';

  // Default formatting fallbacks (helps when you add columns later)
  if (key === 'total' || key === 'pagado') return formatMoney(value);
  if (key === 'creado_en') return formatDateTime(value);

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
