// app/ventas/page.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { formatMoney, formatDateTime } from '@/lib/utils/helpers';
import type { VentaRow, ClienteRow } from '@/lib/utils/types';

type EmpleadoRow = {
  id: string;
  nombre: string | null;
  documento: string | null;
};

type VentaApiRow = VentaRow & {
  clientes: ClienteRow | null;
  empleados: EmpleadoRow | null;
};

export default async function VentasPage() {
  const headerList = headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : '';

  const cookieHeader = cookies().toString();
  const response = await fetch(`${baseUrl}/api/ventas`, {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });

  if (!response.ok) {
    return (
      <main className="container py-4">
        <h1 className="h4 fw-semibold">Ventas</h1>
        <p className="mt-3 text-danger">
          Error cargando ventas.
        </p>
      </main>
    );
  }

  const payload = (await response.json()) as { ventas: VentaApiRow[] };
  const ventas = payload.ventas ?? [];

  if (ventas.length === 0) {
    return (
      <>
        <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3">
          <div>
            <h1 className="h4 fw-semibold mb-1">Ventas</h1>
            <p className="text-muted mb-0">Total: 0</p>
          </div>
          <Link href="/ventas/nueva" className="btn btn-primary">
            Nueva venta
          </Link>
        </header>

        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle">
            <thead className="table-header-purple text-white">
              <tr>
                <th scope="col">Creado</th>
                <th scope="col">Cliente</th>
                <th scope="col">Empleado</th>
                <th scope="col">Total</th>
                <th scope="col">Pagado</th>
                <th scope="col">Detalle</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={6} className="py-3 text-muted">
                  No hay ventas registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3">
        <div>
          <h1 className="h4 fw-semibold mb-1">Ventas</h1>
          <p className="text-muted mb-0">Total: {ventas.length}</p>
        </div>
        <Link href="/ventas/nueva" className="btn btn-primary">
          Nueva venta
        </Link>
      </header>

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle">
          <thead className="table-header-purple text-white">
            <tr>
              <th scope="col">Creado</th>
              <th scope="col">Cliente</th>
              <th scope="col">Empleado</th>
              <th scope="col">Total</th>
              <th scope="col">Pagado</th>
              <th scope="col">Detalle</th>
            </tr>
          </thead>

          <tbody>
            {ventas.map((v) => {
              const cliente = v.clientes ?? undefined;
              const empleado = v.empleados ?? undefined;

              const clienteTexto = cliente ? cliente.nombre : '—';
              const empleadoTexto = empleado
                ? empleado.nombre ?? 'Sin nombre'
                : '—';

              return (
                <tr key={v.id} className="align-middle table-row-clickable">
                  {/* Creado */}
                  <td>
                    <Link
                      href={`/ventas/${v.id}`}
                      className="d-block w-100 h-100 py-2 text-reset text-decoration-none"
                    >
                      {v.creado_en ? formatDateTime(v.creado_en) : '—'}
                    </Link>
                  </td>

                  {/* Cliente */}
                  <td>
                    {cliente ? (
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="d-block w-100 h-100 py-2 text-reset text-decoration-none"
                      >
                        {clienteTexto}
                      </Link>
                    ) : (
                      <span className="d-block w-100 h-100 py-2 text-muted">
                        —
                      </span>
                    )}
                  </td>

                  {/* Empleado */}
                  <td>
                    <Link
                      href={`/ventas/${v.id}`}
                      className="d-block w-100 h-100 py-2 text-reset text-decoration-none"
                    >
                      {empleadoTexto}
                    </Link>
                  </td>

                  {/* Total */}
                  <td>
                    <Link
                      href={`/ventas/${v.id}`}
                      className="d-block w-100 h-100 py-2 text-reset text-decoration-none"
                    >
                      {formatMoney(v.total)}
                    </Link>
                  </td>

                  {/* Pagado */}
                  <td>
                    <Link
                      href={`/ventas/${v.id}`}
                      className="d-block w-100 h-100 py-2 text-reset text-decoration-none"
                    >
                      {formatMoney(v.pagado)}
                    </Link>
                  </td>

                  {/* Detalle */}
                  <td>
                    <Link
                      href={`/ventas/${v.id}`}
                      className="d-block w-100 h-100 py-2 text-primary text-decoration-none"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
