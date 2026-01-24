import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MovimientoRow } from '@/lib/utils/types';
import { formatDateTime, formatMoney } from '@/lib/utils/helpers';

export default async function InventarioPage() {
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

  const movimientos: MovimientoRow[] = (data ?? []) as unknown as MovimientoRow[];

  return (
    <main>
      <header>
        <div>
          <h1>Inventario</h1>
          <p style={{ marginTop: '0.25rem', color: '#555' }}>
            Últimos {movimientos.length} movimientos
          </p>
        </div>

        <Link href="/inventario/nuevo" className="btn-primary">
          Nuevo movimiento
        </Link>
        {/* Later: link to /inventario/entrada and /inventario/ajuste */}
        {/* <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/inventario/entrada">Reposición</Link>
          <Link href="/inventario/ajuste">Ajuste</Link>
        </div> */}
      </header>

      <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Costo entrada</th>
              <th>Empleado</th>
              <th>Ref. venta</th>
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
                    <td>{formatDateTime(m.creado_en)}</td>

                    <td>
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

                    <td>
                      <span style={tipoBadgeStyle(m.tipo)}>{m.tipo}</span>
                    </td>

                    <td style={{textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <span style={cantidadStyle(qty)}>{qtyLabel}</span>
                    </td>

                    <td style={{textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {m.tipo === 'REPOSICION'
                        ? formatMoney(m.costo_unitario_entrada ?? '')
                        : '—'}
                    </td>

                    <td>
                      {emp?.nombre?.trim()
                        ? emp.nombre
                        : emp?.id
                        ? shortId(emp.id)
                        : '—'}
                    </td>

                    <td>
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

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}
