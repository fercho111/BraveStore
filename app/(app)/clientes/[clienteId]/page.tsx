// app/clientes/[clienteId]/page.tsx

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClienteRow } from '@/lib/utils/types';
import { formatDateTime, formatMoney } from '@/lib/utils/helpers';

type PageProps = {
  params: {
    clienteId: string;
  };
};

type MovimientoCajaRow = {
  id: string;
  tipo: 'CARGO' | 'PAGO';
  monto: number | string;
  medio: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO' | null;
  venta_id: string | null;
  empleado_id: string;
  creado_en: string;
  empleados: {
    id: string;
    nombre: string | null;
  } | null;
};

export default async function ClienteDetallePage({ params }: PageProps) {
  const supabase = await createClient();

  const { clienteId } = await params;

  // 1) Datos del cliente
  const { data: clienteData, error: clienteError } = await supabase
    .from('clientes')
    .select('id, nombre, documento, celular, creado_en')
    .eq('id', clienteId)
    .single();

  if (clienteError) {
    // ID válido pero no encontrado
    if (clienteError.code === 'PGRST116') {
      notFound();
    }
    throw new Error(`Error cargando cliente: ${clienteError.message}`);
  }

  const cliente: ClienteRow = clienteData as ClienteRow;

  // 2) Movimientos de caja del cliente
  const { data: cajaData, error: cajaError } = await supabase
    .from('caja')
    .select(
      `
      id,
      tipo,
      monto,
      medio,
      venta_id,
      empleado_id,
      creado_en,
      empleados:empleado_id (
        id,
        nombre
      )
    `,
    )
    .eq('cliente_id', clienteId)
    .order('creado_en', { ascending: false })
    .limit(200);

  if (cajaError) {
    console.error('Error cargando movimientos de caja:', cajaError.message);
  }

  const movimientos: MovimientoCajaRow[] =
    (cajaData ?? []) as unknown as MovimientoCajaRow[];

  // 3) Saldo actual calculado localmente: sum(CARGO) - sum(PAGO)
  const saldoActual = movimientos.reduce((acc, mov) => {
    const montoNum = Number(mov.monto ?? 0);
    if (mov.tipo === 'CARGO') return acc + montoNum;
    if (mov.tipo === 'PAGO') return acc - montoNum;
    return acc;
  }, 0);

  const saldoClass =
    saldoActual > 0
      ? 'badge bg-warning-subtle text-warning-emphasis'
      : saldoActual < 0
      ? 'badge bg-success-subtle text-success-emphasis'
      : 'badge bg-secondary-subtle text-secondary-emphasis';

  return (
    <>
    {/* Header */}
    <header className="d-flex align-items-baseline justify-content-between gap-3 mb-3 flex-wrap">
        <div>
        <h1 className="h4 fw-semibold mb-1">{cliente.nombre}</h1>
        <p className="text-muted mb-0">
            Cliente ID: <span className="text-body-secondary">{cliente.id}</span>
        </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
        <Link href="/clientes" className="btn btn-outline-light btn-sm">
            ← Volver a clientes
        </Link>
        <Link href="/deudas" className="btn btn-outline-light btn-sm">
            Ver deudas
        </Link>
        </div>
    </header>

    {/* Información del cliente */}
    <section className="card mb-4">
        <div className="card-body">
        <h2 className="h6 fw-semibold mb-3">Información del cliente</h2>

        <dl className="row mb-0">
            <dt className="col-sm-3">Nombre</dt>
            <dd className="col-sm-9">{cliente.nombre}</dd>

            <dt className="col-sm-3">Documento</dt>
            <dd className="col-sm-9">
            {cliente.documento && cliente.documento.trim() !== ''
                ? cliente.documento
                : '—'}
            </dd>

            <dt className="col-sm-3">Celular</dt>
            <dd className="col-sm-9">
            {cliente.celular && cliente.celular.trim() !== ''
                ? cliente.celular
                : '—'}
            </dd>

            <dt className="col-sm-3">Creado</dt>
            <dd className="col-sm-9">{formatDateTime(cliente.creado_en)}</dd>

            <dt className="col-sm-3">Saldo actual</dt>
            <dd className="col-sm-9">
            <span className={saldoClass}>{formatMoney(saldoActual)}</span>
            </dd>
        </dl>
        </div>
    </section>

    {/* Movimientos de caja */}
    <section>
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
        <h2 className="h6 fw-semibold mb-0">Movimientos de caja</h2>
        <p className="text-muted mb-0 small">
            Total de movimientos: {movimientos.length}
        </p>
        </div>

        {movimientos.length === 0 ? (
        <p className="text-muted">
            No hay movimientos de caja registrados para este cliente.
        </p>
        ) : (
        <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
            <thead className="table-header-purple text-white">
                <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Tipo</th>
                <th scope="col" className="text-end">
                    Monto
                </th>
                <th scope="col">Medio</th>
                <th scope="col">Empleado</th>
                <th scope="col">Venta ref.</th>
                </tr>
            </thead>
            <tbody>
                {movimientos.map((m) => {
                const empleadoNombre =
                    m.empleados?.nombre && m.empleados.nombre.trim() !== ''
                    ? m.empleados.nombre
                    : shortId(m.empleado_id);

                return (
                    <tr key={m.id}>
                    {/* Fecha */}
                    <td className="text-nowrap">
                        {formatDateTime(m.creado_en)}
                    </td>

                    {/* Tipo */}
                    <td>
                        <span className={tipoBadgeClass(m.tipo)}>{m.tipo}</span>
                    </td>

                    {/* Monto */}
                    <td className="text-end text-nowrap">
                        {formatMoney(Number(m.monto ?? 0))}
                    </td>

                    {/* Medio */}
                    <td className="text-nowrap">
                        {m.medio
                        ? formatMedio(m.medio)
                        : m.tipo === 'CARGO'
                        ? '—'
                        : '—'}
                    </td>

                    {/* Empleado */}
                    <td className="text-nowrap">{empleadoNombre}</td>

                    {/* Venta ref */}
                    <td className="text-nowrap">
                        {m.venta_id ? (
                        <Link
                            href={`/ventas/${m.venta_id}`}
                            className="text-primary text-decoration-none"
                        >
                            {shortId(m.venta_id)}
                        </Link>
                        ) : (
                        '—'
                        )}
                    </td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        </div>
        )}
    </section>
    </>
  );
}

/* ---- Helpers de presentación muy simples ---- */

function tipoBadgeClass(tipo: 'CARGO' | 'PAGO'): string {
  if (tipo === 'CARGO') {
    return 'badge rounded-pill border border-warning text-warning';
  }
  // PAGO
  return 'badge rounded-pill border border-success text-success';
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function formatMedio(medio: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO'): string {
  if (medio === 'EFECTIVO') return 'Efectivo';
  if (medio === 'TRANSFERENCIA') return 'Transferencia';
  return 'Otro';
}
