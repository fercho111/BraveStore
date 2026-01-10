// app/(app)/movimientos/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type MovimientoRow = {
  id: string;
  creado_en: string;
  tipo: 'REPOSICION' | 'VENTA' | 'AJUSTE';
  cantidad_cambio: number;
  costo_unitario_entrada: string | number | null;
  nota: string | null;
  referencia_venta_id: string | null;
  productos: {
    id: string;
    codigo: string;
    nombre_producto: string;
  } | null;
  empleados: {
    id: string;
    nombre: string | null;
  } | null;
};

export default async function MovimientosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Global kardex: latest movements first (limit to keep it fast)
  const { data, error } = await supabase
    .from('inventario')
    .select(
      `
      id,
      creado_en,
      tipo,
      cantidad_cambio,
      costo_unitario_entrada,
      nota,
      referencia_venta_id,
      productos:producto_id ( id, codigo, nombre_producto ),
      empleados:empleado_id ( id, nombre )
    `
    )
    .order('creado_en', { ascending: false })
    .limit(200);

  if (error) {
    return (
      <main style={{ padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Movimientos</h1>
        <p style={{ marginTop: '1rem', color: 'crimson' }}>
          Error cargando inventario: {error.message}
        </p>
      </main>
    );
  }

  const movimientos: MovimientoRow[] = (data ?? []) as any;

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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Inventario</h1>
          <p style={{ marginTop: '0.25rem', color: '#555' }}>
            Últimos {movimientos.length} movimientos
          </p>
        </div>

        <Link
        href="/movimientos/nuevo"
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
          Nuevo movimiento
        </Link>
        {/* Later: link to /inventario/entrada and /inventario/ajuste */}
        {/* <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/inventario/entrada">Reposición</Link>
          <Link href="/inventario/ajuste">Ajuste</Link>
        </div> */}
      </header>

      <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '980px',
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Producto</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Cantidad</th>
              <th style={thStyle}>Costo entrada</th>
              <th style={thStyle}>Empleado</th>
              <th style={thStyle}>Ref. venta</th>
              <th style={thStyle}>Nota</th>
            </tr>
          </thead>

          <tbody>
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '0.75rem', color: '#666' }}>
                  No hay movimientos de inventario.
                </td>
              </tr>
            ) : (
              movimientos.map((m) => {
                const prod = m.productos;
                const emp = m.empleados;

                const qty = Number(m.cantidad_cambio);
                const qtyLabel = qty > 0 ? `+${qty}` : String(qty);

                return (
                  <tr key={m.id}>
                    <td style={tdStyle}>{formatDateTime(m.creado_en)}</td>

                    <td style={tdStyle}>
                      {prod ? (
                        <Link
                          href={`/productos/${prod.id}`}
                          style={{ color: '#0a58ca', textDecoration: 'none' }}
                        >
                          {prod.codigo} — {prod.nombre_producto}
                        </Link>
                      ) : (
                        <span style={{ color: '#666' }}>Producto no disponible</span>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <span style={tipoBadgeStyle(m.tipo)}>{m.tipo}</span>
                    </td>

                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <span style={cantidadStyle(qty)}>{qtyLabel}</span>
                    </td>

                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {m.tipo === 'REPOSICION'
                        ? formatMoney(m.costo_unitario_entrada ?? '')
                        : '—'}
                    </td>

                    <td style={tdStyle}>
                      {emp?.nombre?.trim()
                        ? emp.nombre
                        : emp?.id
                        ? shortId(emp.id)
                        : '—'}
                    </td>

                    <td style={tdStyle}>
                      {m.referencia_venta_id ? (
                        <Link
                          href={`/ventas/${m.referencia_venta_id}`}
                          style={{ color: '#0a58ca', textDecoration: 'none' }}
                        >
                          {shortId(m.referencia_venta_id)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td style={tdStyle}>{m.nota ?? '—'}</td>
                  </tr>
                );
              })
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
  whiteSpace: 'nowrap',
};

function tipoBadgeStyle(tipo: MovimientoRow['tipo']): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    borderRadius: 999,
    fontSize: '0.85rem',
    border: '1px solid #ddd',
    background: 'transparent',
  };

  if (tipo === 'REPOSICION') return { ...base, borderColor: '#25f54e', color: '#25f54e' };
  if (tipo === 'VENTA') return { ...base, borderColor: '#e81313', color: '#e81313' };
  return { ...base, borderColor: '#222', color: '#222' }; // AJUSTE
}

function cantidadStyle(qty: number): React.CSSProperties {
  if (qty > 0) return { color: '#25f54e', fontWeight: 600 };
  if (qty < 0) return { color: '#e81313', fontWeight: 600 };
  return { color: '#222' };
}

function formatMoney(value: string | number) {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toFixed(0);
}

function formatDateTime(iso: string) {
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

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}
