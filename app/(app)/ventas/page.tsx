// app/ventas/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatMoney, formatDateTime, formatCellValue } from '@/lib/utils/helpers';

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
    <main>
      <header>
        <div>
          <h1>Ventas</h1>
          <p style={{ marginTop: '0.25rem', color: '#555' }}>
            Total: {ventas.length}
          </p>
        </div>

        <Link href="/ventas/nueva" className='btn-primary'>
          Nueva venta
        </Link>
      </header>

      <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key}>
                  {c.label}
                </th>
              ))}
              {/* Optional actions column (safe to remove) */}
              <th>Detalle</th>
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





