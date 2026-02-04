// app/ventas/page.tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatMoney, formatDateTime } from '@/lib/utils/helpers';
import type { VentaRow, ClienteRow } from '@/lib/utils/types';

type EmpleadoRow = {
  id: string;
  nombre: string | null;
  documento: string | null;
};

export default async function VentasPage() {
  const supabase = await createClient();

  // 1) Ventas (incluyendo cliente_id y empleado_id)
  const { data: ventasData, error: ventasError } = await supabase
    .from('ventas')
    .select('id, creado_en, total, pagado, cliente_id, empleado_id')
    .order('creado_en', { ascending: false });

  if (ventasError) {
    return (
      <main className="container py-4">
        <h1 className="h4 fw-semibold">Ventas</h1>
        <p className="mt-3 text-danger">
          Error cargando ventas: {ventasError.message}
        </p>
      </main>
    );
  }

  const ventas =
    (ventasData ?? []) as (VentaRow & {
      cliente_id: string | null;
      empleado_id: string | null;
    })[];

  // Si no hay ventas, no hacemos más queries; mostramos tabla vacía con el mismo diseño
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

  // 2) Reunimos ids únicos de clientes y empleados
  const clienteIds = Array.from(
    new Set(
      ventas
        .map((v) => v.cliente_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const empleadoIds = Array.from(
    new Set(
      ventas
        .map((v) => v.empleado_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  // 3) Cargamos solo los clientes necesarios
  const clientesById = new Map<string, ClienteRow>();
  if (clienteIds.length > 0) {
    const { data: clientesData } = await supabase
      .from('clientes')
      .select('id, nombre, documento, celular, creado_en')
      .in('id', clienteIds);

    (clientesData ?? []).forEach((c) => {
      const cliente = c as ClienteRow;
      clientesById.set(cliente.id, cliente);
    });
  }

  // 4) Cargamos solo los empleados necesarios
  const empleadosById = new Map<string, EmpleadoRow>();
  if (empleadoIds.length > 0) {
    const { data: empleadosData } = await supabase
      .from('empleados')
      .select('id, nombre, documento')
      .in('id', empleadoIds);

    (empleadosData ?? []).forEach((e) => {
      const empleado = e as EmpleadoRow;
      empleadosById.set(empleado.id, empleado);
    });
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
              const cliente = v.cliente_id
                ? clientesById.get(v.cliente_id)
                : undefined;
              const empleado = v.empleado_id
                ? empleadosById.get(v.empleado_id)
                : undefined;

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
