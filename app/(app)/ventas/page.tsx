// app/ventas/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type VentaRow = {
  id: string;
  total: string | number | null;
  pagado: string | number | null;
  creado_en: string | null;
  // Support future columns without changing the rendering approach:
  [key: string]: unknown;
};

// Centralized column config so adding columns later is just:
// 1) add to SELECT string
// 2) add to COLUMNS array (optional; you can also auto-render)
type ColumnKey = 'total' | 'pagado' | 'creado_en';

const COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  align?: 'left' | 'right';
  render?: (row: VentaRow) => React.ReactNode;
}> = [
  {
    key: 'creado_en',
    label: 'Creado',
    align: 'left',
    render: (v) => formatDateTime(v.creado_en),
  },
  {
    key: 'total',
    label: 'Total',
    align: 'left',
    render: (v) => formatMoney(v.total),
  },
  {
    key: 'pagado',
    label: 'Pagado',
    align: 'left',
    render: (v) => formatMoney(v.pagado),
  },
];

export default async function VentasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch ventas (include id for key + columns we show)
  // Add more fields here later (e.g. cliente_id, metodo_pago, etc.)
  const select = ['id', ...COLUMNS.map((c) => c.key)].join(', ');

  const { data, error } = await supabase
    .from('ventas')
    .select(select)
    .order('creado_en', { ascending: false });

  if (error) {
    return (
      <main style={{ padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Ventas</h1>
        <p style={{ marginTop: '1rem', color: 'crimson' }}>
          Error cargando ventas: {error.message}
        </p>
      </main>
    );
  }

  const ventas: VentaRow[] = (data ?? []) as VentaRow[];

  return (
    <main style={{ padding: '1.5rem' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Ventas</h1>
          <p style={{ marginTop: '0.25rem', color: '#555' }}>
            Total: {ventas.length}
          </p>
        </div>

        <Link
          href="/ventas/nueva"
          style={{
        display: 'inline-block',
        padding: '0.5rem 1rem',
        backgroundColor: '#7f00e0',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '0.375rem',
        fontSize: '0.95rem',
        fontWeight: 500,
        whiteSpace: 'nowrap',
          }}
        >
          Nueva venta
        </Link>
      </header>

      <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '720px',
          }}
        >
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} style={thStyle}>
                  {c.label}
                </th>
              ))}
              {/* Optional actions column (safe to remove) */}
              <th style={thStyle}>Detalle</th>
            </tr>
          </thead>

          <tbody>
            {ventas.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  style={{ padding: '0.75rem', color: '#666' }}
                >
                  No hay ventas registradas.
                </td>
              </tr>
            ) : (
              ventas.map((v) => (
                <tr key={v.id}>
                  {COLUMNS.map((c) => {
                    const content =
                      c.render?.(v) ?? formatCellValue(v[c.key], c.key);

                    const style =
                      c.align === 'right' ? tdStyleRight : tdStyle;

                    return (
                      <td key={`${v.id}-${c.key}`} style={style}>
                        {content}
                      </td>
                    );
                  })}

                  <td style={tdStyle}>
                    <Link
                      href={`/ventas/${v.id}`}
                      style={{ color: '#0a58ca', textDecoration: 'none' }}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontWeight: 600,
  padding: '0.75rem',
  borderBottom: '1px solid #ddd',
  background: '#7f00e0',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem',
  borderBottom: '1px solid #eee',
  verticalAlign: 'top',
};

const tdStyleRight: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

function formatMoney(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : (value as number);
  if (!Number.isFinite(n)) return String(value);
  return n.toFixed(0);
}

function formatDateTime(value: unknown) {
  if (!value) return '—';
  // Keep it simple and stable server-side; you can localize later if desired.
  // Works if 'creado_en' is an ISO string or Postgres timestamp string.
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function formatCellValue(value: unknown, key?: string) {
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
