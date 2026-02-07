import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { MovimientoRow } from '@/lib/utils/types';
import { formatDateTime, formatMoney } from '@/lib/utils/helpers';

export default async function InventarioPage() {
  const headerList = headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : '';

  const cookieHeader = cookies().toString();
  const response = await fetch(`${baseUrl}/api/inventario`, {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });

  if (!response.ok) {
    return (
      <>
        <h1 className="h4 fw-semibold">Movimientos</h1>
        <div className="alert alert-danger mt-3">
          Error cargando inventario.
        </div>
      </>
    );
  }

  const payload = (await response.json()) as { movimientos: MovimientoRow[] };
  const movimientos = payload.movimientos ?? [];

  return (
    <>
      <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3 flex-wrap">
        <div>
          <h1 className="h4 fw-semibold mb-1">Inventario</h1>
          <p className="text-muted mb-0">
            Últimos {movimientos.length} movimientos
          </p>
        </div>

        <Link href="/inventario/nuevo" className="btn btn-primary">
          Nuevo movimiento
        </Link>
      </header>

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle">
          <thead className="table-header-purple text-white">
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Producto</th>
              <th scope="col">Tipo</th>
              <th scope="col" className="text-end">
                Cantidad
              </th>
              <th scope="col" className="text-end">
                Costo entrada
              </th>
              <th scope="col">Empleado</th>
              <th scope="col">Ref. venta</th>
            </tr>
          </thead>

          <tbody>
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-3 text-muted">
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
                    <td className="text-nowrap">
                      {formatDateTime(m.creado_en)}
                    </td>

                    <td>
                      {prod ? (
                        <Link
                          href={`/productos/${prod.id}`}
                          className="text-reset text-decoration-none"
                        >
                          <div className="fw-semibold">
                            {prod.codigo} — {prod.nombre_producto}
                          </div>
                        </Link>
                      ) : (
                        <span className="text-muted">Producto no disponible</span>
                      )}
                    </td>

                    <td>
                      <span className={tipoBadgeClass(m.tipo)}>{m.tipo}</span>
                    </td>

                    <td className="text-end text-nowrap">
                      <span className={cantidadClass(qty)}>{qtyLabel}</span>
                    </td>

                    <td className="text-end text-nowrap">
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
                          className="text-primary text-decoration-none"
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
    </>
  );
}

function tipoBadgeClass(tipo: MovimientoRow['tipo']): string {
  if (tipo === 'REPOSICION') {
    return 'badge rounded-pill border border-success text-success';
  }
  if (tipo === 'VENTA') {
    return 'badge rounded-pill border border-danger text-danger';
  }
  // AJUSTE u otros
  return 'badge rounded-pill border border-light text-light';
}

function cantidadClass(qty: number): string {
  if (qty > 0) return 'text-success fw-semibold';
  if (qty < 0) return 'text-danger fw-semibold';
  return 'text-body-secondary';
}

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}
