// app/ventas/[ventaId]/page.tsx

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { VentaRow, ClienteRow } from '@/lib/utils/types';
import { formatMoney, formatDateTime } from '@/lib/utils/helpers';

type VentaDbRow = VentaRow & {
  empleado_id: string;
  cliente_id: string | null;
};

type EmpleadoRow = {
  id: string;
  nombre: string | null;
};

type VentaItemRow = {
  id: string;
  cantidad: number;
  precio_unitario: string | number;
  costo_unitario: string | number;
  productos: {
    id: string;
    codigo: string;
    nombre_producto: string;
  } | null;
};

type PageProps = {
  params: { ventaId: string };
};

export default async function VentaDetallePage({ params }: PageProps) {
  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const datas = await params;

  const ventaId = datas.ventaId;

  // 1) Venta base
  const { data: ventaData, error: ventaError } = await supabase
    .from('ventas')
    .select('id, total, pagado, creado_en, empleado_id, cliente_id')
    .eq('id', ventaId)
    .single();

  if (ventaError || !ventaData) {
    return (
      <>
        <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3">
          <div>
            <h1 className="h4 fw-semibold mb-1">Venta</h1>
            <p className="text-muted mb-0">ID: {ventaId}</p>
          </div>
          <Link href="/ventas" className="text-decoration-none">
            ← Volver a ventas
          </Link>
        </header>

        <div className="alert alert-danger">
          Error cargando venta: {ventaError?.message ?? 'Venta no encontrada.'}
        </div>
      </>
    );
  }

  const venta = ventaData as VentaDbRow;

  // 2) Empleado
  const { data: empleadoData } = await supabase
    .from('empleados')
    .select('id, nombre')
    .eq('id', venta.empleado_id)
    .single();

  const empleado = (empleadoData || null) as EmpleadoRow | null;

  // 3) Cliente
  let cliente: ClienteRow | null = null;

  if (venta.cliente_id) {
    const { data: clienteData } = await supabase
      .from('clientes')
      .select('id, nombre, documento, celular, creado_en')
      .eq('id', venta.cliente_id)
      .single();

    cliente = (clienteData || null) as ClienteRow | null;
  }

  // 4) Ítems
  const { data: itemsData, error: itemsError } = await supabase
    .from('ventas_items')
    .select(
      `
      id,
      cantidad,
      precio_unitario,
      costo_unitario,
      productos:producto_id (
        id,
        codigo,
        nombre_producto
      )
    `,
    )
    .eq('venta_id', ventaId)
    .order('id', { ascending: true });

  const items = (itemsData ?? []) as unknown as VentaItemRow[];

  const totalNumero = Number(venta.total ?? 0);
  const pagadoNumero = Number(venta.pagado ?? 0);
  const saldoNumero = totalNumero - pagadoNumero;

  const saldoClass =
    saldoNumero > 0 ? 'badge bg-warning-subtle text-warning-emphasis' : 'badge bg-success-subtle text-success-emphasis';

  return (
    <>
      {/* Header */}
      <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3 flex-wrap">
        <div>
          <h1 className="h4 fw-semibold mb-1">Detalle de venta</h1>
          <p className="text-muted mb-0">ID: {venta.id}</p>
        </div>
        <Link href="/ventas" className="text-decoration-none">
          ← Volver a ventas
        </Link>
      </header>

      {/* Info principal */}
      <div className="row g-3 mb-4">
        {/* Información general */}
        <div className="col-12 col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-2">Información general</h2>
              <div className="small">
                <div className="mb-1">
                  <span className="text-muted">Fecha: </span>
                  <span>{venta.creado_en ? formatDateTime(venta.creado_en) : '—'}</span>
                </div>
                <div className="mb-1">
                  <span className="text-muted">Empleado: </span>
                  <span>{empleado?.nombre ?? '—'}</span>
                </div>
                {cliente && (
                  <div className="mb-1">
                    <span className="text-muted">Cliente: </span>
                    <span>
                      {cliente.nombre}
                      {cliente.documento ? ` (${cliente.documento})` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Totales */}
        <div className="col-12 col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-2">Totales</h2>
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Total</span>
                  <span className="fw-semibold">{formatMoney(venta.total ?? 0)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Pagado</span>
                  <span className="fw-semibold">{formatMoney(venta.pagado ?? 0)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span className="text-muted">Saldo</span>
                  <span className={saldoClass}>{formatMoney(saldoNumero)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ítems */}
      <section>
        <h2 className="h6 fw-semibold mb-3">Ítems de la venta</h2>

        {itemsError && (
          <div className="alert alert-danger mb-3">
            Error cargando ítems: {itemsError.message}
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-dark align-middle">
            <thead className="table-header-purple text-white">
              <tr>
                <th scope="col">Producto</th>
                <th scope="col" className="text-end">
                  Cantidad
                </th>
                <th scope="col" className="text-end">
                  Precio unitario
                </th>
                <th scope="col" className="text-end">
                  Subtotal
                </th>
                <th scope="col" className="text-end">
                  Costo unitario
                </th>
                <th scope="col" className="text-end">
                  Costo total
                </th>
                <th scope="col" className="text-end">
                  Margen
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 text-muted">
                    No hay ítems registrados para esta venta.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const precio = Number(item.precio_unitario ?? 0);
                  const costo = Number(item.costo_unitario ?? 0);
                  const subtotal = precio * item.cantidad;
                  const costoTotal = costo * item.cantidad;
                  const margen = subtotal - costoTotal;

                  return (
                    <tr key={item.id}>
                      <td>
                        {item.productos ? (
                          <>
                            <div className="fw-semibold">{item.productos.nombre_producto}</div>
                            <div className="small text-muted">{item.productos.codigo}</div>
                          </>
                        ) : (
                          <span className="text-muted">Producto eliminado</span>
                        )}
                      </td>
                      <td className="text-end text-nowrap">{item.cantidad}</td>
                      <td className="text-end text-nowrap">
                        {formatMoney(Number(item.precio_unitario ?? 0))}
                      </td>
                      <td className="text-end text-nowrap">
                        {formatMoney(subtotal)}
                      </td>
                      <td className="text-end text-nowrap">
                        {formatMoney(Number(item.costo_unitario ?? 0))}
                      </td>
                      <td className="text-end text-nowrap">
                        {formatMoney(costoTotal)}
                      </td>
                      <td className="text-end text-nowrap">
                        {formatMoney(margen)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
